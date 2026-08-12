import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-[var(--bg-primary)]/40 backdrop-blur-md border rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 transition-all duration-200 ${
            error
              ? 'border-[var(--red-glow)]/60 focus:border-[var(--red-glow)] focus:ring-[var(--red-glow)] shadow-[0_0_10px_rgba(229,72,72,0.3)] focus:shadow-[0_0_12px_var(--red-glow)]'
              : 'border-[var(--blue-border)]/40 focus:border-[var(--blue-border)] focus:ring-[var(--blue-border)] focus:shadow-[0_0_12px_var(--blue-glow)]'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
