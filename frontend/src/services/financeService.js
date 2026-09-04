import api, { unwrapApiResponse } from './api'

export const fetchBudgets = async (month) => unwrapApiResponse(await api.get('/finance/budgets', { params: { month } }))
export const saveBudget = async (payload) => unwrapApiResponse(await api.post('/finance/budgets', payload))
export const deleteBudget = async (id) => unwrapApiResponse(await api.delete(`/finance/budgets/${id}`))
export const fetchRecurring = async () => unwrapApiResponse(await api.get('/finance/recurring'))
export const saveRecurring = async (payload, id) => unwrapApiResponse(await api[id ? 'put' : 'post'](id ? `/finance/recurring/${id}` : '/finance/recurring', payload))
export const deleteRecurring = async (id) => unwrapApiResponse(await api.delete(`/finance/recurring/${id}`))
export const downloadTransactions = async (params = {}) => {
  const response = await api.get('/finance/export', { params, responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `spendwise-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
