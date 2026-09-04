import { createSupabaseClients } from '../config/supabase.js'
import { adminSettingsSchema, updateUserSchema } from '../validators/admin.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { mapProfile } from '../utils/supabaseMappers.js'

const mapSettings = (row) => ({
  allowRegistration: row.allow_registration,
  supportEmail: row.support_email || '',
  updatedAt: row.updated_at,
})

const writeAudit = async (actor, action, affected = {}, details = {}) => {
  const { admin } = createSupabaseClients()
  const { error } = await admin.from('admin_audit_logs').insert({
    actor_id: actor.id, actor_email: actor.email, action,
    affected_user_id: affected.id || null, affected_user_email: affected.email || null, details,
  })
  if (error) throw error
}

const countRows = async (table, filters = {}) => {
  const { admin } = createSupabaseClients()
  let query = admin.from(table).select('*', { count: 'exact', head: true })
  Object.entries(filters).forEach(([column, value]) => { query = query.eq(column, value) })
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, admins, expenses, income] = await Promise.all([
      countRows('profiles'),
      countRows('profiles', { status: 'active' }),
      countRows('profiles', { status: 'suspended' }),
      countRows('profiles', { role: 'admin' }),
      countRows('expenses'),
      countRows('income'),
    ])
    return sendSuccess(res, { totalUsers, activeUsers, suspendedUsers, admins, totalTransactions: expenses + income })
  } catch (error) {
    return next(error)
  }
}

export const getUsers = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const paginated = req.query.page !== undefined
    let query = admin.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    const search = String(req.query.search || '').trim().replace(/[,().%]/g, '')
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    if (paginated) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) throw error
    const items = data.map(mapProfile)
    return sendSuccess(res, paginated ? { items, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } : items)
  } catch (error) {
    return next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    if (req.params.id === req.user.id) return sendError(res, 'You cannot change your own role or status', 400)

    const { admin } = createSupabaseClients()
    const { data: existing } = await admin.from('profiles').select('*').eq('id', req.params.id).maybeSingle()
    const { data, error } = await admin.from('profiles').update(parsed.data).eq('id', req.params.id).select().maybeSingle()
    if (error) throw error
    if (!data) return sendError(res, 'User not found', 404)
    await writeAudit(req.user, 'user_access_updated', data, { before: existing ? { role: existing.role, status: existing.status } : null, after: parsed.data })
    return sendSuccess(res, mapProfile(data))
  } catch (error) {
    return next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return sendError(res, 'You cannot delete your own account', 400)
    const { admin } = createSupabaseClients()
    const { data: profile, error: profileError } = await admin.from('profiles').select('id,email').eq('id', req.params.id).maybeSingle()
    if (profileError) throw profileError
    if (!profile) return sendError(res, 'User not found', 404)

    await writeAudit(req.user, 'user_deleted', profile)
    const { error } = await admin.auth.admin.deleteUser(profile.id)
    if (error) throw error
    return sendSuccess(res, { deletedId: profile.id })
  } catch (error) {
    return next(error)
  }
}

export const getSettings = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('app_settings').select('*').eq('id', true).single()
    if (error) throw error
    return sendSuccess(res, mapSettings(data))
  } catch (error) {
    return next(error)
  }
}

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const { admin } = createSupabaseClients()
    const { data, error, count } = await admin.from('admin_audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return sendSuccess(res, { items: data.map((row) => ({ _id: row.id, actorEmail: row.actor_email, action: row.action, affectedUserEmail: row.affected_user_email, details: row.details, createdAt: row.created_at })), pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } })
  } catch (error) { return next(error) }
}

export const updateSettings = async (req, res, next) => {
  try {
    const parsed = adminSettingsSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('app_settings').upsert({
      id: true,
      allow_registration: parsed.data.allowRegistration,
      support_email: parsed.data.supportEmail,
    }).select().single()
    if (error) throw error
    await writeAudit(req.user, 'system_settings_updated', {}, parsed.data)
    return sendSuccess(res, mapSettings(data))
  } catch (error) {
    return next(error)
  }
}
