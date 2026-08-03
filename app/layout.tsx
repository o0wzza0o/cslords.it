import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cs Lords — Advanced Open Learning Platform',
  description: 'Empowering students and educators with a free, futuristic Learning Management System.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[var(--bg-primary)] text-white antialiased selection:bg-[var(--red-action)] selection:text-white"
      >
        {children}
      </body>
    </html>
  )
}
