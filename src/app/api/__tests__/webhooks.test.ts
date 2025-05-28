import { updateCallStatus } from '@/lib/calls'
import { createTranscript } from '@/lib/database'
import { NextRequest } from 'next/server'
import { GET, POST } from '../webhooks/route'

// Mock dependencies
jest.mock('@/lib/calls')
jest.mock('@/lib/database')

describe('Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle call.started event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'call.started',
          call: {
            id: 'call-123',
            status: 'in-progress',
            phoneNumber: '+1234567890',
            startedAt: '2024-01-01T00:00:00Z',
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(updateCallStatus).toHaveBeenCalledWith('call-123', 'in-progress', {
      startedAt: '2024-01-01T00:00:00Z',
    })
  })

  it('should handle call.ended event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'call.ended',
          call: {
            id: 'call-123',
            status: 'completed',
            phoneNumber: '+1234567890',
            endedAt: '2024-01-01T00:01:00Z',
            cost: 0.5,
          },
          timestamp: '2024-01-01T00:01:00Z',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(updateCallStatus).toHaveBeenCalledWith('call-123', 'completed', {
      endedAt: '2024-01-01T00:01:00Z',
      cost: 0.5,
    })
  })

  it('should handle call.failed event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'call.failed',
          call: {
            id: 'call-123',
            status: 'failed',
            phoneNumber: '+1234567890',
            endedAt: '2024-01-01T00:00:30Z',
          },
          timestamp: '2024-01-01T00:00:30Z',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(updateCallStatus).toHaveBeenCalledWith('call-123', 'failed', {
      endedAt: '2024-01-01T00:00:30Z',
    })
  })

  it('should handle transcript.ready event', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'transcript.ready',
          call: {
            id: 'call-123',
            status: 'completed',
            phoneNumber: '+1234567890',
            transcript: 'Hello, this is a test call.',
          },
          timestamp: '2024-01-01T00:01:00Z',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(createTranscript).toHaveBeenCalledWith({
      callId: 'call-123',
      content: 'Hello, this is a test call.',
    })
  })

  it('should handle invalid webhook payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          // Missing required fields
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid webhook payload')
    expect(response.status).toBe(400)
  })

  it('should handle webhook processing error', async () => {
    ;(updateCallStatus as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          type: 'call.started',
          call: {
            id: 'call-123',
            status: 'in-progress',
            phoneNumber: '+1234567890',
            startedAt: '2024-01-01T00:00:00Z',
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to process webhook')
    expect(response.status).toBe(500)
  })

  it('should handle health check request', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.message).toBe('Webhook endpoint is active')
  })
}) 