import express from 'express'
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
} from '../controllers/expenseController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.get('/', getExpenses)
router.post('/', createExpense)
router.get('/:id', getExpenseById)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

export default router
