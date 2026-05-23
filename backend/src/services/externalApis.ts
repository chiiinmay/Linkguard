import axios from 'axios'
import { logger } from '../config/logger'

// ── Google Safe Browsing ──────────────────────────────────────────
export async function checkGoogleSafeBrowsing(url: string): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  if (!apiKey) {
    logger.warn('GOOGLE_SAFE_BROWSING_API_KEY not set — skipping GSB check')
    return false
  }
  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`
    const body = {
      client: { clientId: 'linkguard-ai', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes:      ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes:    ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries:    [{ url }],
      },
    }
    const { data } = await axios.post(endpoint, body, { timeout: 5000 })
    return !!(data.matches && data.matches.length > 0)
  } catch (err) {
    logger.error('GSB check failed:', err)
    return false
  }
}

// ── VirusTotal ────────────────────────────────────────────────────
export async function checkVirusTotal(url: string): Promise<number | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) return null
  try {
    // Submit URL for analysis
    const submitResp = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      new URLSearchParams({ url }),
      { headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 },
    )
    const analysisId = submitResp.data?.data?.id
    if (!analysisId) return null

    // Wait briefly, then fetch results
    await new Promise(r => setTimeout(r, 3000))
    const resultResp = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      { headers: { 'x-apikey': apiKey }, timeout: 8000 },
    )
    const stats = resultResp.data?.data?.attributes?.stats
    if (!stats) return null
    return (stats.malicious ?? 0) + (stats.suspicious ?? 0)
  } catch (err) {
    logger.warn('VirusTotal check failed (non-critical):', (err as Error).message)
    return null
  }
}

// ── WHOIS domain age ──────────────────────────────────────────────
export async function getDomainAgeDays(hostname: string): Promise<number | null> {
  const apiKey = process.env.WHOIS_API_KEY
  if (!apiKey) return null
  try {
    const { data } = await axios.get('https://www.whoisxmlapi.com/whoisserver/WhoisService', {
      params: { apiKey, domainName: hostname, outputFormat: 'JSON' },
      timeout: 6000,
    })
    const created = data?.WhoisRecord?.createdDate
    if (!created) return null
    const diffMs  = Date.now() - new Date(created).getTime()
    return Math.floor(diffMs / 86_400_000)
  } catch (err) {
    logger.warn('WHOIS lookup failed (non-critical):', (err as Error).message)
    return null
  }
}

// ── Redirect chain ────────────────────────────────────────────────
export async function getRedirectCount(url: string): Promise<number> {
  try {
    let redirects = 0
    let current   = url
    while (redirects < 10) {
      const resp = await axios.head(current, {
        maxRedirects: 0, validateStatus: s => s < 400,
        timeout: 4000,
      })
      const loc = resp.headers['location']
      if (![301, 302, 303, 307, 308].includes(resp.status) || !loc) break
      current = loc.startsWith('http') ? loc : new URL(loc, current).href
      redirects++
    }
    return redirects
  } catch {
    return 0
  }
}
