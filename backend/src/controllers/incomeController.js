import Income from '../models/Income.js'
import { incomeSchema } from '../validators/transaction.js'
import { sendError, sendSuccess } from '../utils/response.js'

export const getIncome = async (req, res, next) => {
  try {
    const { search, source, sort = 'desc', startDate, endDate } = req.query
    const query = { userId: req.user._id }

    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    if (source) {
      query.source = source
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const sortDirection = sort === 'asc' ? 1 : -1
    const income = await Income.find(query).sort({ date: sortDirection, createdAt: -1 })
    return sendSuccess(res, income)
  } catch (error) {
    return next(error)
  }
}

export const createIncome = async (req, res, next) => {
  try {
    const parsed = incomeSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const payload = {
      ...parsed.data,
      userId: req.user._id,
      date: new Date(parsed.data.date),
    }

    const income = await Income.create(payload)
    return sendSuccess(res, income, 201)
  } catch (error) {
    return next(error)
  }
}

export const getIncomeById = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user._id })

    if (!income) {
      return sendError(res, 'Income not found', 404)
    }

    return sendSuccess(res, income)
  } catch (error) {
    return next(error)
  }
}

export const updateIncome = async (req, res, next) => {
  try {
    const parsed = incomeSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...parsed.data, date: new Date(parsed.data.date) },
      { new: true, runValidators: true },
    )

    if (!income) {
      return sendError(res, 'Income not found', 404)
    }

    return sendSuccess(res, income)
  } catch (error) {
    return next(error)
  }
}

export const deleteIncome = async (req, res, next) => {
  try {
    const deleted = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id })

    if (!deleted) {
      return sendError(res, 'Income not found', 404)
    }

    return sendSuccess(res, { deletedId: req.params.id })
  } catch (error) {
    return next(error)
  }
}
