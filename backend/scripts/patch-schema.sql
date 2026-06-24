-- Run against the orkestra database if booking/payment inserts fail with missing columns.
-- psql -h localhost -U postgres -d orkestra -f scripts/patch-schema.sql

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS charges_verified boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkout_requested boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_arrived boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_issued_at timestamp with time zone;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE payments ADD COLUMN IF NOT EXISTS finance_verified boolean DEFAULT false;
UPDATE payments SET finance_verified = false WHERE finance_verified IS NULL;
UPDATE payments SET method = 'PAYPACK' WHERE method IS NULL OR method <> 'PAYPACK';
ALTER TABLE payments ALTER COLUMN finance_verified SET DEFAULT false;
ALTER TABLE payments ALTER COLUMN finance_verified SET NOT NULL;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
  'PENDING', 'APPROVED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'CHECKED_OUT'
));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('PAYPACK'));
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN (
  'PENDING', 'COMPLETED', 'REFUNDED', 'FLAGGED'
));
