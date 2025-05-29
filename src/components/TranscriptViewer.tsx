'use client'

import { Button } from '@/components/ui/Button'
import { Call, Transcript } from '@/types'
import { useState } from 'react'

interface TranscriptViewerProps {
  call: Call
  transcript?: Transcript
  onClose?: () => void
  className?: string
}

export function TranscriptViewer({
  call,
  transcript,
  onClose,
  className = '',
}: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<
    'transcript' | 'summary' | 'analysis'
  >('summary')
  const [isExporting, setIsExporting] = useState(false)

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
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
    }

    const config = statusConfig[status] || statusConfig.completed

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    )
  }

  const handleExport = async (format: 'txt' | 'json' | 'pdf') => {
    setIsExporting(true)
    try {
      // TODO: Implement actual export functionality
      console.log(`Exporting transcript as ${format}`)

      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (format === 'txt') {
        const content = [
          `Call Transcript - ${formatPhoneNumber(call.phoneNumber)}`,
          `Date: ${call.createdAt.toLocaleString()}`,
          `Duration: ${formatDuration(call.duration)}`,
          `Status: ${call.status}`,
          '',
          'Summary:',
          transcript?.summary || 'No summary available',
          '',
          'Full Transcript:',
          transcript?.content || 'No transcript available',
          '',
          'Analysis:',
          transcript?.analysis || 'No analysis available',
        ].join('\n')

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${call.id}-${Date.now()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Call Transcript - ${formatPhoneNumber(call.phoneNumber)}`,
          text: transcript?.summary || 'Call transcript',
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      const content = `Call Summary: ${transcript?.summary || 'No summary available'}`
      await navigator.clipboard.writeText(content)
      // TODO: Show toast notification
    }
  }

  const displayTranscript = transcript || call.transcripts?.[0]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Call Transcript
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            {formatPhoneNumber(call.phoneNumber)} •{' '}
            {call.createdAt.toLocaleDateString()}
          </p>
        </div>
        {onClose && (
          <Button variant="secondary" onClick={onClose} className="shrink-0">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </Button>
        )}
      </div>

      {/* Call Details Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Call Details
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Phone Number
              </dt>
              <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100 font-medium">
                {formatPhoneNumber(call.phoneNumber)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Status
              </dt>
              <dd className="mt-1">{getStatusBadge(call.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Duration
              </dt>
              <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100 font-medium">
                {formatDuration(call.duration)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Cost
              </dt>
              <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100 font-medium">
                {formatCurrency(call.cost)}
              </dd>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {call.assistant && (
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    AI Assistant
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">
                    {call.assistant.name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  Started At
                </dt>
                <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">
                  {call.startedAt
                    ? call.startedAt.toLocaleString()
                    : 'Not started'}
                </dd>
              </div>
              {call.endedAt && (
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Ended At
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">
                    {call.endedAt.toLocaleString()}
                  </dd>
                </div>
              )}
              {displayTranscript && (
                <div>
                  <dt className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Confidence Score
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">
                    {displayTranscript.confidence
                      ? `${Math.round(displayTranscript.confidence * 100)}%`
                      : 'N/A'}
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="card">
        <div className="card-header border-b-0">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'transcript'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                }`}
              >
                Full Transcript
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                }`}
              >
                Analysis
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="text-sm"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </Button>

              <div className="relative group">
                <Button
                  variant="secondary"
                  disabled={isExporting}
                  className="text-sm"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>

                {/* Export Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2">
                    <button
                      onClick={() => handleExport('txt')}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded"
                    >
                      Export as Text
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded"
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {displayTranscript?.summary ? (
                <div>
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                      Call Summary
                    </h4>
                    <p className="text-primary-800 dark:text-primary-200 leading-relaxed">
                      {displayTranscript.summary}
                    </p>
                  </div>

                  {displayTranscript.wordCount && (
                    <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
                      <span>
                        Word count:{' '}
                        {displayTranscript.wordCount.toLocaleString()}
                      </span>
                      <span>
                        Processing status: {displayTranscript.processingStatus}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
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
                    No Summary Available
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    The call summary is not yet available or processing is still
                    in progress.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              {displayTranscript?.content ? (
                <div>
                  <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-600 p-4">
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-3">
                      Full Conversation
                    </h4>
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-secondary-700 dark:text-secondary-300 font-mono">
                        {displayTranscript.content}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
                    <span>
                      Language: {displayTranscript.language || 'English'}
                    </span>
                    <span>
                      Confidence:{' '}
                      {displayTranscript.confidence
                        ? `${Math.round(displayTranscript.confidence * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
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
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                    No Transcript Available
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    The call transcript is not yet available. This may be
                    because the call is still in progress or processing failed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {displayTranscript?.analysis ? (
                <div>
                  <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-accent-900 dark:text-accent-100 mb-2">
                      AI Analysis
                    </h4>
                    <div className="text-accent-800 dark:text-accent-200 leading-relaxed">
                      <pre className="whitespace-pre-wrap font-sans">
                        {displayTranscript.analysis}
                      </pre>
                    </div>
                  </div>

                  <div className="text-sm text-secondary-600 dark:text-secondary-400">
                    Analysis generated on{' '}
                    {displayTranscript.updatedAt.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                    No Analysis Available
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400">
                    AI analysis is not yet available for this call. Analysis is
                    typically generated after the call completes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
