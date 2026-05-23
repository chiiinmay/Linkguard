import axios from 'axios'
import { logger } from '../config/logger'

const ML_URL = process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:8000'

export interface MLPayload {
  url: string
  domain_age_days: number 
  redirect_count:  number
  model: 'basic' | 'advanced'
}

export interface MLResponse {
  verdict:      'safe' | 'suspicious' | 'dangerous'
  threat_type:  'phishing' | 'honeytrap' | 'scam' | 'malware' | 'clean' | 'unknown'
  confidence:   number
  threat_score: number
  explanation:  string
  signals: Array<{ name: string; value: string | number; status: 'ok' | 'warn' | 'bad' }>
  model_used: 'basic' | 'advanced'
  duration_ms: number
}

export async function callMLService(payload: MLPayload): Promise<MLResponse> {
  try {
    console.log("➡️ Calling ML at:", `${ML_URL}/predict`)
    console.log("➡️ Payload:", payload)

    const { data } = await axios.post(
      `${ML_URL}/predict`,
      {
        url: payload.url,
        domain_age_days: Number(payload.domain_age_days) || 0,
        redirect_count: Number(payload.redirect_count) || 0,
        model: payload.model || "basic"
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    )

    console.log("✅ ML RESPONSE:", data)

    return data
  } catch (err: any) {
    console.log("❌ ML ERROR FULL:", err.response?.data || err.message)
    throw Object.assign(new Error('ML service unavailable. Please try again.'), { status: 503 })
  }
}