import * as database from '@/lib/database'
import * as transcripts from '@/lib/transcripts'
import { NextRequest } from 'next/server'
import { GET, POST } from '../transcripts/route'

// Mock dependencies
jest.mock('@/lib/transcripts')
jest.mock('@/lib/database')

describe('Transcripts API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/transcripts', () => {
    it('should get transcripts with filters', async () => {
      const mockTranscripts = [
        {
          id: 'transcript-123',
          callId: 'call-123',
          content: 'Test transcript',
          processingStatus: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(database.getTranscripts as jest.Mock).mockResolvedValue({
        transcripts: mockTranscripts,
        total: 1,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/transcripts?callId=call-123&page=1&limit=10'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.transcripts).toHaveLength(1)
      expect(data.data.total).toBe(1)
      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(10)
    })

    it('should handle errors', async () => {
      ;(database.getTranscripts as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost:3000/api/transcripts')

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to get transcripts')
      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/transcripts', () => {
    it('should retrieve transcript for call', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        callId: 'call-123',
        content: 'Test transcript',
        processingStatus: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(transcripts.retrieveCallTranscript as jest.Mock).mockResolvedValue(
        mockTranscript
      )

      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'retrieve',
          callId: 'call-123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.id).toBe('transcript-123')
      expect(data.message).toBe('Transcript retrieved successfully')
    })

    it('should process pending transcripts', async () => {
      const mockResult = {
        processed: 5,
        failed: 1,
        errors: ['Transcript transcript-456: Processing failed'],
      }

      ;(transcripts.processPendingTranscripts as jest.Mock).mockResolvedValue(
        mockResult
      )

      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'process-pending',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.processed).toBe(5)
      expect(data.data.failed).toBe(1)
      expect(data.message).toBe('Processed 5 transcripts, 1 failed')
    })

    it('should validate transcript', async () => {
      const mockTranscript = {
        id: 'transcript-123',
        callId: 'call-123',
        content: 'Agent: Hello\nUser: Hi there',
        processingStatus: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(database.getTranscript as jest.Mock).mockResolvedValue(mockTranscript)
      ;(transcripts.validateTranscriptContent as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      })
      ;(transcripts.extractTranscriptMetrics as jest.Mock).mockReturnValue({
        wordCount: 4,
        sentenceCount: 2,
        speakerCount: 2,
        averageWordsPerTurn: 2,
        duration: null,
      })

      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validate',
          transcriptId: 'transcript-123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.validation.isValid).toBe(true)
      expect(data.data.metrics.wordCount).toBe(4)
    })

    it('should handle missing call ID for retrieve', async () => {
      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'retrieve',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Call ID is required for retrieve action')
      expect(response.status).toBe(400)
    })

    it('should handle missing transcript for validation', async () => {
      ;(database.getTranscript as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validate',
          transcriptId: 'transcript-123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Transcript not found')
      expect(response.status).toBe(404)
    })

    it('should handle invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/transcripts', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid-action',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid action')
      expect(response.status).toBe(400)
    })
  })
})
