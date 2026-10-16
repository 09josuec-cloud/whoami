# Whoami

A personal life dashboard I built to learn modern web tools and automate things in my own life. It brings budget, calendar, journal, notes, reminders, and habits into one place, with an AI assistant and scheduled automations on top.

This is a personal learning project, not a commercial product.

## What it automates

**Scheduled AI digest.** A Vercel Cron job runs daily, checks each user's digest settings, collects their week of data, has Claude write a short summary, and emails it through Resend. Only the scheduler can call the endpoint (it checks a secret token), and errors are logged per user so one failure does not stop the rest.

**AI assistant with tools.** An assistant built on the Anthropic API can take real actions from a plain English request, such as creating calendar events, reminders, and notes. Every request is validated with Zod before anything runs, and the endpoint is rate limited.

**Integrations.**
* Google Calendar through OAuth, to connect an account and sync events
* Plaid API, to link bank accounts and pull transactions automatically (runs in Plaid's sandbox with test accounts, so no real financial data is used)

**Documentation.** A script generates the project's documentation as PDFs automatically.

## How it's built and hosted

| Piece | Tool |
|---|---|
| App framework | Next.js (React, TypeScript) |
| Hosting and deploys | Vercel, deploys automatically on every push to `main` |
| Database | Hosted PostgreSQL, managed with Prisma (schema and migrations) |
| Auth | Auth.js (NextAuth) |
| Email | Resend |
| SMS verification | Twilio |
| AI | Anthropic API (Claude) |
| Scheduled jobs | Vercel Cron |

All API keys and secrets are stored as environment variables in Vercel, not in the code. See `.env.example` for the list of settings (placeholder values only).

## Security

* Two factor authentication (authenticator app) and email verification
* Passwords hashed with Argon2
* Rate limits on authentication, bank sync, and AI endpoints
* Audit logs for account security events (registration, email verification, password changes, two factor changes)
* Bank sync logs record counts only, never account details or transactions
* Input validation with Zod on routes that accept user data

## Running it locally

```bash
npm install
cp .env.example .env    # fill in your own values
npx prisma migrate dev
npm run dev
```

Then open http://localhost:3000. Full setup steps are in `SETUP.md`.
