import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendError } from '../utils/response.js'

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    if (!token) {
      return sendError(res, 'Authentication token is required', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key')
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return sendError(res, 'User not found', 401)
    }

    if (user.status === 'suspended') {
      return sendError(res, 'This account has been suspended', 403)
    }

    req.user = user
    return next()
  } catch {
    return sendError(res, 'Invalid or expired token', 401)
  }
}

export default protect
