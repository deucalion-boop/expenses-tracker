import api, { unwrapApiResponse } from './api'

export const fetchDashboard = async () => {
  const response = await api.get('/dashboard')
  return unwrapApiResponse(response)
}

export const fetchAnalytics = async () => {
  const response = await api.get('/dashboard/analytics')
  return unwrapApiResponse(response)
}
