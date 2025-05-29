'use client'

import { Button } from './Button'

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  variant?: 'error' | 'warning' | 'info'
  showIcon?: boolean
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
  variant = 'error',
  showIcon = true,
}: ErrorDisplayProps) {
  const variantStyles = {
    error: {
      container: 'border-error-200 bg-error-50 dark:bg-error-900/20',
      title: 'text-error-700 dark:text-error-300',
      message: 'text-error-600 dark:text-error-400',
      icon: 'text-error-500',
    },
    warning: {
      container: 'border-warning-200 bg-warning-50 dark:bg-warning-900/20',
      title: 'text-warning-700 dark:text-warning-300',
      message: 'text-warning-600 dark:text-warning-400',
      icon: 'text-warning-500',
    },
    info: {
      container: 'border-primary-200 bg-primary-50 dark:bg-primary-900/20',
      title: 'text-primary-700 dark:text-primary-300',
      message: 'text-primary-600 dark:text-primary-400',
      icon: 'text-primary-500',
    },
  }

  const styles = variantStyles[variant]

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )
      case 'info':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div className={`card border ${styles.container} ${className}`}>
      <div className="card-body text-center">
        {showIcon && (
          <div className={`w-12 h-12 mx-auto mb-4 ${styles.icon}`}>
            {getIcon()}
          </div>
        )}

        <h3 className={`text-lg font-medium mb-2 ${styles.title}`}>{title}</h3>

        <p className={`mb-4 ${styles.message}`}>{message}</p>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant={variant === 'error' ? 'secondary' : 'primary'}
            className="mx-auto"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// Compact error display for inline use
export function InlineError({
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border border-error-200 bg-error-50 dark:bg-error-900/20 ${className}`}
    >
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-error-500 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-error-700 dark:text-error-300">
          {message}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200 underline ml-4"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
