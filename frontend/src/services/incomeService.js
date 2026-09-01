import api, { unwrapApiResponse } from './api'

export const fetchIncome = async (params = {}) => {
  const response = await api.get('/income', { params })
  return unwrapApiResponse(response)
}

export const createIncome = async (payload) => {
  const response = await api.post('/income', payload)
  return unwrapApiResponse(response)
}

export const updateIncome = async (id, payload) => {
  const response = await api.put(`/income/${id}`, payload)
  return unwrapApiResponse(response)
}

export const deleteIncome = async (id) => {
  const response = await api.delete(`/income/${id}`)
  return unwrapApiResponse(response)
}
