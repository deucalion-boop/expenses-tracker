import api, { unwrapApiResponse } from './api'

export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload)
  return unwrapApiResponse(response)
}

export const loginUser = async (payload) => {
  const response = await api.post('/auth/login', payload)
  return unwrapApiResponse(response)
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return unwrapApiResponse(response)
}

export const logoutUser = async () => {
  const response = await api.post('/auth/logout')
  return unwrapApiResponse(response)
}
