import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { useScanHistory } from '@/hooks/useScan'
import { VerdictBadge, ThreatBadge, Skeleton, EmptyState } from '@/components/UI'

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useScanHistory(page, 20)

  const totalPages = Math.ceil((data?.total ?? 0) / 20)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="section-eyebrow">Your scans</p>
          <h1 className="font-display text-3xl font-extrabold text-white">Scan history</h1>
        </div>
        <Link to="/scan" className="btn-primary">+ New scan</Link>
      </div>

      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs text-brand-muted font-medium uppercase tracking-wide">
          <span>URL</span>
          <span>Verdict</span>
          <span>Threat</span>
          <span>Score</span>
          <span>Date</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-px bg-white/[0.03]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-ink-2 px-5 py-4">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : !data?.data?.length ? (
          <EmptyState icon={<History />} title="No scan history yet"
            desc="Scan your first URL to see results here." />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data.data.map(scan => (
              <div key={scan.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <span className="font-mono text-xs text-brand-muted truncate" title={scan.url}>
                  {scan.url.length > 60 ? scan.url.slice(0, 60) + '…' : scan.url}
                </span>
                <VerdictBadge verdict={scan.verdict} />
                <ThreatBadge type={scan.threat_type} />
                <span className={`text-sm font-bold tabular-nums ${
                  scan.threat_score > 70 ? 'text-coral' :
                  scan.threat_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {scan.threat_score}
                </span>
                <span className="text-xs text-brand-muted whitespace-nowrap">
                  {new Date(scan.scanned_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
            <span className="text-xs text-brand-muted">
              Page {page} of {totalPages} · {data?.total ?? 0} total
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost py-1.5 px-2.5 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-ghost py-1.5 px-2.5 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
