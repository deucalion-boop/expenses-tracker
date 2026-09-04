import express from 'express'
import { getCurrentUser, getRegistrationStatus, updatePreferences, updateProfile } from '../controllers/authController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.get('/registration-status', getRegistrationStatus)
router.get('/me', protect, getCurrentUser)
router.patch('/profile', protect, updateProfile)
router.patch('/preferences', protect, updatePreferences)

export default router
