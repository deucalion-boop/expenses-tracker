import express from 'express'
import { getAnalytics, getDashboard } from '../controllers/dashboardController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.get('/', getDashboard)
router.get('/analytics', getAnalytics)

export default router
