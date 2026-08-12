import { ShieldAlert } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="lms-card max-w-md w-full p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50 shadow-[0_0_15px_rgba(229,72,72,0.4)]">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4 tracking-wide">
          Account Suspended
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6" dir="rtl">
          عذراً، حسابك موقوف حالياً. يرجى التواصل مع الدعم الفني عبر البريد الإلكتروني أدناه لمزيد من المعلومات:
        </p>
        <div className="bg-[#0a1020]/80 border border-slate-700/50 rounded-lg p-3 w-full">
          <a href="mailto:support@cslords.it" className="text-lg font-mono font-semibold text-[var(--blue-glow)] hover:text-white transition-colors">
            support@cslords.it
          </a>
        </div>
      </div>
    </div>
  )
}
