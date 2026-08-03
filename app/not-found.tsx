import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--blue-border)] mb-4 shadow-[0_0_20px_var(--blue-glow)]">
        <FileQuestion className="w-12 h-12 text-[var(--blue-icon)]" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-[var(--blue-glow)] mb-3">Page Not Found</h2>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mb-6">
        The route you are looking for does not exist or has been moved.
      </p>
      <Link href="/home" className="btn-primary text-xs">
        <Home className="w-4 h-4" /> Return to Home
      </Link>
    </div>
  )
}
