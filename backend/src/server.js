import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import * as Sentry from '@sentry/node'
import { createSupabaseClients } from './config/supabase.js'
import authRoutes from './routes/authRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import incomeRoutes from './routes/incomeRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import financeRoutes from './routes/financeRoutes.js'
import errorHandler from './middleware/errorHandler.js'
import { processAllRecurring } from './controllers/financeController.js'

const app = express()
const PORT = process.env.PORT || 5000

Sentry.init({ dsn: process.env.SENTRY_DSN || undefined, environment: process.env.NODE_ENV || 'development', enabled: Boolean(process.env.SENTRY_DSN) })

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again shortly.' } }))
app.use((req, res, next) => {
  const startedAt = Date.now()
  res.on('finish', () => {
    console.info(JSON.stringify({
      level: 'info', event: 'http_request', method: req.method, path: req.originalUrl,
      status: res.statusCode, durationMs: Date.now() - startedAt, timestamp: new Date().toISOString(),
    }))
  })
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.get('/api/cron/recurring', async (req, res, next) => {
  try {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized cron request' })
    }
    const processedUsers = await processAllRecurring()
    return res.json({ success: true, data: { processedUsers } })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/income', incomeRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/finance', financeRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

Sentry.setupExpressErrorHandler(app)
app.use(errorHandler)

const startServer = async () => {
  try {
    createSupabaseClients()
    app.listen(PORT, () => {
      console.info(`Server running on port ${PORT}`)
    })
    const recurringTimer = setInterval(() => {
      processAllRecurring().catch((error) => console.error(JSON.stringify({ level: 'error', event: 'recurring_processing_failed', message: error.message, timestamp: new Date().toISOString() })))
    }, 15 * 60 * 1000)
    recurringTimer.unref()
  } catch (error) {
    console.error('Server failed to start:', error.message)
    process.exit(1)
  }
}

if (!process.env.VERCEL) startServer()

export default app
