import { z } from 'zod'
import { createSupabaseClients } from '../config/supabase.js'
import { sendError, sendSuccess } from '../utils/response.js'

const categories = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other']
const sources = ['Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other']
const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Other']
const budgetSchema = z.object({ category: z.enum(categories), month: z.string().regex(/^\d{4}-\d{2}(-01)?$/), amount: z.number().positive() })
const recurringSchema = z.object({
  type: z.enum(['income', 'expense']), title: z.string().trim().min(2), amount: z.number().positive(),
  category: z.enum(categories).optional(), source: z.enum(sources).optional(), paymentMethod: z.enum(paymentMethods).optional(),
  description: z.string().trim().max(500).optional(), frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  nextRunDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), active: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.type === 'expense' && (!value.category || !value.paymentMethod)) context.addIssue({ code: 'custom', message: 'Expense category and payment method are required' })
  if (value.type === 'income' && !value.source) context.addIssue({ code: 'custom', message: 'Income source is required' })
})

const monthBounds = (month) => {
  const start = `${month.slice(0, 7)}-01`
  const next = new Date(`${start}T00:00:00Z`)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return { start, end: next.toISOString().slice(0, 10) }
}

const advanceDate = (date, frequency) => {
  const next = new Date(`${date}T00:00:00Z`)
  if (frequency === 'daily') next.setUTCDate(next.getUTCDate() + 1)
  if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + 7)
  if (frequency === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1)
  if (frequency === 'yearly') next.setUTCFullYear(next.getUTCFullYear() + 1)
  return next.toISOString().slice(0, 10)
}

const mapBudget = (row, spent = 0) => ({
  _id: row.id, category: row.category, month: row.month, amount: Number(row.amount), spent,
  remaining: Number(row.amount) - spent, percentage: Math.min(Math.round((spent / Number(row.amount)) * 100), 100),
  overspent: spent > Number(row.amount),
})

const mapRecurring = (row) => ({
  _id: row.id, type: row.type, title: row.title, amount: Number(row.amount), category: row.category,
  source: row.source, paymentMethod: row.payment_method, description: row.description, frequency: row.frequency,
  nextRunDate: row.next_run_date, active: row.active,
})

export const getBudgets = async (req, res, next) => {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7))
    const { start, end } = monthBounds(month)
    const { admin } = createSupabaseClients()
    const [budgetResult, expenseResult] = await Promise.all([
      admin.from('budgets').select('*').eq('user_id', req.user.id).eq('month', start).order('category'),
      admin.from('expenses').select('category,amount').eq('user_id', req.user.id).gte('transaction_date', start).lt('transaction_date', end),
    ])
    if (budgetResult.error) throw budgetResult.error
    if (expenseResult.error) throw expenseResult.error
    const spending = expenseResult.data.reduce((totals, item) => ({ ...totals, [item.category]: (totals[item.category] || 0) + Number(item.amount) }), {})
    return sendSuccess(res, budgetResult.data.map((budget) => mapBudget(budget, spending[budget.category] || 0)))
  } catch (error) { return next(error) }
}

export const saveBudget = async (req, res, next) => {
  try {
    const parsed = budgetSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Invalid budget', 400)
    const { admin } = createSupabaseClients()
    const month = `${parsed.data.month.slice(0, 7)}-01`
    const { data, error } = await admin.from('budgets').upsert({ user_id: req.user.id, category: parsed.data.category, month, amount: parsed.data.amount }, { onConflict: 'user_id,category,month' }).select().single()
    if (error) throw error
    return sendSuccess(res, mapBudget(data), 201)
  } catch (error) { return next(error) }
}

export const deleteBudget = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('budgets').delete().eq('id', req.params.id).eq('user_id', req.user.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Budget not found', 404)
    return sendSuccess(res, { deletedId: data.id })
  } catch (error) { return next(error) }
}

export const processRecurring = async (userId) => {
  const { admin } = createSupabaseClients()
  const today = new Date().toISOString().slice(0, 10)
  const { data: rows, error } = await admin.from('recurring_transactions').select('*').eq('user_id', userId).eq('active', true).lte('next_run_date', today)
  if (error) throw error
  for (const row of rows) {
    let runDate = row.next_run_date
    let guard = 0
    while (runDate <= today && guard < 100) {
      const table = row.type === 'expense' ? 'expenses' : 'income'
      const payload = row.type === 'expense'
        ? { user_id: userId, recurring_id: row.id, title: row.title, amount: row.amount, category: row.category, payment_method: row.payment_method, description: row.description, transaction_date: runDate }
        : { user_id: userId, recurring_id: row.id, title: row.title, amount: row.amount, source: row.source, description: row.description, transaction_date: runDate }
      const insertResult = await admin.from(table).upsert(payload, { onConflict: 'recurring_id,transaction_date', ignoreDuplicates: true })
      if (insertResult.error) throw insertResult.error
      runDate = advanceDate(runDate, row.frequency)
      guard += 1
    }
    const updateResult = await admin.from('recurring_transactions').update({ next_run_date: runDate }).eq('id', row.id)
    if (updateResult.error) throw updateResult.error
  }
}

export const processAllRecurring = async () => {
  const { admin } = createSupabaseClients()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await admin.from('recurring_transactions').select('user_id').eq('active', true).lte('next_run_date', today)
  if (error) throw error
  const userIds = [...new Set(data.map((item) => item.user_id))]
  for (const userId of userIds) await processRecurring(userId)
  return userIds.length
}

export const getRecurring = async (req, res, next) => {
  try {
    await processRecurring(req.user.id)
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('recurring_transactions').select('*').eq('user_id', req.user.id).order('next_run_date')
    if (error) throw error
    return sendSuccess(res, data.map(mapRecurring))
  } catch (error) { return next(error) }
}

export const saveRecurring = async (req, res, next) => {
  try {
    const parsed = recurringSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Invalid recurring transaction', 400)
    const value = parsed.data
    const payload = { user_id: req.user.id, type: value.type, title: value.title, amount: value.amount, category: value.type === 'expense' ? value.category : null, source: value.type === 'income' ? value.source : null, payment_method: value.type === 'expense' ? value.paymentMethod : null, description: value.description || '', frequency: value.frequency, next_run_date: value.nextRunDate, active: value.active ?? true }
    const { admin } = createSupabaseClients()
    let query = req.params.id
      ? admin.from('recurring_transactions').update(payload).eq('id', req.params.id).eq('user_id', req.user.id)
      : admin.from('recurring_transactions').insert(payload)
    const { data, error } = await query.select().maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Recurring transaction not found', 404)
    return sendSuccess(res, mapRecurring(data), req.params.id ? 200 : 201)
  } catch (error) { return next(error) }
}

export const deleteRecurring = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('recurring_transactions').delete().eq('id', req.params.id).eq('user_id', req.user.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Recurring transaction not found', 404)
    return sendSuccess(res, { deletedId: data.id })
  } catch (error) { return next(error) }
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
export const exportTransactions = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    let expenses = admin.from('expenses').select('*').eq('user_id', req.user.id)
    let income = admin.from('income').select('*').eq('user_id', req.user.id)
    if (req.query.startDate) { expenses = expenses.gte('transaction_date', req.query.startDate); income = income.gte('transaction_date', req.query.startDate) }
    if (req.query.endDate) { expenses = expenses.lte('transaction_date', req.query.endDate); income = income.lte('transaction_date', req.query.endDate) }
    const [expenseResult, incomeResult] = await Promise.all([expenses, income])
    if (expenseResult.error) throw expenseResult.error
    if (incomeResult.error) throw incomeResult.error
    const rows = [
      ['Type','Date','Title','Category/Source','Payment method','Description','Amount'],
      ...expenseResult.data.map((item) => ['Expense',item.transaction_date,item.title,item.category,item.payment_method,item.description,-Number(item.amount)]),
      ...incomeResult.data.map((item) => ['Income',item.transaction_date,item.title,item.source,'',item.description,Number(item.amount)]),
    ]
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="spendwise-${new Date().toISOString().slice(0, 10)}.csv"`)
    return res.send(rows.map((row) => row.map(csvCell).join(',')).join('\n'))
  } catch (error) { return next(error) }
}
