import { headers } from 'next/headers'
import crypto from 'crypto'

/**
 * Generates a server-side composite device fingerprint from HTTP request headers.
 * Combines User-Agent, Accept-Language, IP, and Sec-Ch-Ua hardware signals.
 */
export async function getCompositeDeviceFingerprint(clientFingerprintHeader?: string): Promise<{
  ip: string
  fingerprint: string
  compositeKey: string
}> {
  let ip = '127.0.0.1'
  let userAgent = 'unknown-ua'
  let acceptLanguage = 'en'
  let secChUa = ''

  try {
    const reqHeaders = await headers()

    // 1. Extract IP
    const forwardedFor = reqHeaders.get('x-forwarded-for')
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim()
    } else {
      ip = reqHeaders.get('x-real-ip') || reqHeaders.get('cf-connecting-ip') || '127.0.0.1'
    }

    // 2. Extract Device Signals
    userAgent = reqHeaders.get('user-agent') || 'unknown-ua'
    acceptLanguage = reqHeaders.get('accept-language') || 'en'
    secChUa = reqHeaders.get('sec-ch-ua') || ''
  } catch (e) {
    // Context fallback
  }

  // Combine client-side canvas/screen fingerprint (if sent) with server headers
  const rawSignature = `${userAgent}|${acceptLanguage}|${secChUa}|${clientFingerprintHeader || ''}`

  // Create SHA-256 fingerprint hash
  const fingerprint = crypto.createHash('sha256').update(rawSignature).digest('hex')

  // Create composite key combining IP and Device Fingerprint
  const compositeKey = `${ip}:${fingerprint.substring(0, 16)}`

  return {
    ip,
    fingerprint,
    compositeKey,
  }
}
