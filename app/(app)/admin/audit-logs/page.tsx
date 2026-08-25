'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Filter,
  Search,
  Clock,
  User,
  Database,
  Globe,
  RefreshCw
} from 'lucide-react'

interface AuditLogItem {
  id: string
  table_name: string
  operation: string
  user_id: string | null
  user_email: string | null
  ip_address: string | null
  endpoint: string | null
  old_values: any
  new_values: any
  status: string
  error_message: string | null
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

export default function AuditLogsAdminPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const [filters, setFilters] = useState({
    severity: 'all',
    operation: 'all',
    search: '',
  })

  const fetchAuditLogs = useCallback(async () => {
    setRefreshing(true)
    try {
      let query = (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }

      if (filters.operation !== 'all') {
        query = query.eq('operation', filters.operation)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
      } else {
        let filtered: AuditLogItem[] = data || []
        if (filters.search.trim()) {
          const s = filters.search.toLowerCase()
          filtered = filtered.filter(
            (log: AuditLogItem) =>
              (log.user_email && log.user_email.toLowerCase().includes(s)) ||
              (log.table_name && log.table_name.toLowerCase().includes(s)) ||
              (log.ip_address && log.ip_address.includes(s)) ||
              (log.operation && log.operation.toLowerCase().includes(s))
          )
        }
        setLogs(filtered)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, supabase])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            حرج (Critical)
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            تحذير (Warning)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Info className="w-3.5 h-3.5" />
            معلومات (Info)
          </span>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'blocked':
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {status === 'blocked' ? 'مرفوض' : 'فشل'}
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ناجح
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">سجل الأنشطة الأمنية (Audit Logs)</h1>
            <p className="text-sm text-slate-400">مراقبة العمليات الحساسة، محاولات الدخول، وتصعيد الصلاحيات في الوقت الفعلي</p>
          </div>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          تحديث السجل
        </button>
      </div>

      {/* Filter Options Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالبريد، IP، أو العملية..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">جميع مستويات الخطورة</option>
            <option value="info">معلومات (Info)</option>
            <option value="warning">تحذير (Warning)</option>
            <option value="critical">حرج (Critical)</option>
          </select>
        </div>

        <div>
          <select
            value={filters.operation}
            onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">جميع أنواع العمليات</option>
            <option value="INSERT">إدراج (INSERT)</option>
            <option value="UPDATE">تعديل (UPDATE)</option>
            <option value="DELETE">حذف (DELETE)</option>
            <option value="FAILED_LOGIN">دخول فاشل (FAILED_LOGIN)</option>
            <option value="PRIVILEGE_ESCALATION">محاولة تصعيد صلاحية</option>
            <option value="SUSPICIOUS_ACTIVITY">نشاط مريب</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 px-2">
          إجمالي النتائج: <span className="font-bold text-slate-200 mr-1">{logs.length}</span>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">جاري تحميل سجلات الأمان...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">لا توجد سجلات أمنية مطابقة للفلاتر الحالية</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                  <th className="p-4">الوقت والتاريخ</th>
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">الجدول / الهدف</th>
                  <th className="p-4">العملية</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">الخطورة</th>
                  <th className="p-4">عنوان IP</th>
                  <th className="p-4">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 whitespace-nowrap text-xs text-slate-400 dir-ltr text-right">
                      {new Date(log.timestamp).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-200 font-medium">{log.user_email || 'غير معرف'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300">
                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                        {log.table_name}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs font-semibold text-slate-200">{log.operation}</td>
                    <td className="p-4">{getStatusBadge(log.status)}</td>
                    <td className="p-4">{getSeverityBadge(log.severity)}</td>
                    <td className="p-4 text-xs font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        عرض المفصل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for Log Inspection */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                تفاصيل السجل الأمني
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div><span className="text-slate-500">المستخدم:</span> {selectedLog.user_email || 'غير معرف'}</div>
              <div><span className="text-slate-500">عنوان IP:</span> {selectedLog.ip_address || '127.0.0.1'}</div>
              <div><span className="text-slate-500">الجدول:</span> {selectedLog.table_name}</div>
              <div><span className="text-slate-500">العملية:</span> {selectedLog.operation}</div>
              <div><span className="text-slate-500">الخطورة:</span> {selectedLog.severity}</div>
              <div><span className="text-slate-500">الحالة:</span> {selectedLog.status}</div>
            </div>

            {selectedLog.error_message && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-400">
                <strong className="block mb-1 font-semibold">رسالة الخطأ / الاستثناء:</strong>
                {selectedLog.error_message}
              </div>
            )}

            {selectedLog.old_values && (
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">البيانات السابقة (Old Values):</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">البيانات الجديدة (New Values):</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
