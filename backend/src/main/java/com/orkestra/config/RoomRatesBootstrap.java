package com.orkestra.config;

import com.orkestra.service.RoomRates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Keeps PostgreSQL room rates and open booking totals aligned with {@link RoomRates}. */
@Component
@Order(1)
public class RoomRatesBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RoomRatesBootstrap.class);

    private final JdbcTemplate jdbcTemplate;

    public RoomRatesBootstrap(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        jdbcTemplate.update("UPDATE rooms SET nightly_rate = ? WHERE room_type = 'STANDARD'", RoomRates.STANDARD);
        jdbcTemplate.update("UPDATE rooms SET nightly_rate = ? WHERE room_type = 'DELUXE'", RoomRates.DELUXE);
        jdbcTemplate.update("UPDATE rooms SET nightly_rate = ? WHERE room_type = 'SUITE'", RoomRates.SUITE);
        int bookings = jdbcTemplate.update(
                """
                UPDATE bookings SET amount_rwf = (
                  CASE room_type
                    WHEN 'STANDARD' THEN ?
                    WHEN 'DELUXE' THEN ?
                    WHEN 'SUITE' THEN ?
                    ELSE ?
                  END
                ) * (check_out - check_in)
                WHERE status IN ('PENDING', 'APPROVED')
                """,
                RoomRates.STANDARD,
                RoomRates.DELUXE,
                RoomRates.SUITE,
                RoomRates.STANDARD);
        log.info(
                "Room rates synced — Standard {} / Deluxe {} / Suite {} RWF; {} open booking(s) recalculated",
                RoomRates.STANDARD,
                RoomRates.DELUXE,
                RoomRates.SUITE,
                bookings);
    }
}
