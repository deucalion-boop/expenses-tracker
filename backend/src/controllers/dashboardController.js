import { createSupabaseClients } from '../config/supabase.js'
import { sendSuccess } from '../utils/response.js'
import { mapExpense, mapIncome } from '../utils/supabaseMappers.js'
import { processRecurring } from './financeController.js'

const loadTransactions = async (userId, ascending = false, startDate, endDate) => {
  const { admin } = createSupabaseClients()
  let expenseQuery = admin.from('expenses').select('*').eq('user_id', userId)
  let incomeQuery = admin.from('income').select('*').eq('user_id', userId)
  if (startDate) { expenseQuery = expenseQuery.gte('transaction_date', startDate); incomeQuery = incomeQuery.gte('transaction_date', startDate) }
  if (endDate) { expenseQuery = expenseQuery.lte('transaction_date', endDate); incomeQuery = incomeQuery.lte('transaction_date', endDate) }
  const [expenseResult, incomeResult] = await Promise.all([
    expenseQuery.order('transaction_date', { ascending }),
    incomeQuery.order('transaction_date', { ascending }),
  ])
  if (expenseResult.error) throw expenseResult.error
  if (incomeResult.error) throw incomeResult.error
  return {
    expenses: expenseResult.data.map(mapExpense),
    income: incomeResult.data.map(mapIncome),
  }
}

export const getDashboard = async (req, res, next) => {
  try {
    await processRecurring(req.user.id)
    const { startDate, endDate } = req.query
    const { expenses, income } = await loadTransactions(req.user.id, false, startDate, endDate)
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    const balance = totalIncome - totalExpenses
    const recentTransactions = [
      ...income.map((item) => ({
        type: 'income', id: item._id, title: item.title, category: item.source,
        date: item.date, amount: item.amount,
      })),
      ...expenses.map((item) => ({
        type: 'expense', id: item._id, title: item.title, category: item.category,
        date: item.date, amount: item.amount,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)

    let comparison = null
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00Z`)
      const end = new Date(`${endDate}T00:00:00Z`)
      const days = Math.round((end - start) / 86400000) + 1
      const previousEnd = new Date(start); previousEnd.setUTCDate(previousEnd.getUTCDate() - 1)
      const previousStart = new Date(previousEnd); previousStart.setUTCDate(previousStart.getUTCDate() - days + 1)
      const previous = await loadTransactions(req.user.id, false, previousStart.toISOString().slice(0, 10), previousEnd.toISOString().slice(0, 10))
      const previousIncome = previous.income.reduce((sum, item) => sum + item.amount, 0)
      const previousExpenses = previous.expenses.reduce((sum, item) => sum + item.amount, 0)
      comparison = { previousIncome, previousExpenses, previousBalance: previousIncome - previousExpenses }
    }
    return sendSuccess(res, { totalIncome, totalExpenses, balance, savings: balance, recentTransactions, comparison })
  } catch (error) {
    return next(error)
  }
}

export const getAnalytics = async (req, res, next) => {
  try {
    const { expenses, income } = await loadTransactions(req.user.id, true, req.query.startDate, req.query.endDate)
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    const monthlySpending = expenses.reduce((acc, item) => {
      const monthKey = item.date.slice(0, 7)
      acc[monthKey] = (acc[monthKey] || 0) + item.amount
      return acc
    }, {})
    const categoryTotals = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount
      return acc
    }, {})
    const incomeTrend = income.reduce((acc, item) => {
      const monthKey = item.date.slice(0, 7)
      acc[monthKey] = (acc[monthKey] || 0) + item.amount
      return acc
    }, {})
    const highestSpendingCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0]

    return sendSuccess(res, {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      averageMonthlySpending: Object.keys(monthlySpending).length
        ? Object.values(monthlySpending).reduce((sum, value) => sum + value, 0) / Object.keys(monthlySpending).length
        : 0,
      highestSpendingCategory: highestSpendingCategory[0],
      highestSpendingCategoryValue: highestSpendingCategory[1],
      spendingTrend: monthlySpending,
      incomeTrend,
      expenseTrend: monthlySpending,
      categoryBreakdown: categoryTotals,
    })
  } catch (error) {
    return next(error)
  }
}
