import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Zap, Brain, Loader2, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { useScan } from '@/hooks/useScan'
import { useSettingsStore } from '@/lib/store'

const PRESETS = [
  { label: 'Phishing', url: 'https://paypal-secure-login.ru/verify' },
  { label: 'Scam',     url: 'https://free-iphone15-winner.click/claim' },
  { label: 'Honeytrap',url: 'https://meet-hot-singles-247.tk/chat' },
  { label: 'Safe',     url: 'https://github.com' },
]

export default function ScanForm() {
  const [url, setUrl] = useState('')
  const { defaultModel, setDefaultModel } = useSettingsStore()
  const scan = useScan()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    const normalized = url.startsWith('http') ? url : `https://${url}`
    scan.mutate({ url: normalized, model: defaultModel })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Model selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-brand-muted font-medium">Model:</span>
        <div className="flex bg-ink-3 rounded-lg p-1 gap-1">
          <button onClick={() => setDefaultModel('basic')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              defaultModel === 'basic' ? 'bg-ink-2 text-white shadow' : 'text-brand-muted hover:text-white')}>
            <Zap className="w-3 h-3" /> Basic (fast)
          </button>
          <button onClick={() => setDefaultModel('advanced')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              defaultModel === 'advanced' ? 'bg-ink-2 text-white shadow' : 'text-brand-muted hover:text-white')}>
            <Brain className="w-3 h-3" /> BERT (deep)
          </button>
        </div>
        {defaultModel === 'advanced' && (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            ~5s scan time
          </span>
        )}
      </div>

      {/* Main input */}
      <form onSubmit={handleSubmit}>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste any URL to scan — e.g. https://suspicious-link.com"
              className="input-base pl-11 py-4 text-base"
              disabled={scan.isPending}
            />
          </div>
          <button
            type="submit"
            disabled={scan.isPending || !url.trim()}
            className={clsx(
              'btn-primary px-6 py-4 text-base whitespace-nowrap',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
            )}>
            {scan.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
              : <><Shield className="w-4 h-4" /> Scan URL</>}
          </button>
        </div>
      </form>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-brand-muted">Try:</span>
        {PRESETS.map(p => (
          <button key={p.label}
            onClick={() => { setUrl(p.url); scan.mutate({ url: p.url, model: defaultModel }) }}
            disabled={scan.isPending}
            className="text-xs px-3 py-1 rounded-full border border-white/10 text-brand-muted
                       hover:border-lime/40 hover:text-lime transition-all disabled:opacity-40">
            {p.label}
          </button>
        ))}
      </div>

      {/* Scanning progress steps */}
      {scan.isPending && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 card p-4">
          <ScanProgress model={defaultModel} />
        </motion.div>
      )}
    </div>
  )
}

const STEPS_BASIC = [
  'Parsing URL structure…',
  'Checking domain reputation…',
  'Google Safe Browsing lookup…',
  'Running ML classifier…',
  'Building verdict…',
]
const STEPS_ADVANCED = [
  'Parsing URL structure…',
  'WHOIS & domain age lookup…',
  'Following redirect chain…',
  'Fetching page content…',
  'Google Safe Browsing lookup…',
  'VirusTotal check…',
  'Running BERT transformer…',
  'Computing SHAP explanations…',
  'Building verdict…',
]

function ScanProgress({ model }: { model: 'basic' | 'advanced' }) {
  const steps = model === 'advanced' ? STEPS_ADVANCED : STEPS_BASIC
  const [active] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <motion.div key={step}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * (model === 'advanced' ? 0.55 : 0.35) }}
          className={clsx('flex items-center gap-3 text-sm',
            i === active ? 'text-white' : 'text-brand-muted')}>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * (model === 'advanced' ? 0.55 : 0.35) }}
            className={clsx('w-5 h-5 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0',
              i < active ? 'bg-emerald-500 border-emerald-500 text-white' :
              i === active ? 'border-lime text-lime animate-pulse' :
              'border-white/20 text-brand-muted')}>
            {i < active ? '✓' : i + 1}
          </motion.div>
          {step}
        </motion.div>
      ))}
    </div>
  )
}
