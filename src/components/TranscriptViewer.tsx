'use client'

import { Transcript } from '@/types'

interface TranscriptViewerProps {
  transcript: Transcript
  className?: string
}

export function TranscriptViewer({
  transcript,
  className = '',
}: TranscriptViewerProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Call Transcript
        </h3>
        <p className="text-sm text-gray-500">
          Generated on {new Date(transcript.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Transcript Content */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Conversation</h4>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
            {transcript.content || 'No transcript available'}
          </pre>
        </div>
      </div>

      {/* AI Summary */}
      {transcript.summary && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">AI Summary</h4>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{transcript.summary}</p>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {transcript.analysis && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Analysis</h4>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{transcript.analysis}</p>
          </div>
        </div>
      )}

      {/* TODO: Add export functionality */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Export and sharing features coming in future updates
          </p>
          <div className="space-x-2">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled
            >
              Export PDF
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
