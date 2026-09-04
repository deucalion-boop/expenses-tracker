import Expense from '../models/Expense.js'
import Income from '../models/Income.js'
import User from '../models/User.js'
import { getAppSettings } from '../models/AppSetting.js'
import { adminSettingsSchema, updateUserSchema } from '../validators/admin.js'
import { sendError, sendSuccess } from '../utils/response.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, admins, expenses, income] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'admin' }),
      Expense.countDocuments(),
      Income.countDocuments(),
    ])

    return sendSuccess(res, {
      totalUsers,
      activeUsers,
      suspendedUsers,
      admins,
      totalTransactions: expenses + income,
    })
  } catch (error) {
    return next(error)
  }
}

export const getUsers = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const query = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: 'i' } },
            { email: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {}
    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
    return sendSuccess(res, users)
  } catch (error) {
    return next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot change your own role or status', 400)
    }

    const user = await User.findByIdAndUpdate(req.params.id, parsed.data, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password')

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    return sendSuccess(res, user)
  } catch (error) {
    return next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own account', 400)
    }

    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    await Promise.all([
      Expense.deleteMany({ userId: user._id }),
      Income.deleteMany({ userId: user._id }),
    ])

    return sendSuccess(res, { deletedId: user._id })
  } catch (error) {
    return next(error)
  }
}

export const getSettings = async (req, res, next) => {
  try {
    const settings = await getAppSettings()
    return sendSuccess(res, settings)
  } catch (error) {
    return next(error)
  }
}

export const updateSettings = async (req, res, next) => {
  try {
    const parsed = adminSettingsSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const settings = await getAppSettings()
    settings.allowRegistration = parsed.data.allowRegistration
    settings.supportEmail = parsed.data.supportEmail
    await settings.save()
    return sendSuccess(res, settings)
  } catch (error) {
    return next(error)
  }
}
