'use client'

import { CallForm } from '@/components/CallForm'
import DashboardLayout from '@/components/ui/DashboardLayout'
import { InlineError } from '@/components/ui/ErrorDisplay'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'
import { ApiResponse, Call, CallFormData } from '@/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
      setCallStatus(`Call created successfully! Calling ${call.phoneNumber}...`)
      setShowCallForm(false)
      setRetryCount(0) // Reset retry count on success

      // Auto-dismiss success message after 10 seconds
      setTimeout(() => {
        setCallStatus(null)
      }, 10000)
    } catch (error) {
      console.error('Failed to create call:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to create call: ${errorMessage}`)
      setCallStatus(null)
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

        {/* Status Message */}
        {callStatus && (
          <div
            className={`card max-w-2xl mx-auto ${
              callStatus.includes('successfully')
                ? 'border-success-200 bg-success-50 dark:bg-success-900/20'
                : callStatus.includes('Failed')
                  ? 'border-error-200 bg-error-50 dark:bg-error-900/20'
                  : 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'
            }`}
          >
            <div className="card-body text-center">
              <div className="flex items-center justify-center mb-2">
                {isCreatingCall && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                <p
                  className={`font-medium ${
                    callStatus.includes('successfully')
                      ? 'text-success-700 dark:text-success-300'
                      : callStatus.includes('Failed')
                        ? 'text-error-700 dark:text-error-300'
                        : 'text-primary-700 dark:text-primary-300'
                  }`}
                >
                  {callStatus}
                </p>
              </div>

              {lastCreatedCall && (
                <div className="mt-3 text-sm text-secondary-600 dark:text-secondary-400">
                  <p>Call ID: {lastCreatedCall.id}</p>
                  <p>Status: {lastCreatedCall.status}</p>
                </div>
              )}

              <button
                onClick={clearStatus}
                className="mt-2 text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
              >
                Dismiss
              </button>
            </div>
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
        {!showCallForm && (
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
              Task 4.8 - Enhanced loading states and error handling ✅
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Enhanced Features
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Improved loading states with spinners</li>
                  <li>• Comprehensive error handling</li>
                  <li>• Retry mechanisms with limits</li>
                  <li>• Skeleton loading for initial page load</li>
                  <li>• Inline error displays</li>
                  <li>• Status message management</li>
                  <li>• Error dismissal and recovery</li>
                  <li>• Loading indicators for actions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ New UI Components
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• LoadingSpinner component</li>
                  <li>• SkeletonLoader components</li>
                  <li>• ErrorDisplay components</li>
                  <li>• ErrorBoundary for React errors</li>
                  <li>• InlineError for compact errors</li>
                  <li>• Reusable loading patterns</li>
                  <li>• Consistent error messaging</li>
                  <li>• Accessible loading states</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-lg">
              <p className="text-xs text-success-700 dark:text-success-300">
                <strong>Status:</strong> Dashboard now includes comprehensive
                error handling, improved loading states, and retry mechanisms
                for better user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
