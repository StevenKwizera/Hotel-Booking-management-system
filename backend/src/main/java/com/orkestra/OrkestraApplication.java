package com.orkestra;

import com.orkestra.config.DotEnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OrkestraApplication {

    public static void main(String[] args) {
        DotEnvLoader.load();
        SpringApplication.run(OrkestraApplication.class, args);
    }
}
