import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { loginSchema, registerSchema } from '../validators/auth.js'
import { sendError, sendSuccess } from '../utils/response.js'

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev-secret-key', {
  expiresIn: '7d',
})

export const registerUser = async (req, res, next) => {
  try {
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
    console.error('REGISTER ERROR:', error)
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

export const logoutUser = async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully' })
}
