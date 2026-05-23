import { Shield } from 'lucide-react'
import ScanForm from '@/components/ScanForm'
import ScanResultCard from '@/components/ScanResult'
import { useScanStore } from '@/lib/store'

export default function ScanPage() {
  const { currentResult, scanning } = useScanStore()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lime/10 border border-lime/20 mb-5">
          <Shield className="w-7 h-7 text-lime" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Scan any URL
        </h1>
        <p className="text-brand-muted text-lg mt-3 font-light">
          AI-powered detection of phishing, honeytraps, scams, and malware links.
        </p>
      </div>

      {/* Scanner form */}
      <ScanForm />

      {/* Result */}
      {!scanning && currentResult && (
        <div className="mt-10">
          <ScanResultCard result={currentResult} />
        </div>
      )}

      {/* Idle state hint */}
      {!scanning && !currentResult && (
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🎣', label: 'Phishing', desc: 'Credential theft pages' },
            { emoji: '🪤', label: 'Honeytraps', desc: 'Romance & social bait' },
            { emoji: '💸', label: 'Scams',    desc: 'Prize & investment fraud' },
          ].map(t => (
            <div key={t.label} className="card p-5">
              <div className="text-3xl mb-2">{t.emoji}</div>
              <p className="font-display font-bold text-white text-sm">{t.label}</p>
              <p className="text-xs text-brand-muted mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
