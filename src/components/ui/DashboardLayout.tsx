import Navigation from './Navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
  className?: string
}

export default function DashboardLayout({
  children,
  maxWidth = '7xl',
  className = '',
}: DashboardLayoutProps) {
  const getMaxWidthClass = (size: string) => {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full',
    }
    return sizes[size as keyof typeof sizes] || 'max-w-7xl'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-primary-900">
      <Navigation />

      <main
        className={`${getMaxWidthClass(maxWidth)} mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}
      >
        {children}
      </main>
    </div>
  )
}
