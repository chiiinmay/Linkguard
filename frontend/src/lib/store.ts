import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, ScanResult } from '@/types'

// ── Auth store ────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  setUser: (u: User | null) => void
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ user: null, setUser: (user) => set({ user }) }),
    { name: 'linkguard-auth' },
  ),
)

// ── Scan store ────────────────────────────────────────────────────
interface ScanState {
  currentResult: ScanResult | null
  scanning: boolean
  setResult: (r: ScanResult | null) => void
  setScanning: (v: boolean) => void
}
export const useScanStore = create<ScanState>((set) => ({
  currentResult: null,
  scanning: false,
  setResult: (currentResult) => set({ currentResult }),
  setScanning: (scanning) => set({ scanning }),
}))

// ── Settings store ────────────────────────────────────────────────
interface SettingsState {
  defaultModel: 'basic' | 'advanced'
  setDefaultModel: (m: 'basic' | 'advanced') => void
}
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({ defaultModel: 'basic', setDefaultModel: (m) => set({ defaultModel: m }) }),
    { name: 'linkguard-settings' },
  ),
)
