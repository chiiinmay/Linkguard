export type Verdict = 'safe' | 'suspicious' | 'dangerous'
export type ThreatType = 'phishing' | 'honeytrap' | 'scam' | 'malware' | 'clean' | 'unknown'
export type ModelTier = 'basic' | 'advanced'

export interface SignalResult {
  name: string
  value: string | number
  status: 'ok' | 'warn' | 'bad'
}

export interface ScanResult {
  id: string
  url: string
  verdict: Verdict
  threat_type: ThreatType
  confidence: number          // 0–1
  threat_score: number        // 0–100
  explanation: string
  signals: SignalResult[]
  model_used: ModelTier
  duration_ms: number
  scanned_at: string
  // external checks
  google_safe_browsing?: boolean
  virustotal_detections?: number | null
  domain_age_days?: number | null
  redirect_count?: number
}

export interface ScanRequest {
  url: string
  model?: ModelTier
}

export interface User {
  id: string
  email: string
  created_at: string
  scan_count: number
  plan: 'free' | 'pro' | 'team'
}

export interface DashboardStats {
  total_scans: number
  safe_count: number
  suspicious_count: number
  dangerous_count: number
  scans_today: number
  top_threats: { type: ThreatType; count: number }[]
  recent_scans: ScanResult[]
  daily_counts: { date: string; count: number }[]
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}
