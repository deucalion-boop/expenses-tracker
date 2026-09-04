import express from 'express'
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from '../controllers/authController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', protect, logoutUser)
router.get('/me', protect, getCurrentUser)
router.patch('/profile', protect, updateProfile)
router.patch('/password', protect, changePassword)

export default router
