import api, { unwrapApiResponse } from './api'
import { supabase } from './supabase'

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase URL and publishable key are required')
  return supabase
}

const mapAuthUser = (user) => ({
  _id: user.id,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  email: user.email,
  role: 'user',
  status: 'active',
})

export const registerUser = async ({ name, email, password }) => {
  const client = requireSupabase()
  const settingsResponse = await api.get('/auth/registration-status')
  const settings = unwrapApiResponse(settingsResponse)
  if (!settings.allowRegistration) throw new Error('New account registration is currently disabled')

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error

  return {
    token: data.session?.access_token || null,
    user: data.user ? mapAuthUser(data.user) : null,
    requiresEmailConfirmation: !data.session,
  }
}

export const loginUser = async ({ email, password }) => {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error

  return {
    token: data.session.access_token,
    user: mapAuthUser(data.user),
  }
}

export const requestPasswordReset = async (email) => {
  const client = requireSupabase()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export const resetPassword = async (password) => {
  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) throw new Error('This recovery link is invalid or has expired. Request a new one.')

  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
  await client.auth.signOut()
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return unwrapApiResponse(response)
}

export const logoutUser = async () => {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export const updateProfile = async (payload) => {
  const client = requireSupabase()
  const { error } = await client.auth.updateUser({
    email: payload.email,
    data: { name: payload.name },
  })
  if (error) throw error

  const response = await api.patch('/auth/profile', payload)
  return unwrapApiResponse(response)
}

export const updatePreferences = async (payload) => {
  const response = await api.patch('/auth/preferences', payload)
  return unwrapApiResponse(response)
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user?.email) throw userError || new Error('User session not found')

  const { error: passwordError } = await client.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  })
  if (passwordError) throw new Error('Current password is incorrect')

  const { error } = await client.auth.updateUser({ password: newPassword })
  if (error) throw error

  const { error: signOutError } = await client.auth.signOut({ scope: 'global' })
  if (signOutError) throw signOutError

  return { message: 'Password changed successfully. Sign in again on your devices.' }
}
