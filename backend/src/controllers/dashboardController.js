import Expense from '../models/Expense.js'
import Income from '../models/Income.js'
import { sendSuccess } from '../utils/response.js'

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id
    const [expenses, income] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1 }),
      Income.find({ userId }).sort({ date: -1 }),
    ])

    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
    const balance = totalIncome - totalExpenses

    const recentTransactions = [...income.map((item) => ({
      type: 'income',
      id: item._id,
      title: item.title,
      category: item.source,
      date: item.date,
      amount: item.amount,
    })), ...expenses.map((item) => ({
      type: 'expense',
      id: item._id,
      title: item.title,
      category: item.category,
      date: item.date,
      amount: item.amount,
    }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)

    return sendSuccess(res, {
      totalIncome,
      totalExpenses,
      balance,
      savings: balance,
      recentTransactions,
    })
  } catch (error) {
    return next(error)
  }
}

export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id
    const [expenses, income] = await Promise.all([
      Expense.find({ userId }).sort({ date: 1 }),
      Income.find({ userId }).sort({ date: 1 }),
    ])

    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
    const netSavings = totalIncome - totalExpenses
    const monthlySpending = expenses.reduce((acc, item) => {
      const monthKey = new Date(item.date).toISOString().slice(0, 7)
      acc[monthKey] = (acc[monthKey] || 0) + Number(item.amount)
      return acc
    }, {})
    const categoryTotals = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount)
      return acc
    }, {})
    const incomeTrend = income.reduce((acc, item) => {
      const monthKey = new Date(item.date).toISOString().slice(0, 7)
      acc[monthKey] = (acc[monthKey] || 0) + Number(item.amount)
      return acc
    }, {})

    const highestSpendingCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['None', 0]

    return sendSuccess(res, {
      totalIncome,
      totalExpenses,
      netSavings,
      averageMonthlySpending: Object.keys(monthlySpending).length ? Object.values(monthlySpending).reduce((sum, value) => sum + value, 0) / Object.keys(monthlySpending).length : 0,
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
