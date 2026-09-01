import Expense from '../models/Expense.js'
import { expenseSchema } from '../validators/transaction.js'
import { sendError, sendSuccess } from '../utils/response.js'

export const getExpenses = async (req, res, next) => {
  try {
    const { search, category, paymentMethod, sort = 'desc', startDate, endDate } = req.query
    const query = { userId: req.user._id }

    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    if (category) {
      query.category = category
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const sortDirection = sort === 'asc' ? 1 : -1
    const expenses = await Expense.find(query).sort({ date: sortDirection, createdAt: -1 })
    return sendSuccess(res, expenses)
  } catch (error) {
    return next(error)
  }
}

export const createExpense = async (req, res, next) => {
  try {
    const parsed = expenseSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const payload = {
      ...parsed.data,
      userId: req.user._id,
      date: new Date(parsed.data.date),
    }

    const expense = await Expense.create(payload)
    return sendSuccess(res, expense, 201)
  } catch (error) {
    return next(error)
  }
}

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id })

    if (!expense) {
      return sendError(res, 'Expense not found', 404)
    }

    return sendSuccess(res, expense)
  } catch (error) {
    return next(error)
  }
}

export const updateExpense = async (req, res, next) => {
  try {
    const parsed = expenseSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...parsed.data, date: new Date(parsed.data.date) },
      { new: true, runValidators: true },
    )

    if (!expense) {
      return sendError(res, 'Expense not found', 404)
    }

    return sendSuccess(res, expense)
  } catch (error) {
    return next(error)
  }
}

export const deleteExpense = async (req, res, next) => {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id })

    if (!deleted) {
      return sendError(res, 'Expense not found', 404)
    }

    return sendSuccess(res, { deletedId: req.params.id })
  } catch (error) {
    return next(error)
  }
}
