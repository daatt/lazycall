'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className = '',
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const variantClasses = {
    primary: 'border-primary-600 border-t-transparent',
    secondary: 'border-secondary-400 border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${variantClasses[variant]}
          border-2 rounded-full animate-spin
        `}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="ml-2 text-sm text-secondary-600 dark:text-secondary-400">
          {label}
        </span>
      )}
    </div>
  )
}
