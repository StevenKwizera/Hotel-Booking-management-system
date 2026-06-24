package com.orkestra.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Applies idempotent PostgreSQL patches when Hibernate ddl-auto misses columns
 * (common when NOT NULL columns are added to tables that already have rows).
 */
@Component
@Order(0)
public class DatabaseSchemaPatcher implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaPatcher.class);

    private static final String[] PATCHES = {
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS charges_verified boolean NOT NULL DEFAULT false",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_requested boolean NOT NULL DEFAULT false",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_arrived boolean NOT NULL DEFAULT false",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_issued_at timestamp with time zone",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS finance_verified boolean DEFAULT false",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmation_email varchar(255)",
            "UPDATE payments SET finance_verified = false WHERE finance_verified IS NULL",
            "ALTER TABLE payments ALTER COLUMN finance_verified SET DEFAULT false",
            "ALTER TABLE payments ALTER COLUMN finance_verified SET NOT NULL",
            "ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check",
            """
            ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
              'PENDING', 'APPROVED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'CHECKED_OUT'
            ))
            """,
            "ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check",
            "UPDATE payments SET method = 'PAYPACK' WHERE method IS NULL OR UPPER(method) <> 'PAYPACK'",
            "ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('PAYPACK'))",
            "ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check",
            """
            ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN (
              'PENDING', 'COMPLETED', 'REFUNDED', 'FLAGGED'
            ))
            """,
            "UPDATE rooms SET nightly_rate = 100 WHERE room_type = 'STANDARD'",
            "UPDATE rooms SET nightly_rate = 170 WHERE room_type = 'DELUXE'",
            "UPDATE rooms SET nightly_rate = 200 WHERE room_type = 'SUITE'",
            """
            UPDATE bookings SET amount_rwf = (
              CASE room_type
                WHEN 'STANDARD' THEN 100
                WHEN 'DELUXE' THEN 170
                WHEN 'SUITE' THEN 200
                ELSE 100
              END
            ) * (check_out - check_in)
            WHERE status IN ('PENDING', 'APPROVED')
            """,
            """
            CREATE TABLE IF NOT EXISTS guest_feedback (
              id uuid PRIMARY KEY,
              feedback_code varchar(255) NOT NULL UNIQUE,
              guest_user_id uuid REFERENCES users(id),
              guest_name varchar(255) NOT NULL,
              guest_email varchar(255),
              room varchar(64),
              rating integer NOT NULL,
              category varchar(32) NOT NULL,
              subject varchar(255),
              message varchar(2000) NOT NULL,
              created_at timestamp with time zone DEFAULT now()
            )
            """,
            "ALTER TABLE guest_feedback DROP CONSTRAINT IF EXISTS guest_feedback_category_check",
            """
            ALTER TABLE guest_feedback ADD CONSTRAINT guest_feedback_category_check CHECK (category IN (
              'COMPLAINT', 'STAY', 'ROOM', 'SERVICE', 'STAFF', 'OTHER'
            ))
            """,
            "ALTER TABLE guest_feedback ADD COLUMN IF NOT EXISTS staff_reply varchar(2000)",
            "ALTER TABLE guest_feedback ADD COLUMN IF NOT EXISTS replied_by_name varchar(255)",
            "ALTER TABLE guest_feedback ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gross_amount_rwf bigint NOT NULL DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_rwf bigint NOT NULL DEFAULT 0",
            "UPDATE bookings SET gross_amount_rwf = amount_rwf WHERE gross_amount_rwf = 0 OR gross_amount_rwf IS NULL",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS early_booking_discount boolean NOT NULL DEFAULT false",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS repeat_guest_discount boolean NOT NULL DEFAULT false",
            """
            CREATE TABLE IF NOT EXISTS meal_orders (
              id uuid PRIMARY KEY,
              order_code varchar(255) NOT NULL UNIQUE,
              guest_user_id uuid REFERENCES users(id),
              guest_name varchar(255) NOT NULL,
              guest_email varchar(255),
              room varchar(64) NOT NULL,
              meal_category varchar(32) NOT NULL,
              status varchar(32) NOT NULL,
              total_rwf bigint NOT NULL DEFAULT 0,
              guest_notes varchar(1000),
              rejection_reason varchar(1000),
              server_name varchar(255),
              payment_code varchar(255),
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now()
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS meal_order_lines (
              id uuid PRIMARY KEY,
              meal_order_id uuid NOT NULL REFERENCES meal_orders(id) ON DELETE CASCADE,
              menu_item_id varchar(64) NOT NULL,
              item_name varchar(255) NOT NULL,
              unit_price_rwf bigint NOT NULL,
              quantity integer NOT NULL,
              line_total_rwf bigint NOT NULL
            )
            """,
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS meal_order_id uuid REFERENCES meal_orders(id)",
    };

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaPatcher(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        for (String sql : PATCHES) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.debug("Schema patch skipped or already applied: {} — {}", sql, e.getMessage());
            }
        }
        log.info("Database schema patches applied");
    }
}
