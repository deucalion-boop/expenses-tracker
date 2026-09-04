import api, { unwrapApiResponse } from './api'

export const fetchDashboard = async (params = {}) => {
  const response = await api.get('/dashboard', { params })
  return unwrapApiResponse(response)
}

export const fetchAnalytics = async (params = {}) => {
  const response = await api.get('/dashboard/analytics', { params })
  return unwrapApiResponse(response)
}
