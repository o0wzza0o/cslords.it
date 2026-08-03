import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue-border)] disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }

  const variantStyles = {
    primary: 'bg-[var(--red-action)] text-[var(--text-primary)] hover:opacity-90 hover:shadow-[0_0_15px_var(--red-glow)]',
    secondary: 'bg-[var(--bg-primary)]/40 backdrop-blur-md text-[var(--text-primary)] border border-[var(--blue-border)] hover:bg-[var(--blue-border)]/20 hover:shadow-[0_0_15px_var(--blue-glow)]',
    danger: 'bg-red-600/80 text-white hover:bg-red-500 border border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)]/50 backdrop-blur-sm',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
