'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

async function getRealClientIp(): Promise<string> {
  try {
    const reqHeaders = await headers()
    const forwardedFor = reqHeaders.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    const realIp = reqHeaders.get('x-real-ip') || reqHeaders.get('cf-connecting-ip')
    if (realIp) {
      return realIp.trim()
    }
  } catch (e) {
    // Background context fallback
  }
  return '127.0.0.1'
}

export interface AuditEventPayload {
  tableName: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'FAILED_LOGIN' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_ACTIVITY'
  userId?: string
  userEmail?: string
  ipAddress?: string
  endpoint?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  status: 'success' | 'failed' | 'blocked' | 'warning'
  errorMessage?: string
  severity: 'info' | 'warning' | 'critical'
}

/**
 * Server Action: Logs an audit event to public.audit_logs table.
 * Uses admin client so logs cannot be bypassed by client-side RLS policies.
 */
export async function logAuditEvent(payload: AuditEventPayload): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient()
    const detectedIp = payload.ipAddress || (await getRealClientIp())

    const { data, error } = await (adminSupabase as any)
      .from('audit_logs')
      .insert({
        table_name: payload.tableName,
        operation: payload.operation,
        user_id: payload.userId || null,
        user_email: payload.userEmail || null,
        ip_address: detectedIp,
        endpoint: payload.endpoint || null,
        old_values: payload.oldValues ? payload.oldValues : null,
        new_values: payload.newValues ? payload.newValues : null,
        status: payload.status,
        error_message: payload.errorMessage || null,
        severity: payload.severity,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[AuditLogger] Failed to insert audit log:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('[AuditLogger] Exception while logging audit event:', error)
    return null
  }
}

/**
 * Convenience helper: Log a failed authentication login attempt
 */
export async function logFailedLogin(email: string, ipAddress: string, reason: string) {
  return logAuditEvent({
    tableName: 'auth.users',
    operation: 'FAILED_LOGIN',
    userEmail: email,
    ipAddress,
    endpoint: '/auth/login',
    status: 'failed',
    errorMessage: reason,
    severity: 'warning',
  })
}

/**
 * Convenience helper: Log a privilege escalation attempt
 */
export async function logPrivilegeEscalationAttempt(
  userId: string,
  attemptedRole: string,
  ipAddress: string
) {
  return logAuditEvent({
    tableName: 'profiles',
    operation: 'PRIVILEGE_ESCALATION',
    userId,
    ipAddress,
    endpoint: '/api/auth/update-role',
    status: 'blocked',
    errorMessage: `Attempted unauthorized escalation to role: ${attemptedRole}`,
    severity: 'critical',
  })
}

/**
 * Convenience helper: Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string,
  activity: string,
  ipAddress: string
) {
  return logAuditEvent({
    tableName: 'audit_logs',
    operation: 'SUSPICIOUS_ACTIVITY',
    userId,
    ipAddress,
    status: 'warning',
    errorMessage: activity,
    severity: 'warning',
  })
}
