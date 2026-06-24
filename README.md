# Orkestra Hospitality Management System

Full-stack hospitality platform for **Net Luna Villa Hotel** and **Adventist University of Central Africa (AUCA)**.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Spring Boot 3.4, Spring Security JWT |
| Database | PostgreSQL 16 (local install — no Docker) |

## Quick start (full system)

### 1. PostgreSQL

Install PostgreSQL locally, then create the database:

```bash
psql -U postgres -f backend/database/setup-orkestra.sql
```

Default connection (configured in `backend/src/main/resources/application.yml`):

| Setting | Value |
|---------|--------|
| Host | `localhost` |
| Port | `5432` |
| Database | `orkestra` |
| User | `postgres` |
| Password | `ksteven` |

Override with environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

**Fresh seed:** If you need to reload demo data, drop and recreate the database, then restart the backend.

### 2. Backend API (port 8080)

```bash
cd backend
mvn spring-boot:run
```

On first run, Hibernate creates tables and `DataSeeder` inserts **real Net Luna Villa operational data** (bookings, guests, payments, services, AI recommendations).

See [backend/README.md](backend/README.md) for API details.

### 3. Frontend (port 5173)

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

### Email for OTP / password reset

Configure SMTP on the backend so sign-in OTP and password-reset codes are emailed (see [backend/README.md](backend/README.md#email-otp--password-reset)).

### Login

**Primary admin**

| Email | Password |
|-------|----------|
| `stevegatanazi@gmail.com` | `Orkestra@2026` |

**Demo accounts** — password: **`password123`**

| Role | Email |
|------|--------|
| Admin (demo) | admin@orkestra.com |
| Guest | guest@orkestra.com |
| Receptionist | receptionist@orkestra.com |
| Staff | staff@orkestra.com |
| Finance | finance@orkestra.com |
| Management | management@orkestra.com |

## Project structure

```
├── src/                      # React frontend
├── backend/                  # Spring Boot API
├── backend/database/         # PostgreSQL setup SQL
└── README.md
```

## Modules (10)

1. Reservations & Booking  
2. Check-in / Check-out  
3. Guest Management  
4. AI Personalization (data-driven from PostgreSQL)  
5. Payments (IremboPay-ready)  
6. Services & Operations  
7. Reporting & Analytics  
8. Communications  
9. Multi-Hotel  
10. Security & Access Control  

## Environment

Copy `.env.example` to `.env` if needed:

```
VITE_API_URL=http://localhost:8080/api
```
