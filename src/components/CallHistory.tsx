'use client'

import { TranscriptViewer } from '@/components/TranscriptViewer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Call,
  CallHistoryFilters,
  CallStatus,
  PaginatedResponse,
} from '@/types'
import { useEffect, useMemo, useState } from 'react'

interface CallHistoryProps {
  calls: PaginatedResponse<Call>
  onFiltersChange: (filters: CallHistoryFilters) => void
  isLoading?: boolean
  assistants?: Array<{ id: string; name: string }>
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function CallHistory({
  calls,
  onFiltersChange,
  isLoading = false,
  assistants = [],
}: CallHistoryProps) {
  const [filters, setFilters] = useState<CallHistoryFilters>({
    page: 1,
    limit: 25,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false)

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleFilterChange = (newFilters: Partial<CallHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleViewTranscript = (call: Call) => {
    setSelectedCall(call)
    setIsTranscriptModalOpen(true)
  }

  const handleCloseTranscript = () => {
    setIsTranscriptModalOpen(false)
    setSelectedCall(null)
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4')
    }
    return phone
  }

  const getStatusBadge = (status: CallStatus) => {
    const statusConfig = {
      completed: {
        bg: 'bg-success-100 dark:bg-success-900/30',
        text: 'text-success-700 dark:text-success-400',
        label: 'Completed',
      },
      failed: {
        bg: 'bg-error-100 dark:bg-error-900/30',
        text: 'text-error-700 dark:text-error-400',
        label: 'Failed',
      },
      cancelled: {
        bg: 'bg-warning-100 dark:bg-warning-900/30',
        text: 'text-warning-700 dark:text-warning-400',
        label: 'Cancelled',
      },
      'in-progress': {
        bg: 'bg-primary-100 dark:bg-primary-900/30',
        text: 'text-primary-700 dark:text-primary-400',
        label: 'In Progress',
      },
      dialing: {
        bg: 'bg-accent-100 dark:bg-accent-900/30',
        text: 'text-accent-700 dark:text-accent-400',
        label: 'Dialing',
      },
      ringing: {
        bg: 'bg-accent-100 dark:bg-accent-900/30',
        text: 'text-accent-700 dark:text-accent-400',
        label: 'Ringing',
      },
      creating: {
        bg: 'bg-secondary-100 dark:bg-secondary-700',
        text: 'text-secondary-700 dark:text-secondary-300',
        label: 'Creating',
      },
      idle: {
        bg: 'bg-secondary-100 dark:bg-secondary-700',
        text: 'text-secondary-700 dark:text-secondary-300',
        label: 'Idle',
      },
    }

    const config = statusConfig[status] || statusConfig.idle

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    )
  }

  const resetFilters = () => {
    setFilters({ page: 1, limit: 25 })
    setSearchQuery('')
  }

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.status ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.assistantId ||
      searchQuery
    )
  }, [filters, searchQuery])

  const paginationStart = (calls.page - 1) * calls.limit + 1
  const paginationEnd = Math.min(calls.page * calls.limit, calls.total)

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Search & Filter
            </h3>
          </div>
          <div className="card-body space-y-4">
            {/* Search Bar */}
            <div>
              <label htmlFor="search" className="label">
                Search calls
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by phone number, content, or summary..."
                  className="input pl-10"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-secondary-400"
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
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="label">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status || ''}
                  onChange={e =>
                    handleFilterChange({
                      status: (e.target.value as CallStatus) || undefined,
                    })
                  }
                  className="input"
                  disabled={isLoading}
                >
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="dialing">Dialing</option>
                  <option value="ringing">Ringing</option>
                  <option value="creating">Creating</option>
                  <option value="idle">Idle</option>
                </select>
              </div>

              {/* Assistant Filter */}
              <div>
                <label htmlFor="assistant" className="label">
                  Assistant
                </label>
                <select
                  id="assistant"
                  value={filters.assistantId || ''}
                  onChange={e =>
                    handleFilterChange({
                      assistantId: e.target.value || undefined,
                    })
                  }
                  className="input"
                  disabled={isLoading}
                >
                  <option value="">All assistants</option>
                  {assistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label htmlFor="dateFrom" className="label">
                  From Date
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  value={
                    filters.dateFrom
                      ? filters.dateFrom.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    handleFilterChange({
                      dateFrom: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                  className="input"
                  disabled={isLoading}
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="dateTo" className="label">
                  To Date
                </label>
                <input
                  type="date"
                  id="dateTo"
                  value={
                    filters.dateTo
                      ? filters.dateTo.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    handleFilterChange({
                      dateTo: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                  className="input"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                {hasActiveFilters && `${calls.total} calls found`}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={resetFilters}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Call History
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  {calls.total > 0
                    ? `${paginationStart}-${paginationEnd} of ${calls.total}`
                    : 'No calls'}
                </div>
                <select
                  value={filters.limit}
                  onChange={e =>
                    handleFilterChange({ limit: parseInt(e.target.value) })
                  }
                  className="input py-1 text-sm"
                  disabled={isLoading}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Loading calls...
                </p>
              </div>
            ) : calls.data.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-secondary-400"
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
                  {hasActiveFilters
                    ? 'No matching calls found'
                    : 'No calls yet'}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {hasActiveFilters
                    ? "Try adjusting your search filters to find what you're looking for."
                    : 'Start making calls from the dashboard to see them here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Call Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
                    {calls.data.map(call => (
                      <tr
                        key={call.id}
                        className="hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                              {formatPhoneNumber(call.phoneNumber)}
                            </div>
                            {call.assistant && (
                              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                Assistant: {call.assistant.name}
                              </div>
                            )}
                            {call.transcripts &&
                              call.transcripts.length > 0 &&
                              call.transcripts[0].summary && (
                                <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1 max-w-xs truncate">
                                  {call.transcripts[0].summary}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(call.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                          {formatDuration(call.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                          {formatCurrency(call.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                          <div>{call.createdAt.toLocaleDateString()}</div>
                          <div className="text-xs">
                            {call.createdAt.toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              onClick={() => handleViewTranscript(call)}
                            >
                              View
                            </button>
                            {call.transcripts &&
                              call.transcripts.length > 0 && (
                                <button
                                  className="text-accent-600 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-300"
                                  onClick={() => handleViewTranscript(call)}
                                >
                                  Transcript
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {calls.totalPages > 1 && (
            <div className="card-footer">
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  Page {calls.page} of {calls.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(calls.page - 1)}
                    disabled={calls.page <= 1 || isLoading}
                    className="text-sm"
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="flex space-x-1">
                    {Array.from(
                      { length: Math.min(5, calls.totalPages) },
                      (_, i) => {
                        let pageNum
                        if (calls.totalPages <= 5) {
                          pageNum = i + 1
                        } else {
                          const start = Math.max(1, calls.page - 2)
                          const end = Math.min(calls.totalPages, start + 4)
                          pageNum = start + i
                          if (pageNum > end) return null
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              pageNum === calls.page
                                ? 'bg-primary-600 text-white'
                                : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      }
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(calls.page + 1)}
                    disabled={calls.page >= calls.totalPages || isLoading}
                    className="text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={handleCloseTranscript}
        size="xl"
      >
        <div className="p-6">
          {selectedCall && (
            <TranscriptViewer
              call={selectedCall}
              transcript={selectedCall.transcripts?.[0]}
              onClose={handleCloseTranscript}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
