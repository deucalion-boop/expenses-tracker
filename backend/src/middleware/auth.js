import { createSupabaseClients } from '../config/supabase.js'
import { sendError } from '../utils/response.js'
import { mapProfile } from '../utils/supabaseMappers.js'

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) return sendError(res, 'Authentication token is required', 401)

    const { auth, admin } = createSupabaseClients()
    const { data: authData, error: authError } = await auth.auth.getUser(token)
    const authUser = authData?.user

    if (authError || !authUser?.email) {
      return sendError(res, 'Invalid or expired Supabase session', 401)
    }

    let { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profile) {
      const result = await admin
        .from('profiles')
        .insert({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          email: authUser.email.toLowerCase(),
        })
        .select()
        .single()
      if (result.error) throw result.error
      profile = result.data
    }

    if (profile.status === 'suspended') {
      return sendError(res, 'This account has been suspended', 403)
    }

    req.user = mapProfile(profile)
    req.supabaseUser = authUser
    return next()
  } catch (error) {
    return next(error)
  }
}

export default protect
