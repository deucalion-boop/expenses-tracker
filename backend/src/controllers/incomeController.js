import { createSupabaseClients } from '../config/supabase.js'
import { incomeSchema } from '../validators/transaction.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { mapIncome, toDateOnly } from '../utils/supabaseMappers.js'

const incomePayload = (data) => ({
  title: data.title,
  amount: data.amount,
  source: data.source,
  description: data.description || '',
  transaction_date: toDateOnly(data.date),
})

export const getIncome = async (req, res, next) => {
  try {
    const { search, source, sort = 'desc', startDate, endDate } = req.query
    const { admin } = createSupabaseClients()
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const paginated = req.query.page !== undefined
    let query = admin.from('income').select('*', { count: 'exact' }).eq('user_id', req.user.id)

    if (search) query = query.ilike('title', `%${String(search).replace(/[%_]/g, '\\$&')}%`)
    if (source) query = query.eq('source', source)
    if (startDate) query = query.gte('transaction_date', startDate)
    if (endDate) query = query.lte('transaction_date', endDate)

    query = query.order('transaction_date', { ascending: sort === 'asc' }).order('created_at', { ascending: false })
    if (paginated) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) throw error
    const items = data.map(mapIncome)
    return sendSuccess(res, paginated ? { items, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } : items)
  } catch (error) {
    return next(error)
  }
}

export const createIncome = async (req, res, next) => {
  try {
    const parsed = incomeSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)

    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('income').insert({
      ...incomePayload(parsed.data),
      user_id: req.user.id,
    }).select().single()
    if (error) throw error
    return sendSuccess(res, mapIncome(data), 201)
  } catch (error) {
    return next(error)
  }
}

export const getIncomeById = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('income').select('*').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Income not found', 404)
    return sendSuccess(res, mapIncome(data))
  } catch (error) {
    return next(error)
  }
}

export const updateIncome = async (req, res, next) => {
  try {
    const parsed = incomeSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)

    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('income').update(incomePayload(parsed.data)).eq('id', req.params.id).eq('user_id', req.user.id).select().maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Income not found', 404)
    return sendSuccess(res, mapIncome(data))
  } catch (error) {
    return next(error)
  }
}

export const deleteIncome = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('income').delete().eq('id', req.params.id).eq('user_id', req.user.id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'Income not found', 404)
    return sendSuccess(res, { deletedId: data.id })
  } catch (error) {
    return next(error)
  }
}
