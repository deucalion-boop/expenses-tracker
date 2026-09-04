import express from 'express'
import {
  deleteUser,
  getAdminOverview,
  getAuditLogs,
  getSettings,
  getUsers,
  updateSettings,
  updateUser,
} from '../controllers/adminController.js'
import protect from '../middleware/auth.js'
import requireAdmin from '../middleware/admin.js'

const router = express.Router()

router.use(protect, requireAdmin)
router.get('/overview', getAdminOverview)
router.get('/audit-logs', getAuditLogs)
router.get('/users', getUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.get('/settings', getSettings)
router.patch('/settings', updateSettings)

export default router
