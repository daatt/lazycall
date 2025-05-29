'use client'

import { CallForm } from '@/components/CallForm'
import DashboardLayout from '@/components/ui/DashboardLayout'
import { ApiResponse, Call, CallFormData } from '@/types'
import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [isCreatingCall, setIsCreatingCall] = useState(false)
  const [showCallForm, setShowCallForm] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [lastCreatedCall, setLastCreatedCall] = useState<Call | null>(null)

  const handleCreateCall = async (formData: CallFormData) => {
    setIsCreatingCall(true)
    setCallStatus('Creating call...')

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

      const data: ApiResponse<Call> = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      setLastCreatedCall(data.data)
      setCallStatus(`Call initiated successfully! Call ID: ${data.data.id}`)
      setShowCallForm(false)

      // Reset after showing success
      setTimeout(() => {
        setCallStatus(null)
      }, 10000) // Show for 10 seconds for real calls
    } catch (error) {
      console.error('Failed to create call:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setCallStatus(`Failed to create call: ${errorMessage}`)

      setTimeout(() => {
        setCallStatus(null)
      }, 8000) // Show errors longer
    } finally {
      setIsCreatingCall(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          AI Agent{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Calling Tool
          </span>
        </h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto text-balance">
          Automate your phone calls with intelligent AI agents. Make
          appointments, reservations, and handle routine calls while you focus
          on what matters most.
        </p>
      </div>

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
            {lastCreatedCall && callStatus.includes('successfully') && (
              <div className="mt-3 text-sm text-success-600 dark:text-success-400">
                <p>Phone: {lastCreatedCall.phoneNumber}</p>
                <p>Status: {lastCreatedCall.status}</p>
                {lastCreatedCall.vapiCallId && (
                  <p className="text-xs opacity-75">
                    Vapi ID: {lastCreatedCall.vapiCallId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Form */}
      {showCallForm && (
        <div className="max-w-2xl mx-auto mb-8 animate-slide-up">
          <CallForm onSubmit={handleCreateCall} isLoading={isCreatingCall} />
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setShowCallForm(!showCallForm)}
          className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer text-left"
          disabled={isCreatingCall}
        >
          <div className="card-body">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              {showCallForm ? 'Hide Form' : 'Make Calls'}
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
              {showCallForm
                ? 'Close the call form and return to dashboard'
                : 'Configure and initiate AI-powered phone calls for your personal tasks.'}
            </p>
          </div>
        </button>

        <Link
          href="/settings"
          className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="card-body">
            <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
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
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Settings
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
              Configure your AI agent&apos;s personality and behavior patterns.
            </p>
          </div>
        </Link>

        <Link
          href="/history"
          className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="card-body">
            <div className="w-10 h-10 bg-success-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
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
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              History
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
              View transcripts and summaries of your previous calls.
            </p>
          </div>
        </Link>

        <div
          className="card hover:shadow-medium transition-all duration-300 animate-slide-up group cursor-pointer"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="card-body">
            <div className="w-10 h-10 bg-warning-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Status
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
              Monitor active calls and view real-time progress updates.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!showCallForm && (
        <div className="card max-w-2xl mx-auto">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Quick Start
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Get started with your first AI call
            </p>
          </div>
          <div className="card-body space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCallForm(true)}
                className="btn-primary flex-1"
                disabled={isCreatingCall}
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
                New Call
              </button>
              <Link href="/settings" className="btn-secondary flex-1">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configure Agent
              </Link>
            </div>
            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">
                  Recent Activity
                </span>
                <span className="badge-primary">0 calls today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Progress */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Development Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Task 4.7 - Dashboard with real call creation ✅
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Completed
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Responsive navigation component</li>
                  <li>• Dashboard layout structure</li>
                  <li>• Mobile-friendly design</li>
                  <li>• CallForm with validation</li>
                  <li>• Phone number formatting</li>
                  <li>• Form integration & UX</li>
                  <li>• Real call creation via API</li>
                  <li>• Comprehensive error handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Real API Integration
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• POST /api/calls (creates real calls)</li>
                  <li>• Vapi API integration</li>
                  <li>• Database call storage</li>
                  <li>• Status feedback & validation</li>
                  <li>• Call ID tracking</li>
                  <li>• Error message details</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg">
              <p className="text-xs text-warning-700 dark:text-warning-300">
                <strong>⚠️ Warning:</strong> Call creation now makes REAL phone
                calls via Vapi! Be careful with phone numbers you enter. Test
                with your own number first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
