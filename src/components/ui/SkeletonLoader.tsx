'use client'

interface SkeletonLoaderProps {
  className?: string
  children?: React.ReactNode
}

export function SkeletonLoader({
  className = '',
  children,
}: SkeletonLoaderProps) {
  return (
    <div
      className={`animate-pulse bg-secondary-200 dark:bg-secondary-700 rounded ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

// Preset skeleton components for common patterns
export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLoader
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <SkeletonLoader className="h-6 w-1/3" />
      </div>
      <div className="card-body space-y-4">
        <SkeletonText lines={3} />
        <div className="flex space-x-2">
          <SkeletonLoader className="h-8 w-20" />
          <SkeletonLoader className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={`card ${className}`}>
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                {Array.from({ length: columns }, (_, i) => (
                  <th key={i} className="px-6 py-3">
                    <SkeletonLoader className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: columns }, (_, j) => (
                    <td key={j} className="px-6 py-4">
                      <SkeletonLoader className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
