export const mapProfile = (row) => ({
  _id: row.id,
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  currency: row.currency || 'PHP',
  dateFormat: row.date_format || 'MMM d, yyyy',
  theme: row.theme || 'light',
  dashboardPeriod: row.dashboard_period || 'month',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapExpense = (row) => ({
  _id: row.id,
  title: row.title,
  amount: Number(row.amount),
  category: row.category,
  description: row.description || '',
  date: row.transaction_date,
  paymentMethod: row.payment_method,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapIncome = (row) => ({
  _id: row.id,
  title: row.title,
  amount: Number(row.amount),
  source: row.source,
  description: row.description || '',
  date: row.transaction_date,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const toDateOnly = (value) => new Date(value).toISOString().slice(0, 10)
