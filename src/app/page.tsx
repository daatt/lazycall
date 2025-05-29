'use client'

import { CallForm } from '@/components/CallForm'
import { CallStatus } from '@/components/CallStatus'
import DashboardLayout from '@/components/ui/DashboardLayout'
import { InlineError } from '@/components/ui/ErrorDisplay'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'
import { ApiResponse, Call, CallFormData } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export default function Home() {
  const [isCreatingCall, setIsCreatingCall] = useState(false)
  const [showCallForm, setShowCallForm] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [lastCreatedCall, setLastCreatedCall] = useState<Call | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Set document title and simulate initial page load
  useEffect(() => {
    document.title = 'Dashboard - AI Agent Calling'

    // Simulate checking system status
    const checkSystemStatus = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API check
        setIsPageLoading(false)
      } catch {
        setError('Failed to load dashboard')
        setIsPageLoading(false)
      }
    }

    checkSystemStatus()
  }, [])

  // Handle real-time call status updates
  const handleCallStatusUpdate = useCallback((updatedCall: Call) => {
    setLastCreatedCall(updatedCall)

    // Update status message based on call status
    switch (updatedCall.status) {
      case 'creating':
        setCallStatus('Setting up your call...')
        break
      case 'dialing':
        setCallStatus(`Dialing ${updatedCall.phoneNumber}...`)
        break
      case 'ringing':
        setCallStatus('Phone is ringing...')
        break
      case 'in-progress':
        setCallStatus('Call connected and in progress!')
        break
      case 'completed':
        setCallStatus('Call completed successfully!')
        break
      case 'failed':
        setCallStatus('Call failed to connect')
        break
      case 'cancelled':
        setCallStatus('Call was cancelled')
        break
      default:
        setCallStatus(`Call status: ${updatedCall.status}`)
    }

    // Auto-dismiss status for completed/failed calls
    if (['completed', 'failed', 'cancelled'].includes(updatedCall.status)) {
      setTimeout(() => {
        setCallStatus(null)
        setLastCreatedCall(null)
      }, 15000)
    }
  }, [])

  const handleCreateCall = async (formData: CallFormData) => {
    setIsCreatingCall(true)
    setCallStatus('Creating call...')
    setError(null)

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const result: ApiResponse<Call> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from server')
      }

      const call = result.data
      setLastCreatedCall(call)
      setCallStatus(`Call created successfully! Status: ${call.status}`)
      setShowCallForm(false)
      setRetryCount(0) // Reset retry count on success

      // Initial status update
      handleCallStatusUpdate(call)
    } catch (error) {
      console.error('Failed to create call:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to create call: ${errorMessage}`)
      setCallStatus(null)
      setLastCreatedCall(null)
    } finally {
      setIsCreatingCall(false)
    }
  }

  const handleRetryCall = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    // If we have form data, we could retry the last call
    // For now, just clear the error and let user try again
  }

  const clearError = () => {
    setError(null)
    setRetryCount(0)
  }

  const clearStatus = () => {
    setCallStatus(null)
    setLastCreatedCall(null)
  }

  const isActiveCall = lastCreatedCall
    ? ['creating', 'dialing', 'ringing', 'in-progress'].includes(
        lastCreatedCall.status
      )
    : false

  // Show loading state for initial page load
  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Create and manage your AI-powered phone calls
          </p>
        </div>

        {/* Global Error Display */}
        {error && (
          <InlineError
            message={error}
            onRetry={retryCount < 3 ? handleRetryCall : undefined}
            retryLabel={`Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
            className="mb-6"
          />
        )}

        {/* Real-time Call Status Display */}
        {lastCreatedCall && (
          <div className="max-w-2xl mx-auto">
            <CallStatus
              call={lastCreatedCall}
              onStatusUpdate={handleCallStatusUpdate}
              enableRealTimeUpdates={isActiveCall}
            />

            {/* Enhanced Status Message */}
            {callStatus && (
              <div
                className={`card mt-4 ${
                  callStatus.includes('successfully') ||
                  callStatus.includes('progress')
                    ? 'border-success-200 bg-success-50 dark:bg-success-900/20'
                    : callStatus.includes('failed') ||
                        callStatus.includes('Failed')
                      ? 'border-error-200 bg-error-50 dark:bg-error-900/20'
                      : 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'
                }`}
              >
                <div className="card-body text-center">
                  <div className="flex items-center justify-center mb-2">
                    {isActiveCall && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    <p
                      className={`font-medium ${
                        callStatus.includes('successfully') ||
                        callStatus.includes('progress')
                          ? 'text-success-700 dark:text-success-300'
                          : callStatus.includes('failed') ||
                              callStatus.includes('Failed')
                            ? 'text-error-700 dark:text-error-300'
                            : 'text-primary-700 dark:text-primary-300'
                      }`}
                    >
                      {callStatus}
                    </p>
                  </div>

                  <button
                    onClick={clearStatus}
                    className="mt-2 text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call Form */}
        {showCallForm && (
          <div className="card max-w-2xl mx-auto">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  Create New Call
                </h2>
                <button
                  onClick={() => {
                    setShowCallForm(false)
                    clearError()
                  }}
                  className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                  disabled={isCreatingCall}
                >
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
                </button>
              </div>
            </div>
            <div className="card-body">
              <CallForm
                onSubmit={handleCreateCall}
                isLoading={isCreatingCall}
              />
            </div>
          </div>
        )}

        {/* Main Actions */}
        {!showCallForm && !lastCreatedCall && (
          <div className="card max-w-2xl mx-auto">
            <div className="card-header text-center">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Ready to make a call?
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                Create a new AI-powered phone call in seconds
              </p>
            </div>
            <div className="card-body text-center">
              <button
                onClick={() => {
                  setShowCallForm(true)
                  clearError()
                }}
                disabled={isCreatingCall}
                className="btn btn-primary btn-lg"
              >
                {isCreatingCall ? (
                  <>
                    <LoadingSpinner
                      size="sm"
                      variant="white"
                      className="mr-2"
                    />
                    Creating Call...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
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
                    New Call
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Secondary Actions for Active Calls */}
        {lastCreatedCall && (
          <div className="flex justify-center space-x-4 max-w-2xl mx-auto">
            <button
              onClick={() => {
                setShowCallForm(true)
                clearError()
              }}
              disabled={isCreatingCall}
              className="btn btn-secondary"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Make Another Call
            </button>

            <Link href="/history" className="btn btn-outline">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View All Calls
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/history"
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                View Call History
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                Browse previous calls and transcripts
              </p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-secondary-600 dark:text-secondary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                Configure Settings
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                Customize AI behavior and API settings
              </p>
            </div>
          </Link>
        </div>

        {/* Development Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Development Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Task 5.1 - Real-time CallStatus component implemented ✅
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Real-time Features
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Live call status tracking</li>
                  <li>• Dynamic progress indicators</li>
                  <li>• Real-time duration counter</li>
                  <li>• Automatic status polling</li>
                  <li>• Visual progress bars</li>
                  <li>• Animated status indicators</li>
                  <li>• Enhanced status icons</li>
                  <li>• Live update notifications</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Enhanced CallStatus Component
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Progressive status stages</li>
                  <li>• Real-time Vapi API sync</li>
                  <li>• Dynamic duration calculation</li>
                  <li>• Enhanced visual feedback</li>
                  <li>• Call details display</li>
                  <li>• Cost and timing tracking</li>
                  <li>• Professional progress design</li>
                  <li>• Responsive layout</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-lg">
              <p className="text-xs text-success-700 dark:text-success-300">
                <strong>Status:</strong> Task 5.1 completed! Dashboard now
                includes real-time call status tracking with progress
                indicators, live duration counters, and automatic Vapi API
                synchronization for active calls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
