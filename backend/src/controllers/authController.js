import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getAppSettings } from '../models/AppSetting.js'
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validators/auth.js'
import { sendError, sendSuccess } from '../utils/response.js'

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev-secret-key', {
  expiresIn: '7d',
})

export const registerUser = async (req, res, next) => {
  try {
    const settings = await getAppSettings()

    if (!settings.allowRegistration) {
      return sendError(res, 'New account registration is currently disabled', 403)
    }

    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const { name, email, password } = parsed.data
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return sendError(res, 'User already exists with this email', 400)
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    return sendSuccess(res, {
      token,
      user,
    }, 201)
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 'User already exists with this email', 409)
    }
    return next(error)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const { email, password } = parsed.data
    const user = await User.findOne({ email })

    if (!user) {
      return sendError(res, 'Invalid email or password', 401)
    }

    if (user.status === 'suspended') {
      return sendError(res, 'This account has been suspended', 403)
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401)
    }

    const token = generateToken(user._id)

    return sendSuccess(res, {
      token,
      user,
    })
  } catch (error) {
    return next(error)
  }
}

export const getCurrentUser = async (req, res) => {
  return sendSuccess(res, { user: req.user })
}

export const updateProfile = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const email = parsed.data.email.toLowerCase()
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } })

    if (existingUser) {
      return sendError(res, 'User already exists with this email', 409)
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    user.name = parsed.data.name
    user.email = email
    await user.save()

    return sendSuccess(res, { user })
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 'User already exists with this email', 409)
    }
    return next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body)

    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Validation failed', 400)
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    const passwordMatches = await user.comparePassword(parsed.data.currentPassword)

    if (!passwordMatches) {
      return sendError(res, 'Current password is incorrect', 400)
    }

    user.password = parsed.data.newPassword
    await user.save()

    return sendSuccess(res, { message: 'Password changed successfully' })
  } catch (error) {
    return next(error)
  }
}

export const logoutUser = async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully' })
}
