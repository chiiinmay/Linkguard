import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import scanRouter from './routes/scan'
import authRouter from './routes/auth'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './config/logger'

const app = express()

// ── Security headers ──────────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://linkguard.ai', 'https://frontend-chiiinmays-projects.vercel.app', 'https://frontend-26mosfnxw-chiiinmays-projects.vercel.app']
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── HTTP request logging ──────────────────────────────────────────
app.use(morgan('dev', { stream: { write: (m) => logger.http(m.trim()) } }))

// ── Global rate limit ─────────────────────────────────────────────
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max:      Number(process.env.RATE_LIMIT_MAX ?? 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
}))

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/scan', scanRouter)
app.use('/api/auth', authRouter)

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Not found' }))

// ── Error handler ─────────────────────────────────────────────────
app.use(errorHandler)

export default app
