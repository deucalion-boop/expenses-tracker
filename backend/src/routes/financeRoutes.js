import express from 'express'
import protect from '../middleware/auth.js'
import { deleteBudget, deleteRecurring, exportTransactions, getBudgets, getRecurring, saveBudget, saveRecurring } from '../controllers/financeController.js'

const router = express.Router()
router.use(protect)
router.get('/budgets', getBudgets)
router.post('/budgets', saveBudget)
router.delete('/budgets/:id', deleteBudget)
router.get('/recurring', getRecurring)
router.post('/recurring', saveRecurring)
router.put('/recurring/:id', saveRecurring)
router.delete('/recurring/:id', deleteRecurring)
router.get('/export', exportTransactions)
export default router
