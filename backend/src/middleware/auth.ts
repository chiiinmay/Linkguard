import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

/** Require a valid Supabase JWT. Attaches userId to req. */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' })
  }
  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
  req.userId = data.user.id
  req.userEmail = data.user.email ?? undefined
  next()
}

/** Optionally attach user if token present, but don't block. */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.slice(7)
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    if (data.user) {
      req.userId = data.user.id
      req.userEmail = data.user.email ?? undefined
    }
  }
  next()
}
