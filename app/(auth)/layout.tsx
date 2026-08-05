import React from 'react'
import { FloatingNotice } from '@/components/auth/FloatingNotice'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm relative">
      <FloatingNotice />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  )
}
