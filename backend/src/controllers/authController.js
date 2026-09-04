import { z } from 'zod'
import { createSupabaseClients } from '../config/supabase.js'
import { updateProfileSchema } from '../validators/auth.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { mapProfile } from '../utils/supabaseMappers.js'

export const getRegistrationStatus = async (req, res, next) => {
  try {
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('app_settings').select('allow_registration').eq('id', true).single()
    if (error) throw error
    return sendSuccess(res, { allowRegistration: data.allow_registration })
  } catch (error) {
    return next(error)
  }
}

export const getCurrentUser = async (req, res) => sendSuccess(res, { user: req.user })

export const updatePreferences = async (req, res, next) => {
  try {
    const schema = z.object({
      currency: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'JPY']),
      dateFormat: z.enum(['MMM d, yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']),
      theme: z.enum(['light', 'dark']),
      dashboardPeriod: z.enum(['month', 'year', 'all']),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Invalid preferences', 400)
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('profiles').update({
      currency: parsed.data.currency, date_format: parsed.data.dateFormat,
      theme: parsed.data.theme, dashboard_period: parsed.data.dashboardPeriod,
    }).eq('id', req.user.id).select().single()
    if (error) throw error
    return sendSuccess(res, { user: mapProfile(data) })
  } catch (error) { return next(error) }
}

export const updateProfile = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    const { admin } = createSupabaseClients()
    const { data, error } = await admin.from('profiles').update({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
    }).eq('id', req.user.id).select().maybeSingle()

    if (error?.code === '23505') return sendError(res, 'User already exists with this email', 409)
    if (error) throw error
    if (!data) return sendError(res, 'User not found', 404)
    return sendSuccess(res, { user: mapProfile(data) })
  } catch (error) {
    return next(error)
  }
}
