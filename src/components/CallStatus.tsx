'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Call, CallStatus as CallStatusType } from '@/types'
import { useEffect, useState } from 'react'

interface CallStatusProps {
  call: Call
  className?: string
  onStatusUpdate?: (updatedCall: Call) => void
  enableRealTimeUpdates?: boolean
}

interface CallProgress {
  percentage: number
  stage: string
  duration: number
  isAnimating: boolean
}

// Helper function to format time safely
const formatTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '--'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      return '--'
    }

    return date.toLocaleTimeString()
  } catch (error) {
    console.warn('Error formatting time:', error, dateInput)
    return '--'
  }
}

// Helper function to format duration safely with live updates
const formatDuration = (seconds?: number): string => {
  if (typeof seconds !== 'number' || seconds < 0) return '--'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

// Helper function to format cost safely
const formatCost = (amount?: number): string => {
  if (typeof amount !== 'number') return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(amount)
}

// Enhanced status configuration with progress stages
const statusConfig: Record<
  CallStatusType,
  {
    label: string
    color: string
    bgColor: string
    progress: CallProgress
    icon: React.ReactNode
    description: string
  }
> = {
  idle: {
    label: 'Idle',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-100',
    progress: {
      percentage: 0,
      stage: 'Waiting',
      duration: 0,
      isAnimating: false,
    },
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"
        />
      </svg>
    ),
    description: 'Call is ready to be initiated',
  },
  creating: {
    label: 'Creating Call',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    progress: {
      percentage: 10,
      stage: 'Initializing',
      duration: 0,
      isAnimating: true,
    },
    icon: <LoadingSpinner size="sm" />,
    description: 'Setting up the call configuration',
  },
  dialing: {
    label: 'Dialing',
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    progress: {
      percentage: 25,
      stage: 'Connecting',
      duration: 0,
      isAnimating: true,
    },
    icon: (
      <svg
        className="w-5 h-5 animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    description: 'Attempting to connect to the recipient',
  },
  ringing: {
    label: 'Ringing',
    color: 'text-accent-600',
    bgColor: 'bg-accent-100',
    progress: {
      percentage: 50,
      stage: 'Waiting for Answer',
      duration: 0,
      isAnimating: true,
    },
    icon: (
      <svg
        className="w-5 h-5 animate-bounce"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-5 5-5-5h5v-4a7.97 7.97 0 003.51-1.51A7.97 7.97 0 0020 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 1.57.45 3.03 1.24 4.26"
        />
      </svg>
    ),
    description: 'Phone is ringing, waiting for recipient to answer',
  },
  'in-progress': {
    label: 'Call Active',
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    progress: {
      percentage: 75,
      stage: 'In Conversation',
      duration: 0,
      isAnimating: true,
    },
    icon: (
      <svg
        className="w-5 h-5 text-success-600"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    description: 'Call is active and in progress',
  },
  completed: {
    label: 'Completed',
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    progress: {
      percentage: 100,
      stage: 'Call Finished',
      duration: 0,
      isAnimating: false,
    },
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    description: 'Call completed successfully',
  },
  failed: {
    label: 'Failed',
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    progress: {
      percentage: 0,
      stage: 'Call Failed',
      duration: 0,
      isAnimating: false,
    },
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    description: 'Call failed to connect or encountered an error',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    progress: {
      percentage: 0,
      stage: 'Call Cancelled',
      duration: 0,
      isAnimating: false,
    },
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
        />
      </svg>
    ),
    description: 'Call was cancelled before completion',
  },
}

export function CallStatus({
  call,
  className = '',
  onStatusUpdate,
  enableRealTimeUpdates = true,
}: CallStatusProps) {
  const [liveDuration, setLiveDuration] = useState<number>(call.duration || 0)
  const [liveCall, setLiveCall] = useState<Call>(call)
  const [isPolling, setIsPolling] = useState(false)

  const config = statusConfig[liveCall.status]
  const isActiveCall = [
    'creating',
    'dialing',
    'ringing',
    'in-progress',
  ].includes(liveCall.status)

  // Live duration tracking for active calls
  useEffect(() => {
    if (!isActiveCall || !liveCall.startedAt) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const startTime = new Date(liveCall.startedAt!).getTime()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      setLiveDuration(elapsedSeconds)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActiveCall, liveCall.startedAt])

  // Real-time status polling for active calls
  useEffect(() => {
    if (!enableRealTimeUpdates || !isActiveCall || !liveCall.id) return

    const pollStatus = async () => {
      if (isPolling) return // Prevent concurrent polling

      try {
        setIsPolling(true)
        const response = await fetch(`/api/calls/${liveCall.id}`)

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const updatedCall = result.data
            setLiveCall(updatedCall)
            onStatusUpdate?.(updatedCall)
          }
        }
      } catch (error) {
        console.warn('Failed to poll call status:', error)
      } finally {
        setIsPolling(false)
      }
    }

    // Poll every 2 seconds for active calls
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [
    enableRealTimeUpdates,
    isActiveCall,
    liveCall.id,
    onStatusUpdate,
    isPolling,
  ])

  // Calculate dynamic progress percentage based on call duration
  const getProgressPercentage = (): number => {
    const baseProgress = config.progress.percentage

    if (liveCall.status === 'in-progress' && liveDuration > 0) {
      // Dynamic progress based on call duration (capped at 95% until completion)
      const durationProgress = Math.min(25 + (liveDuration / 60) * 10, 95)
      return Math.max(baseProgress, durationProgress)
    }

    return baseProgress
  }

  const progressPercentage = getProgressPercentage()

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{config.icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Call Status
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {config.description}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bgColor}`}
          >
            {config.label}
          </span>
        </div>
      </div>

      <div className="card-body space-y-4">
        {/* Real-time Progress Indicator */}
        {isActiveCall && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {config.progress.stage}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                  config.progress.isAnimating
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 animate-pulse'
                    : 'bg-success-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Call Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Phone Number
            </span>
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              {liveCall.phoneNumber}
            </p>
          </div>

          {liveCall.startedAt && (
            <div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Started At
              </span>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                {formatTime(liveCall.startedAt)}
              </p>
            </div>
          )}

          {(liveDuration > 0 || liveCall.duration) && (
            <div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Duration
              </span>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                {isActiveCall ? (
                  <span className="text-primary-600 dark:text-primary-400">
                    {formatDuration(liveDuration)}{' '}
                    <span className="animate-pulse">●</span>
                  </span>
                ) : (
                  formatDuration(liveCall.duration)
                )}
              </p>
            </div>
          )}

          {liveCall.cost && (
            <div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Cost
              </span>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                {formatCost(liveCall.cost)}
              </p>
            </div>
          )}

          {liveCall.assistant && (
            <div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                AI Assistant
              </span>
              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                {liveCall.assistant.name}
              </p>
            </div>
          )}

          {liveCall.vapiCallId && (
            <div>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Call ID
              </span>
              <p className="font-mono text-xs text-secondary-900 dark:text-secondary-100">
                {liveCall.vapiCallId.slice(0, 8)}...
              </p>
            </div>
          )}
        </div>

        {/* Live Status Updates Indicator */}
        {enableRealTimeUpdates && isActiveCall && (
          <div className="flex items-center justify-center pt-2 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span>Live updates active</span>
            </div>
          </div>
        )}

        {/* Call Ended Information */}
        {liveCall.endedAt && (
          <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Call ended at {formatTime(liveCall.endedAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
