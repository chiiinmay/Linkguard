import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = Router()

// ── GET /api/auth/me ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId!)
      .single()

    if (error) throw error
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/auth/usage ───────────────────────────────────────────
router.get('/usage', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { count } = await supabase
      .from('scan_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId!)

    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount } = await supabase
      .from('scan_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId!)
      .gte('scanned_at', `${today}T00:00:00`)

    res.json({ total_scans: count ?? 0, scans_today: todayCount ?? 0 })
  } catch (err) {
    next(err)
  }
})

export default router
