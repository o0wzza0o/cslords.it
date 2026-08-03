import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[var(--blue-border)]/30 bg-[var(--bg-primary)]/60 backdrop-blur-md py-8 px-6 text-xs text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Cs Lords Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold text-white tracking-wider">CS LORDS</span>
          <span className="text-slate-500">| Next-Gen Free Open Learning</span>
        </div>
        <p className="text-slate-400 text-center">
          &copy; {new Date().getFullYear()} Cs Lords. Built with Next.js 14+ and Supabase.
        </p>
      </div>
    </footer>
  )
}
