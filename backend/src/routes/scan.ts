import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { requireAuth, optionalAuth, type AuthRequest } from '../middleware/auth'
import { performScan } from '../services/scanService'
import { supabase }    from '../config/supabase'

const router = Router()

// Stricter per-route rate limit for scan endpoint
const scanRateLimit = rateLimit({
  windowMs: 60_000, max: 20,
  message: { message: 'Scan rate limit exceeded. Max 20 scans/minute.' },
})

// ── POST /api/scan ────────────────────────────────────────────────
router.post('/',
  scanRateLimit,
  optionalAuth,
  body('url').notEmpty(),
  body('model').optional().isIn(['basic', 'advanced']),
  async (req: AuthRequest, res, next) => {
    console.log("🔥 ROUTE HIT");
    console.log("🔥 BODY:", req.body);
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const result = await performScan({
        url:    req.body.url as string,
        model:  (req.body.model ?? 'basic') as 'basic' | 'advanced',
        userId: req.userId,
      })
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /api/scan/history ─────────────────────────────────────────
router.get('/history', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page  ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const from  = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('scan_results')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('scanned_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error
    res.json({ data, total: count ?? 0, page, limit })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/scan/stats ───────────────────────────────────────────
router.get('/stats', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    // Aggregate counts
    const { data: counts } = await supabase
      .from('scan_results')
      .select('verdict, threat_type, scanned_at')
      .eq('user_id', userId)

    const safe       = counts?.filter(r => r.verdict === 'safe').length       ?? 0
    const suspicious = counts?.filter(r => r.verdict === 'suspicious').length ?? 0
    const dangerous  = counts?.filter(r => r.verdict === 'dangerous').length  ?? 0
    const today      = new Date().toDateString()
    const scansToday = counts?.filter(r => new Date(r.scanned_at).toDateString() === today).length ?? 0

    // Top threat types
    const threatCounts: Record<string, number> = {}
    counts?.forEach(r => { threatCounts[r.threat_type] = (threatCounts[r.threat_type] ?? 0) + 1 })
    const topThreats = Object.entries(threatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    // Daily counts (last 14 days)
    const dailyCounts: Record<string, number> = {}
    const past14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()
    past14.forEach(d => { dailyCounts[d] = 0 })
    counts?.forEach(r => {
      const d = r.scanned_at.split('T')[0]
      if (dailyCounts[d] !== undefined) dailyCounts[d]++
    })
    const dailyCountsArr = past14.map(d => ({ date: d, count: dailyCounts[d] }))

    // Recent scans
    const { data: recent } = await supabase
      .from('scan_results')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(5)

    res.json({
      total_scans:      counts?.length ?? 0,
      safe_count:       safe,
      suspicious_count: suspicious,
      dangerous_count:  dangerous,
      scans_today:      scansToday,
      top_threats:      topThreats,
      recent_scans:     recent ?? [],
      daily_counts:     dailyCountsArr,
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/scan/:id ─────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scan_results')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single()

    if (error || !data) return res.status(404).json({ message: 'Scan not found' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
