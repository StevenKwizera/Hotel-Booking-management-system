package com.orkestra.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Loads {@code backend/.env} (or {@code .env} when run from backend/) into system properties
 * so Spring can resolve ${MAIL_PASSWORD} and similar placeholders.
 */
public final class DotEnvLoader {

    private DotEnvLoader() {}

    public static void load() {
        for (Path candidate : List.of(Path.of(".env"), Path.of("backend", ".env"))) {
            if (Files.isRegularFile(candidate)) {
                loadFile(candidate);
                return;
            }
        }
    }

    private static void loadFile(Path envFile) {
        try {
            for (String raw : Files.readAllLines(envFile)) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {
            // Spring will use defaults from application.yml
        }
    }
}
