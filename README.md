# Expense Tracker

A full-stack personal expense tracker built with React + Vite on the frontend and Express + MongoDB on the backend.

## Features

- User authentication
- Income and expense tracking
- Dashboard summaries
- Analytics and recent transactions
- Responsive UI

## Tech Stack

- Frontend: React, Vite, React Router, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose

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

Copy `backend/.env.example` to `backend/.env`, then set your MongoDB connection string,
JWT secret, and initial admin credentials. On startup, the backend creates the admin
account if it does not exist. Public registration can never create an administrator.

`MONGODB_URI` is required. The server will stop with a clear configuration error if it
is missing, preventing accounts and transactions from being stored in a temporary
in-memory database. For a local MongoDB installation, use
`mongodb://127.0.0.1:27017/expense-tracker`.

The administrator dashboard supports user search, role and account-status management,
user removal, platform statistics, registration control, and a support contact setting.

## License

This project is for personal use and demo purposes.
