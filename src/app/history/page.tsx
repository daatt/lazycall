'use client'

import { CallHistory } from '@/components/CallHistory'
import DashboardLayout from '@/components/ui/DashboardLayout'
import {
  ApiResponse,
  Assistant,
  Call,
  CallHistoryFilters,
  PaginatedResponse,
} from '@/types'
import { useCallback, useEffect, useState } from 'react'

export default function HistoryPage() {
  const [calls, setCalls] = useState<PaginatedResponse<Call>>({
    data: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentFilters, setCurrentFilters] = useState<CallHistoryFilters>({})
  const [assistants, setAssistants] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [error, setError] = useState<string | null>(null)

  // Set document title
  useEffect(() => {
    document.title = 'Call History - AI Agent Calling'
  }, [])

  const loadAssistants = useCallback(async () => {
    try {
      const response = await fetch('/api/assistants?isActive=true&limit=100')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<PaginatedResponse<Assistant>> =
        await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      // Transform to simple format for the filter dropdown
      const simpleAssistants = data.data.data.map(assistant => ({
        id: assistant.id,
        name: assistant.name,
      }))

      setAssistants(simpleAssistants)
    } catch (error) {
      console.error('Failed to load assistants:', error)
      // Don't show error for assistants, just use empty array
    }
  }, [])

  const loadCalls = useCallback(async (filters: CallHistoryFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.status) params.append('status', filters.status)
      if (filters.assistantId) params.append('assistantId', filters.assistantId)
      if (filters.phoneNumber) params.append('phoneNumber', filters.phoneNumber)
      if (filters.dateFrom)
        params.append('dateFrom', filters.dateFrom.toISOString())
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())

      const response = await fetch(`/api/calls?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<PaginatedResponse<Call>> = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format')
      }

      setCalls(data.data)
      setCurrentFilters(filters)
    } catch (error) {
      console.error('Failed to load calls:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load call history: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load assistants for filter dropdown
  useEffect(() => {
    loadAssistants()
  }, [loadAssistants])

  // Load calls when component mounts
  useEffect(() => {
    loadCalls({})
  }, [loadCalls])

  const handleFiltersChange = useCallback(
    (filters: CallHistoryFilters) => {
      loadCalls(filters)
    },
    [loadCalls]
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Call History
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Search, filter, and review your call history with advanced controls
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card border-error-200 bg-error-50 dark:bg-error-900/20">
            <div className="card-body text-center">
              <p className="font-medium text-error-700 dark:text-error-300">
                {error}
              </p>
              <button
                onClick={() => loadCalls(currentFilters)}
                className="mt-2 text-sm text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Call History Component */}
        <CallHistory
          calls={calls}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
          assistants={assistants}
        />

        {/* Development Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Development Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Task 4.7 - Call history with real API integration ✅
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Implemented
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• Advanced search functionality</li>
                  <li>• Status and date range filtering</li>
                  <li>• Assistant-based filtering</li>
                  <li>• Responsive pagination</li>
                  <li>• Call details display</li>
                  <li>• Phone number formatting</li>
                  <li>• Duration and cost formatting</li>
                  <li>• Status badges and indicators</li>
                  <li>• Real API integration</li>
                  <li>• Error handling & recovery</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  ✅ Real API Calls
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• GET /api/calls (with filtering)</li>
                  <li>• GET /api/assistants (for filters)</li>
                  <li>• Query parameter building</li>
                  <li>• Pagination support</li>
                  <li>• Real call data & transcripts</li>
                  <li>• Status tracking</li>
                  <li>• Error handling & feedback</li>
                  <li>• Loading states</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-lg">
              <p className="text-xs text-success-700 dark:text-success-300">
                <strong>Status:</strong> Call history now displays real data
                from the database with full filtering, pagination, and search
                capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
