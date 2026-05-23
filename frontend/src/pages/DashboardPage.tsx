import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Shield, AlertTriangle, XCircle, Activity, TrendingUp, Loader2 } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useScan'
import { StatCard, VerdictBadge, ThreatBadge, Skeleton } from '@/components/UI'
import { Link } from 'react-router-dom'

const PIE_COLORS = ['#C6F135', '#EF9F27', '#FF5C5C']

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-32 text-coral">
      Failed to load dashboard. <Link to="/scan" className="ml-2 underline text-lime">Scan a URL first.</Link>
    </div>
  )

  const pieData = [
    { name: 'Safe',       value: stats?.safe_count ?? 0 },
    { name: 'Suspicious', value: stats?.suspicious_count ?? 0 },
    { name: 'Dangerous',  value: stats?.dangerous_count ?? 0 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="section-eyebrow">Overview</p>
          <h1 className="font-display text-3xl font-extrabold text-white">Dashboard</h1>
        </div>
        <Link to="/scan" className="btn-primary">
          <Shield className="w-4 h-4" /> New scan
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total scans"     value={stats?.total_scans ?? 0}      icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Safe"            value={stats?.safe_count ?? 0}        accent="emerald" icon={<Shield className="w-4 h-4" />} />
        <StatCard label="Suspicious"      value={stats?.suspicious_count ?? 0}  accent="amber"   icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Dangerous"       value={stats?.dangerous_count ?? 0}   accent="coral"   icon={<XCircle className="w-4 h-4" />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Daily scans bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-lime" />
            <span className="font-semibold text-white text-sm">Daily scans (last 14 days)</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.daily_counts ?? []} barSize={16}>
              <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1A1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                labelStyle={{ color: '#E8EAED' }} itemStyle={{ color: '#C6F135' }} />
              <Bar dataKey="count" fill="#C6F135" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Verdict pie */}
        <div className="card p-5">
          <p className="font-semibold text-white text-sm mb-5">Verdict distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1A1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-4">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-brand-muted">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent scans */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="font-semibold text-white text-sm">Recent scans</span>
          <Link to="/history" className="text-xs text-lime hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(stats?.recent_scans ?? []).length === 0 ? (
            <div className="py-12 text-center text-brand-muted text-sm">
              No scans yet. <Link to="/scan" className="text-lime hover:underline">Scan your first URL →</Link>
            </div>
          ) : (stats?.recent_scans ?? []).map(scan => (
            <div key={scan.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <VerdictBadge verdict={scan.verdict} />
              <span className="font-mono text-xs text-brand-muted truncate flex-1 min-w-0">{scan.url}</span>
              <ThreatBadge type={scan.threat_type} />
              <span className="text-xs text-brand-muted whitespace-nowrap hidden sm:block">
                {new Date(scan.scanned_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
