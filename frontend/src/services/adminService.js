import api, { unwrapApiResponse } from './api'

export const fetchAdminOverview = async () => {
  const response = await api.get('/admin/overview')
  return unwrapApiResponse(response)
}

export const fetchAuditLogs = async (params = {}) => unwrapApiResponse(await api.get('/admin/audit-logs', { params }))

export const fetchAdminUsers = async () => {
  const response = await api.get('/admin/users')
  return unwrapApiResponse(response)
}

export const updateAdminUser = async (id, payload) => {
  const response = await api.patch(`/admin/users/${id}`, payload)
  return unwrapApiResponse(response)
}

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`)
  return unwrapApiResponse(response)
}

export const fetchAdminSettings = async () => {
  const response = await api.get('/admin/settings')
  return unwrapApiResponse(response)
}

export const updateAdminSettings = async (payload) => {
  const response = await api.patch('/admin/settings', payload)
  return unwrapApiResponse(response)
}
