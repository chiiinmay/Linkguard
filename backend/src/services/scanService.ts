import { v4 as uuidv4 } from 'uuid'
import { supabase }          from '../config/supabase'
import { callMLService }     from './mlClient'
import {
  checkGoogleSafeBrowsing,
  checkVirusTotal,
  getDomainAgeDays,
  getRedirectCount,
} from './externalApis'
import { logger } from '../config/logger'
import type { MLResponse } from './mlClient'

export interface ScanOptions {
  url:    string
  model:  'basic' | 'advanced'
  userId?: string
}

export interface ScanRecord extends MLResponse {
  id:                    string
  url:                   string
  scanned_at:            string
  google_safe_browsing:  boolean
  virustotal_detections: number | null
  domain_age_days:       number | null
  redirect_count:        number
}

export async function performScan(opts: ScanOptions): Promise<ScanRecord> {
  const { url, model = 'basic' } = opts

  // Extract hostname for WHOIS
  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch (err) {
    logger.warn(`Invalid URL provided to performScan: ${url}`)
  }

  // Run external API checks in parallel
  const [
    google_safe_browsing,
    virustotal_detections,
    domain_age_days,
    redirect_count
  ] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(url),
    hostname ? getDomainAgeDays(hostname) : Promise.resolve(null),
    getRedirectCount(url)
  ])

  // Call the ML service with the gathered data
  const mlResult = await callMLService({
    url,
    domain_age_days: domain_age_days ?? -1,
    redirect_count,
    model
  })

  return {
    ...mlResult,
    id: uuidv4(),
    url,
    scanned_at: new Date().toISOString(),
    google_safe_browsing,
    virustotal_detections,
    domain_age_days,
    redirect_count,
    duration_ms: mlResult.duration_ms || 0
  }
}