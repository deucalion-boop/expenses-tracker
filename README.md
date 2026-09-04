# SpendWise

SpendWise is a full-stack personal finance tracker built with React + Vite, Express, and Supabase.

## Features

- User authentication
- Income and expense tracking
- Dashboard summaries
- Analytics and recent transactions
- Responsive UI

## Tech Stack

- Frontend: React, Vite, React Router, Recharts
- Backend: Node.js, Express, Supabase Auth, Supabase Postgres

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a Supabase project, open its SQL Editor, and run
`supabase/migrations/001_initial_schema.sql`. Then copy `backend/.env.example` to
`backend/.env` and `frontend/.env.example` to `frontend/.env`, and enter your project
URL and API keys. The secret key belongs only in the backend environment and must never
be exposed through a `VITE_` variable.

New accounts use Supabase Auth. The database trigger in the migration automatically
creates each account's profile, while the Express API stores income and expenses in
Supabase Postgres.

For password recovery, add `http://localhost:5173/reset-password` under Supabase
**Authentication → URL Configuration → Redirect URLs**. Add the equivalent URL for
your deployed frontend as well (for example, `https://your-app.com/reset-password`).

After installing the initial schema, run `supabase/migrations/002_financial_planning.sql`
in the SQL Editor to add budgets, recurring transactions, preferences, audit logs,
and supporting indexes.

Supabase Auth owns password/JWT security and login throttling; adjust production limits
under **Authentication → Rate Limits**. The Express API also limits requests globally.
Set `SENTRY_DSN` in `backend/.env` to enable server error monitoring.

## Deploying to Vercel

The root `vercel.json` deploys the Vite frontend and Express API together with Vercel
Services. Import the repository in Vercel, keep the project root at the repository root,
and select **Services** as the Framework Preset. Add these environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET` (a long random value)
- `SENTRY_DSN` (optional)

`VITE_API_URL` can be omitted on Vercel because the frontend automatically uses `/api`.
The hourly Vercel cron safely catches up recurring transactions that became due while
the application was inactive. Add the final deployment URL and its `/reset-password`
path to the Supabase Auth redirect allow list.

The administrator dashboard supports user search, role and account-status management,
user removal, platform statistics, registration control, and a support contact setting.

## License

This project is for personal use and demo purposes.
