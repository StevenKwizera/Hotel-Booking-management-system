# Orkestra Backend API

Spring Boot 3.4 + PostgreSQL REST API for the Orkestra Hospitality Management System.

## Prerequisites

- Java 17+
- Maven 3.9+
- **PostgreSQL 16** installed locally (no Docker)

## Database setup

1. Ensure PostgreSQL is running (Windows service `postgresql-x64-17` or similar).
2. Create the database (password `ksteven` for user `postgres`):

**Windows (PowerShell):**

```powershell
.\scripts\setup-database.ps1
```

**Or manually:**

```bash
psql -U postgres -f database/setup-orkestra.sql
```

3. Default credentials in `application.yml`:

| Variable | Default |
|----------|---------|
| `DB_HOST` | localhost |
| `DB_PORT` | 5432 |
| `DB_NAME` | orkestra |
| `DB_USER` | postgres |
| `DB_PASSWORD` | ksteven |

## Email (OTP & password reset)

Login OTP (Admin, Management, Finance) and password-reset codes are sent by **real email** when SMTP is configured.

Set these environment variables before starting the API (example: Gmail with an [App Password](https://support.google.com/accounts/answer/185833)):

| Variable | Example |
|----------|---------|
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | `your.email@gmail.com` |
| `MAIL_PASSWORD` | your app password |
| `MAIL_FROM` | same as `MAIL_USERNAME` (optional) |

If `MAIL_USERNAME` is empty, codes are **logged to the backend console** only (development fallback).

## Run the API

```bash
mvn spring-boot:run
```

API: **http://localhost:8080**  
Health: **http://localhost:8080/api/health**

On first startup:

- Hibernate `ddl-auto: update` creates/updates tables.
- `DataSeeder` loads Net Luna Villa Kigali data (branches, 48 rooms, staff, 2 guests, bookings, payments, services).
- `PersonalizationService` generates AI recommendations from **real guest records** (stay, balance, tier, preferences).

## Primary administrator

| Field | Value |
|-------|--------|
| Email | `stevegatanazi@gmail.com` |
| Password | `Orkestra@2026` (override with `ORKESTRA_ADMIN_PASSWORD`) |

This account is created or updated on every API startup via `PrimaryAdminBootstrap`.

## Demo accounts

Password for demo users below: **`password123`**

| Role | Email |
|------|--------|
| Admin | stevegatanazi@gmail.com |
| Admin (demo) | admin@orkestra.com |
| Management | management@orkestra.com |
| Receptionist | receptionist@orkestra.com |
| Staff | staff@orkestra.com |
| Finance | finance@orkestra.com |
| Guest | guest@orkestra.com |

## API modules

| Module | Base path |
|--------|-----------|
| Auth | `/api/auth` |
| Bookings | `/api/bookings` |
| Payments | `/api/payments` |
| Services | `/api/services` |
| Guests & AI | `/api/guests` |
| Notifications | `/api/notifications` |
| Analytics | `/api/analytics` |
| Workflows | `/api/workflows` |

AI endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/guests/recommendations` | Guest recommendations from DB |
| `GET /api/guests/ai/insights` | All guest insights (staff/admin) |
| `GET /api/guests/ai/stats` | AI engine statistics |
| `POST /api/guests/ai/refresh` | Regenerate recommendations from live data |

All protected routes require: `Authorization: Bearer <token>`

## Build JAR

```bash
mvn clean package -DskipTests
java -jar target/orkestra-api-1.0.0.jar
```
