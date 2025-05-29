'use client'

import { CallHistory } from '@/components/CallHistory'
import DashboardLayout from '@/components/ui/DashboardLayout'
import { Call, CallHistoryFilters, PaginatedResponse } from '@/types'
import { useEffect, useState } from 'react'

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

  // Set document title
  useEffect(() => {
    document.title = 'Call History - AI Agent Calling'
  }, [])

  // Mock assistants data - this will be replaced with real API call in task 4.6
  const assistants = [
    { id: 'assistant-1', name: 'Professional Assistant' },
    { id: 'assistant-2', name: 'Friendly Assistant' },
    { id: 'assistant-3', name: 'Business Assistant' },
    { id: 'assistant-4', name: 'Sales Assistant' },
  ]

  // Generate mock call data for demonstration
  const generateMockCalls = (): Call[] => {
    const phoneNumbers = [
      '+1 (555) 123-4567',
      '+1 (555) 234-5678',
      '+1 (555) 345-6789',
      '+1 (555) 456-7890',
      '+1 (555) 567-8901',
      '+1 (555) 678-9012',
      '+1 (555) 789-0123',
      '+1 (555) 890-1234',
      '+1 (555) 901-2345',
      '+1 (555) 012-3456',
    ]

    const statuses = [
      'completed',
      'failed',
      'cancelled',
      'in-progress',
      'dialing',
    ]
    const summaries = [
      'Successfully scheduled appointment for next Tuesday at 2 PM',
      'Customer inquired about pricing and requested a callback',
      'Confirmed delivery time and address details',
      'Unable to reach customer, left voicemail',
      'Completed service request and payment processing',
      'Gathered feedback on recent purchase experience',
      'Scheduled follow-up call for next week',
      'Resolved billing inquiry and updated account',
      'Confirmed appointment cancellation and rescheduled',
      'Customer requested technical support callback',
    ]

    const mockCalls: Call[] = []

    for (let i = 0; i < 47; i++) {
      const phoneNumber = phoneNumbers[i % phoneNumbers.length]
      const status = statuses[i % statuses.length] as any
      const assistant = assistants[i % assistants.length]
      const summary = summaries[i % summaries.length]

      const baseDate = new Date()
      baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30))
      baseDate.setHours(Math.floor(Math.random() * 24))
      baseDate.setMinutes(Math.floor(Math.random() * 60))

      const duration =
        status === 'completed'
          ? Math.floor(Math.random() * 600) + 30
          : status === 'failed'
            ? Math.floor(Math.random() * 30)
            : status === 'in-progress'
              ? Math.floor(Math.random() * 300) + 60
              : undefined

      const cost = duration
        ? (duration / 60) * 0.02 + Math.random() * 0.01
        : undefined

      mockCalls.push({
        id: `call-${i + 1}`,
        phoneNumber,
        status,
        assistantId: assistant.id,
        vapiCallId: `vapi-${i + 1}`,
        startedAt: status !== 'idle' ? baseDate : undefined,
        endedAt:
          status === 'completed' ||
          status === 'failed' ||
          status === 'cancelled'
            ? new Date(baseDate.getTime() + (duration || 0) * 1000)
            : undefined,
        duration,
        cost,
        metadata: { originalPrompt: `Call ${i + 1} custom instructions` },
        createdAt: baseDate,
        updatedAt: baseDate,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          systemPrompt: 'Mock system prompt',
          isActive: true,
          language: 'en',
          model: 'gpt-4',
          usageCount: 0,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        transcripts:
          status === 'completed'
            ? [
                {
                  id: `transcript-${i + 1}`,
                  callId: `call-${i + 1}`,
                  content: `Mock transcript content for call ${i + 1}...`,
                  summary,
                  analysis: `Call analysis for call ${i + 1}`,
                  processingStatus: 'completed' as any,
                  wordCount: Math.floor(Math.random() * 500) + 100,
                  confidence: 0.85 + Math.random() * 0.15,
                  language: 'en',
                  metadata: {},
                  createdAt: baseDate,
                  updatedAt: baseDate,
                },
              ]
            : [],
      })
    }

    return mockCalls
  }

  const mockCalls = generateMockCalls()

  // Simulate API call with filtering and pagination
  const loadCalls = async (filters: CallHistoryFilters) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call in task 4.6
      console.log('Loading calls with filters:', filters)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      let filteredCalls = mockCalls

      // Apply filters
      if (filters.status) {
        filteredCalls = filteredCalls.filter(
          call => call.status === filters.status
        )
      }

      if (filters.assistantId) {
        filteredCalls = filteredCalls.filter(
          call => call.assistantId === filters.assistantId
        )
      }

      if (filters.dateFrom) {
        filteredCalls = filteredCalls.filter(
          call => call.createdAt >= filters.dateFrom!
        )
      }

      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        filteredCalls = filteredCalls.filter(call => call.createdAt <= endOfDay)
      }

      if (filters.phoneNumber) {
        filteredCalls = filteredCalls.filter(call =>
          call.phoneNumber
            .toLowerCase()
            .includes(filters.phoneNumber!.toLowerCase())
        )
      }

      // Sort by most recent first
      filteredCalls.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )

      // Apply pagination
      const page = filters.page || 1
      const limit = filters.limit || 25
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedCalls = filteredCalls.slice(startIndex, endIndex)

      const result: PaginatedResponse<Call> = {
        data: paginatedCalls,
        total: filteredCalls.length,
        page,
        limit,
        totalPages: Math.ceil(filteredCalls.length / limit),
      }

      setCalls(result)
    } catch (error) {
      console.error('Failed to load calls:', error)
      setCalls({
        data: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load calls when filters change
  useEffect(() => {
    loadCalls(currentFilters)
  }, [currentFilters])

  const handleFiltersChange = (filters: CallHistoryFilters) => {
    setCurrentFilters(filters)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Call History
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            View and manage your previous AI agent calls with detailed
            transcripts and summaries.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  Recent Calls
                </h2>
                <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                  Search, filter, and review your call history
                </p>
              </div>

              {/* TODO: Implement search and filter controls */}
              <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg px-4 py-2">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Search & filters coming in task 4.4
                </p>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* TODO: Implement CallHistory component */}
            {/* This will be implemented in task 4.4 */}
            <CallHistory
              calls={calls}
              onFiltersChange={handleFiltersChange}
              isLoading={isLoading}
              assistants={assistants}
            />
          </div>
        </div>

        {/* Preview of upcoming features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Advanced Search
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Search calls by content, date, phone number, and outcome.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-accent-600 dark:text-accent-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Smart Filtering
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Filter by call status, duration, success rate, and more.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-success-600 dark:text-success-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                Call Analytics
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                View insights and analytics about your call patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Development Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Task 4.4 - Call history with search, filtering, and pagination ✅
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
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  🔄 Demonstrated
                </h4>
                <ul className="space-y-1 text-secondary-600 dark:text-secondary-400">
                  <li>• {mockCalls.length} mock calls generated</li>
                  <li>• Realistic call data and statuses</li>
                  <li>• Simulated API filtering</li>
                  <li>• Pagination with multiple pages</li>
                  <li>• Assistant associations</li>
                  <li>• Transcript summaries</li>
                  <li>• Date/time formatting</li>
                  <li>• Loading states</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                <strong>Note:</strong> Currently showing mock data for
                demonstration. Real database integration will be implemented in
                Task 4.6 (API routes).
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
