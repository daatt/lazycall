'use client'

import { Call, CallStatus as CallStatusType } from '@/types'

interface CallStatusProps {
  call: Call
  className?: string
}

const statusConfig: Record<
  CallStatusType,
  { label: string; color: string; bgColor: string }
> = {
  idle: { label: 'Idle', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  creating: {
    label: 'Creating...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  dialing: {
    label: 'Dialing...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  ringing: {
    label: 'Ringing...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
}

export function CallStatus({ call, className = '' }: CallStatusProps) {
  const config = statusConfig[call.status]

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Call Status</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bgColor}`}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Phone Number:</span>
          <span className="font-medium">{call.phoneNumber}</span>
        </div>

        {call.startedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Started:</span>
            <span className="font-medium">
              {new Date(call.startedAt).toLocaleTimeString()}
            </span>
          </div>
        )}

        {call.duration && (
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">
              {Math.round(call.duration / 60)}m {call.duration % 60}s
            </span>
          </div>
        )}

        {call.cost && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cost:</span>
            <span className="font-medium">${call.cost.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* TODO: Add real-time progress indicator */}
      {/* This will be implemented in task 5.1 */}
      {(call.status === 'dialing' ||
        call.status === 'ringing' ||
        call.status === 'in-progress') && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Real-time progress tracking coming in task 5.1
          </p>
        </div>
      )}
    </div>
  )
}
