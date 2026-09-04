import { createSupabaseClients } from '../config/supabase.js'
import { expenseSchema } from '../validators/transaction.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { mapExpense, toDateOnly } from '../utils/supabaseMappers.js'

const expensePayload = (data) => ({
  title: data.title,
  amount: data.amount,
  category: data.category,
  description: data.description || '',
  transaction_date: toDateOnly(data.date),
  payment_method: data.paymentMethod,
})

export const getExpenses = async (req, res, next) => {
  try {
    const { search, category, paymentMethod, sort = 'desc', startDate, endDate } = req.query
    const { admin } = createSupabaseClients()
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const paginated = req.query.page !== undefined
    let query = admin.from('expenses').select('*', { count: 'exact' }).eq('user_id', req.user.id)

    if (search) query = query.ilike('title', `%${String(search).replace(/[%_]/g, '\\$&')}%`)
    if (category) query = query.eq('category', category)
    if (paymentMethod) query = query.eq('payment_method', paymentMethod)
    if (startDate) query = query.gte('transaction_date', startDate)
    if (endDate) query = query.lte('transaction_date', endDate)

    query = query.order('transaction_date', { ascending: sort === 'asc' }).order('created_at', { ascending: false })
    if (paginated) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) throw error
    const items = data.map(mapExpense)
    return sendSuccess(res, paginated ? { items, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } : items)
  } catch (error) {
    return next(error)
  }
}

export const createExpense = async (req, res, next) => {
  try {
    const parsed = expenseSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)

    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('expenses').insert({
      ...expensePayload(parsed.data),
      user_id: req.user.id,
    }).select().single()
    if (error) throw error
    return sendSuccess(res, mapExpense(data), 201)
  } catch (error) {
    return next(error)
  }
}

export const getExpenseById = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('expenses').select('*').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Expense not found', 404)
    return sendSuccess(res, mapExpense(data))
  } catch (error) {
    return next(error)
  }
}

export const updateExpense = async (req, res, next) => {
  try {
    const parsed = expenseSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)

    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('expenses').update(expensePayload(parsed.data)).eq('id', req.params.id).eq('user_id', req.user.id).select().maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Expense not found', 404)
    return sendSuccess(res, mapExpense(data))
  } catch (error) {
    return next(error)
  }
}

export const deleteExpense = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('expenses').delete().eq('id', req.params.id).eq('user_id', req.user.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Expense not found', 404)
    return sendSuccess(res, { deletedId: data.id })
  } catch (error) {
    return next(error)
  }
}
