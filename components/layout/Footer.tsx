import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[var(--blue-border)]/30 bg-[var(--bg-primary)]/60 backdrop-blur-md py-8 px-6 text-xs text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Cs Lords Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold text-white tracking-wider">CS LORDS</span>
          <span className="text-slate-500 text-center sm:text-left">
            | Developed and maintained by{' '}
            <a
              href="https://mix-app.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--blue-glow)] hover:text-white hover:drop-shadow-[0_0_8px_rgba(46,111,217,0.8)] transition-all duration-300"
            >
              Mix Host
            </a>
          </span>
        </div>
        <p className="text-slate-400 text-center mt-2 md:mt-0">
          &copy; 2026 CS Lords. Powered by Mix Host.
        </p>
      </div>
    </footer>
  )
}
