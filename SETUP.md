# Whoami — Phase 1 Setup Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or hosted)
- `openssl` (to generate secrets)

---

## 1. Set up PostgreSQL

### Option A: Local via Homebrew (macOS)

```bash
brew install postgresql@16
brew services start postgresql@16

# Create the database and user
psql postgres
```

Inside `psql`:
```sql
CREATE USER whoami_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE whoami OWNER whoami_user;
\q
```

### Option B: Docker (quickest)

```bash
docker run --name whoami-pg \
  -e POSTGRES_USER=whoami_user \
  -e POSTGRES_PASSWORD=your_strong_password \
  -e POSTGRES_DB=whoami \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Option C: Hosted (Neon, Supabase, Railway)

Create a free project and copy the connection string from the dashboard.

---

## 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Replace with your actual connection string
DATABASE_URL="postgresql://whoami_user:your_strong_password@localhost:5432/whoami"

# Generate a strong secret:
#   openssl rand -base64 32
NEXTAUTH_SECRET="paste-the-generated-secret-here"

# URL your app is accessible at
NEXTAUTH_URL="http://localhost:3000"
```

---

## 3. Run database migrations

> Make sure PostgreSQL is running and `DATABASE_URL` is set in `.env`.

```bash
npx prisma migrate dev --name init
```

This will:
1. Connect to your database
2. Create all tables (users, accounts, sessions, verification_tokens, audit_logs)
3. Generate the Prisma client

If you ever change the schema, run:
```bash
npx prisma migrate dev --name describe_your_change
```

To inspect the database visually:
```bash
npx prisma studio
```

---

## 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/register` | Create account |
| `/login` | Sign in |
| `/dashboard` | Main dashboard (protected) |
| `/budget` | Budget module placeholder |
| `/journal` | Journal module placeholder |
| `/calendar` | Calendar module placeholder |
| `/notes` | Notes module placeholder |
| `/reminders` | Reminders module placeholder |

---

## Security checklist

- [x] Argon2id password hashing (`@node-rs/argon2`)
- [x] NextAuth.js v5 JWT sessions with httpOnly cookies
- [x] Zod validation on all form inputs and API routes
- [x] Rate limiting (5 attempts / 15 min per IP) on auth endpoints
- [x] Audit logging to DB for all auth events
- [x] Security headers on all responses (CSP, HSTS, X-Frame-Options, etc.)
- [x] Route protection middleware — redirects unauthenticated users to /login
- [x] Environment variable validation with Zod
- [x] No sensitive data exposed in client-side code or logs

---

## Production deployment checklist

1. Set `NODE_ENV=production`
2. Use a strong `NEXTAUTH_SECRET` (32+ bytes)
3. Set `NEXTAUTH_URL` to your production domain
4. Use a hosted PostgreSQL instance (Neon, Supabase, RDS, etc.)
5. Run `npm run build` and `npm start`
6. Put behind HTTPS (required for HSTS and secure cookies)
7. Consider upgrading in-memory rate limiter to Redis (`ioredis` / Upstash)
