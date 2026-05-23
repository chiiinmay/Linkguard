import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useScanStore } from '@/lib/store'
import type { ScanResult, ScanRequest, DashboardStats } from '@/types'

// ── Submit a scan ─────────────────────────────────────────────────
export function useScan() {
  const { setResult, setScanning } = useScanStore()

  return useMutation<ScanResult, { message: string }, ScanRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ScanResult>('/api/scan', payload)
      return data
    },
    onMutate: () => {
      setScanning(true)
      setResult(null)
    },
    onSuccess: (data) => {
      setResult(data)
      setScanning(false)
      const labels = { safe: '✅ Safe', suspicious: '⚠️ Suspicious', dangerous: '🚫 Dangerous' }
      toast.success(`${labels[data.verdict]} — scan complete`)
    },
    onError: (err) => {
      setScanning(false)
      toast.error(err.message ?? 'Scan failed')
    },
  })
}

// ── Fetch scan history ────────────────────────────────────────────
export function useScanHistory(page = 1, limit = 20) {
  return useQuery<{ data: ScanResult[]; total: number }>({
    queryKey: ['scan-history', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/api/scan/history', { params: { page, limit } })
      return data
    },
  })
}

// ── Fetch dashboard stats ─────────────────────────────────────────
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/scan/stats')
      return data
    },
    refetchInterval: 60_000,
  })
}

// ── Fetch single scan ─────────────────────────────────────────────
export function useScanById(id: string) {
  return useQuery<ScanResult>({
    queryKey: ['scan', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/scan/${id}`)
      return data
    },
    enabled: !!id,
  })
}
