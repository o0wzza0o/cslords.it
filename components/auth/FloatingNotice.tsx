'use client'

import { useState, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function FloatingNotice() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Only show on /login and /register
    if (pathname === '/login' || pathname === '/register') {
      setShouldRender(true)
      // Slight delay for smooth entrance
      const showTimer = setTimeout(() => setIsVisible(true), 300)

      // Auto hide after 20 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setShouldRender(false), 500) // wait for animation
      }, 20000)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    } else {
      setIsVisible(false)
      setTimeout(() => setShouldRender(false), 500)
    }
  }, [pathname])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => setShouldRender(false), 500)
  }

  if (!shouldRender) return null

  return (
    <div
      dir="rtl"
      className={`fixed z-[9999] top-4 sm:top-6 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[340px] p-4 
      bg-[#0a1020]/75 backdrop-blur-xl border border-[var(--blue-glow)]/40 rounded-xl
      shadow-[inset_0_0_15px_rgba(46,111,217,0.1),0_0_20px_rgba(46,111,217,0.2)] 
      transition-all duration-500 ease-out
      ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : 'opacity-0 -translate-y-4 sm:-translate-y-0 sm:translate-x-8 scale-95'}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 pt-0.5">
          <Info className="w-5 h-5 text-[var(--blue-glow)] drop-shadow-[0_0_5px_rgba(46,111,217,0.8)]" />
        </div>
        <div className="flex-1">
         <p className="text-[13px] text-white leading-relaxed font-medium">
           الموقع ليس له أي علاقة بنظام LMS التابع للجامعه , و يجب انشاء حساب جديد ب استخدام الايميل الجامعي لدخول الموقع
مع العلم ان الموقع في نسخه ( البيتا للتجربه )
          </p>
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
