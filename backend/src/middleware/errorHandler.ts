import type { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status  = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  if (status >= 500) logger.error(`${status} — ${message}\n${err.stack}`)
  res.status(status).json({ message, ...(err.code ? { code: err.code } : {}) })
}
