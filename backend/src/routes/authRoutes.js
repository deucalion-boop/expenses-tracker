import express from 'express'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../controllers/authController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', protect, logoutUser)
router.get('/me', protect, getCurrentUser)

export default router
