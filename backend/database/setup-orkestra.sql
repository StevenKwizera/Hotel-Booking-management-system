-- Orkestra Hospitality Management System
-- Net Luna Villa Hotel | PostgreSQL setup (no Docker)
--
-- Run once in psql or pgAdmin as a superuser (usually postgres):
--   psql -U postgres -f setup-orkestra.sql

CREATE DATABASE orkestra
  WITH ENCODING 'UTF8'
       LC_COLLATE = 'en_US.UTF-8'
       LC_CTYPE = 'en_US.UTF-8'
       TEMPLATE template0;

COMMENT ON DATABASE orkestra IS 'Orkestra HMS — Net Luna Villa Hotel & AUCA';
