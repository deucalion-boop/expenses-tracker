import express from 'express'
import {
  createIncome,
  deleteIncome,
  getIncome,
  getIncomeById,
  updateIncome,
} from '../controllers/incomeController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.get('/', getIncome)
router.post('/', createIncome)
router.get('/:id', getIncomeById)
router.put('/:id', updateIncome)
router.delete('/:id', deleteIncome)

export default router
