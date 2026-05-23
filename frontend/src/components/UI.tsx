import { clsx } from 'clsx'
import type { ThreatType, Verdict } from '@/types'

// ── StatCard ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'lime' | 'cyan' | 'coral' | 'amber' | 'emerald'
  icon?: React.ReactNode
}
const ACCENT: Record<string, string> = {
  lime:    'text-lime',
  cyan:    'text-cyan',
  coral:   'text-coral',
  amber:   'text-amber-400',
  emerald: 'text-emerald-400',
}
export function StatCard({ label, value, sub, accent = 'lime', icon }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs text-brand-muted font-medium uppercase tracking-wide">{label}</p>
        {icon && <span className="text-brand-muted">{icon}</span>}
      </div>
      <p className={clsx('font-display text-3xl font-extrabold mt-2', ACCENT[accent])}>{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-1">{sub}</p>}
    </div>
  )
}

// ── VerdictBadge ──────────────────────────────────────────────────
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={clsx('badge capitalize', {
      'badge-safe':   verdict === 'safe',
      'badge-warn':   verdict === 'suspicious',
      'badge-danger': verdict === 'dangerous',
    })}>
      {verdict === 'safe' ? '✓' : verdict === 'suspicious' ? '⚠' : '✕'} {verdict}
    </span>
  )
}

// ── ThreatBadge ───────────────────────────────────────────────────
const THREAT_STYLES: Record<ThreatType, string> = {
  phishing:  'bg-coral/10 text-coral border-coral/20',
  honeytrap: 'bg-cyan/10 text-cyan border-cyan/20',
  scam:      'bg-lime/10 text-lime border-lime/20',
  malware:   'bg-purple-400/10 text-purple-400 border-purple-400/20',
  clean:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  unknown:   'bg-white/5 text-brand-muted border-white/10',
}
export function ThreatBadge({ type }: { type: ThreatType }) {
  const icons: Record<ThreatType, string> = {
    phishing: '🎣', honeytrap: '🪤', scam: '💸', malware: '☠️', clean: '✓', unknown: '?',
  }
  return (
    <span className={clsx('badge capitalize', THREAT_STYLES[type])}>
      {icons[type]} {type}
    </span>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse bg-white/[0.05] rounded-lg', className)} />
  )
}

// ── Empty state ───────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <p className="font-display font-bold text-white text-lg">{title}</p>
      <p className="text-brand-muted text-sm mt-2 max-w-xs">{desc}</p>
    </div>
  )
}
