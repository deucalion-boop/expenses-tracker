import { sendError } from '../utils/response.js'

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 'Administrator access is required', 403)
  }

  return next()
}

export default requireAdmin
