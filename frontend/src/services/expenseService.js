import api, { unwrapApiResponse } from './api'

export const fetchExpenses = async (params = {}) => {
  const response = await api.get('/expenses', { params })
  return unwrapApiResponse(response)
}

export const createExpense = async (payload) => {
  const response = await api.post('/expenses', payload)
  return unwrapApiResponse(response)
}

export const updateExpense = async (id, payload) => {
  const response = await api.put(`/expenses/${id}`, payload)
  return unwrapApiResponse(response)
}

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`)
  return unwrapApiResponse(response)
}
