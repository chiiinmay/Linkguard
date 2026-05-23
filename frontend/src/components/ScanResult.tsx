import { motion } from 'framer-motion'
import { Shield, AlertTriangle, XCircle, Clock, Cpu, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import type { ScanResult, Verdict, SignalResult } from '@/types'

interface Props { result: ScanResult }

const VERDICT_CONFIG: Record<Verdict, {
  icon: typeof Shield
  iconColor: string
  bg: string
  border: string
  label: string
  labelColor: string
}> = {
  safe: {
    icon: Shield, iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/8', border: 'border-emerald-500/20',
    label: 'SAFE', labelColor: 'text-emerald-400',
  },
  suspicious: {
    icon: AlertTriangle, iconColor: 'text-amber-400',
    bg: 'bg-amber-500/8', border: 'border-amber-500/20',
    label: 'SUSPICIOUS', labelColor: 'text-amber-400',
  },
  dangerous: {
    icon: XCircle, iconColor: 'text-coral',
    bg: 'bg-coral/8', border: 'border-coral/20',
    label: 'DANGEROUS', labelColor: 'text-coral',
  },
}

const STATUS_STYLES: Record<SignalResult['status'], string> = {
  ok:   'text-emerald-400',
  warn: 'text-amber-400',
  bad:  'text-coral',
}

export default function ScanResultCard({ result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = VERDICT_CONFIG[result.verdict]
  const Icon = cfg.icon

  const scoreBarColor = {
    safe: 'bg-gradient-to-r from-emerald-500 to-lime',
    suspicious: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    dangerous: 'bg-gradient-to-r from-coral to-red-400',
  }[result.verdict]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto">

      {/* Verdict header */}
      <div className={clsx('rounded-2xl border p-5 mb-3', cfg.bg, cfg.border)}>
        <div className="flex items-start gap-4">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
            <Icon className={clsx('w-6 h-6', cfg.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={clsx('font-display font-extrabold text-xl tracking-tight', cfg.labelColor)}>
                {cfg.label}
              </span>
              <span className="badge badge-info capitalize">{result.threat_type}</span>
              <span className={clsx('badge', result.model_used === 'advanced' ? 'badge-info' : 'bg-white/5 text-brand-muted border border-white/10')}>
                {result.model_used === 'advanced' ? '🤖 BERT' : '⚡ Basic'}
              </span>
            </div>
            <p className="text-sm text-brand-light mt-1 leading-relaxed">{result.explanation}</p>
            <p className="text-xs text-brand-muted mt-2 font-mono truncate">{result.url}</p>
          </div>
        </div>

        {/* Threat score bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-brand-muted mb-1.5">
            <span>Threat score</span>
            <span className={cfg.labelColor}>{result.threat_score}/100</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.threat_score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={clsx('h-full rounded-full', scoreBarColor)}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-brand-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {result.duration_ms}ms
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            {Math.round(result.confidence * 100)}% confidence
          </span>
          {result.domain_age_days !== null && result.domain_age_days !== undefined && (
            <span>Domain age: {result.domain_age_days < 1 ? '&lt;1 day' : `${result.domain_age_days}d`}</span>
          )}
          {result.redirect_count !== undefined && result.redirect_count > 0 && (
            <span>{result.redirect_count} redirect{result.redirect_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* External checks */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card p-4">
          <p className="text-xs text-brand-muted mb-1">Google Safe Browsing</p>
          <p className={clsx('text-sm font-semibold',
            result.google_safe_browsing ? 'text-coral' : 'text-emerald-400')}>
            {result.google_safe_browsing ? '⚠ Flagged' : '✓ Clean'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-muted mb-1">VirusTotal</p>
          <p className={clsx('text-sm font-semibold',
            result.virustotal_detections == null ? 'text-brand-muted' :
            result.virustotal_detections > 0 ? 'text-coral' : 'text-emerald-400')}>
            {result.virustotal_detections == null
              ? '— not checked'
              : result.virustotal_detections === 0
                ? '✓ 0 detections'
                : `⚠ ${result.virustotal_detections} engine(s)`}
          </p>
        </div>
      </div>

      {/* Signals grid */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
          <span className="text-sm font-semibold text-white">Signal breakdown ({result.signals.length})</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
        </button>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-px bg-white/[0.04] border-t border-white/[0.06]">
            {result.signals.map((sig) => (
              <div key={sig.name} className="bg-ink-2 px-4 py-3">
                <p className="text-xs text-brand-muted">{sig.name}</p>
                <p className={clsx('text-sm font-medium mt-0.5', STATUS_STYLES[sig.status])}>{sig.value}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Open link */}
      <div className="mt-3 flex justify-end">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'btn-ghost text-xs gap-1.5',
            result.verdict === 'dangerous' && 'text-coral/60 hover:text-coral'
          )}>
          <ExternalLink className="w-3.5 h-3.5" />
          {result.verdict === 'dangerous' ? 'Open anyway (risky)' : 'Open URL'}
        </a>
      </div>
    </motion.div>
  )
}
