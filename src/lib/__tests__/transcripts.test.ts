import * as database from '../database'
import * as openai from '../openai'
import {
    extractTranscriptMetrics,
    generateAiAnalysisForTranscript,
    generateAnalysisForTranscript,
    generateSummaryForTranscript,
    processPendingTranscripts,
    processTranscript,
    retrieveCallTranscript,
    validateTranscriptContent,
} from '../transcripts'
import { vapi } from '../vapi'

// Mock dependencies
jest.mock('../vapi')
jest.mock('../database')
jest.mock('../openai')

describe('Transcript Processing with AI', () => {
  const mockCall = {
    id: 'call-123',
    phoneNumber: '+1234567890',
    status: 'completed' as const,
    vapiCallId: 'vapi-call-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockTranscript = {
    id: 'transcript-123',
    callId: 'call-123',
    content: 'Agent: Hello, how can I help you today?\nUser: I need help with my account.',
    processingStatus: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockAiSummary = {
    summary: 'Customer called for account assistance',
    keyPoints: ['Account issue', 'Customer service'],
    outcome: 'successful' as const,
    confidence: 0.95,
  }

  const mockAiAnalysis = {
    analysis: 'Call went well, customer was satisfied',
    sentiment: 'positive' as const,
    sentimentConfidence: 0.9,
    actionItems: ['Follow up on account', 'Send confirmation'],
    followUpNeeded: true,
    callQuality: 'excellent' as const,
    reasoning: 'Customer issue was resolved efficiently',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getCall as jest.Mock).mockResolvedValue(mockCall)
    ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue(null)
    ;(database.createTranscript as jest.Mock).mockResolvedValue(mockTranscript)
    ;(database.updateTranscriptProcessing as jest.Mock).mockResolvedValue({
      ...mockTranscript,
      processingStatus: 'completed',
      summary: mockAiSummary.summary,
      analysis: mockAiAnalysis.analysis,
    })
    ;(vapi.getCallTranscript as jest.Mock).mockResolvedValue(
      'Agent: Hello, how can I help you today?\nUser: I need help with my account.'
    )
    ;(openai.openai.generateComprehensiveAnalysis as jest.Mock).mockResolvedValue({
      summary: mockAiSummary,
      analysis: mockAiAnalysis,
    })
  })

  describe('retrieveCallTranscript with AI', () => {
    it('should retrieve and process transcript with AI analysis', async () => {
      const result = await retrieveCallTranscript('call-123', true)

      expect(database.getCall).toHaveBeenCalledWith('call-123')
      expect(vapi.getCallTranscript).toHaveBeenCalledWith('vapi-call-123')
      expect(openai.openai.generateComprehensiveAnalysis).toHaveBeenCalledWith(
        'Agent: Hello, how can I help you today?\nUser: I need help with my account.'
      )
      expect(database.createTranscript).toHaveBeenCalledWith({
        callId: 'call-123',
        content: 'Agent: Hello, how can I help you today?\nUser: I need help with my account.',
      })
      expect(result?.summary).toBe(mockAiSummary.summary)
      expect(result?.analysis).toContain(mockAiAnalysis.analysis)
    })

    it('should skip AI analysis when includeAiAnalysis is false', async () => {
      const result = await retrieveCallTranscript('call-123', false)

      expect(openai.openai.generateComprehensiveAnalysis).not.toHaveBeenCalled()
      expect(result).toBeTruthy()
    })

    it('should handle AI analysis failure gracefully', async () => {
      ;(openai.openai.generateComprehensiveAnalysis as jest.Mock).mockRejectedValue(
        new Error('AI service unavailable')
      )

      const result = await retrieveCallTranscript('call-123', true)

      expect(result).toBeTruthy()
      expect(database.updateTranscriptProcessing).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          summary: expect.stringContaining('Call transcript with'),
          analysis: 'AI analysis unavailable due to processing error',
        })
      )
    })

    it('should return existing completed transcript', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue({
        ...mockTranscript,
        processingStatus: 'completed',
      })

      const result = await retrieveCallTranscript('call-123')

      expect(vapi.getCallTranscript).not.toHaveBeenCalled()
      expect(openai.openai.generateComprehensiveAnalysis).not.toHaveBeenCalled()
      expect(result?.processingStatus).toBe('completed')
    })
  })

  describe('AI analysis functions', () => {
    it('should generate AI analysis for existing transcript', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue(mockTranscript)

      const result = await generateAiAnalysisForTranscript('transcript-123')

      expect(database.getTranscriptByCallId).toHaveBeenCalledWith('transcript-123')
      expect(openai.openai.generateComprehensiveAnalysis).toHaveBeenCalledWith(
        mockTranscript.content
      )
      expect(result.summary).toBe(mockAiSummary.summary)
    })

    it('should generate summary for transcript', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue(mockTranscript)
      ;(openai.openai.generateCallSummary as jest.Mock).mockResolvedValue(mockAiSummary)

      const result = await generateSummaryForTranscript('transcript-123')

      expect(openai.openai.generateCallSummary).toHaveBeenCalledWith(mockTranscript.content)
      expect(result).toEqual(mockAiSummary)
    })

    it('should generate analysis for transcript', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue(mockTranscript)
      ;(openai.openai.analyzeCall as jest.Mock).mockResolvedValue(mockAiAnalysis)

      const result = await generateAnalysisForTranscript('transcript-123')

      expect(openai.openai.analyzeCall).toHaveBeenCalledWith(mockTranscript.content)
      expect(result).toEqual(mockAiAnalysis)
    })

    it('should handle missing transcript for AI analysis', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue(null)

      await expect(generateAiAnalysisForTranscript('transcript-123')).rejects.toThrow(
        'Transcript not found'
      )
    })

    it('should handle empty transcript content', async () => {
      ;(database.getTranscriptByCallId as jest.Mock).mockResolvedValue({
        ...mockTranscript,
        content: '',
      })

      await expect(generateAiAnalysisForTranscript('transcript-123')).rejects.toThrow(
        'Transcript has no content to analyze'
      )
    })
  })

  describe('processPendingTranscripts with AI', () => {
    it('should process all pending transcripts with AI analysis', async () => {
      const pendingTranscripts = [
        mockTranscript,
        { ...mockTranscript, id: 'transcript-456' },
      ]
      ;(database.getPendingTranscripts as jest.Mock).mockResolvedValue(
        pendingTranscripts
      )

      const result = await processPendingTranscripts()

      expect(result.processed).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(openai.openai.generateComprehensiveAnalysis).toHaveBeenCalledTimes(2)
    })

    it('should handle AI processing errors in batch', async () => {
      const pendingTranscripts = [mockTranscript]
      ;(database.getPendingTranscripts as jest.Mock).mockResolvedValue(
        pendingTranscripts
      )
      ;(openai.openai.generateComprehensiveAnalysis as jest.Mock).mockRejectedValue(
        new Error('AI service error')
      )

      const result = await processPendingTranscripts()

      // Should still process (with fallback) even when AI fails
      expect(result.processed).toBe(1)
      expect(result.failed).toBe(0)
    })
  })

  describe('processTranscript with AI', () => {
    it('should process transcript with AI metadata', async () => {
      ;(database.updateTranscriptProcessing as jest.Mock)
        .mockResolvedValueOnce({ ...mockTranscript, processingStatus: 'processing' })
        .mockResolvedValueOnce({
          ...mockTranscript,
          processingStatus: 'completed',
          summary: mockAiSummary.summary,
          analysis: mockAiAnalysis.analysis,
        })

      const result = await processTranscript(mockTranscript)

      expect(database.updateTranscriptProcessing).toHaveBeenCalledWith(
        'transcript-123',
        { processingStatus: 'processing' }
      )
      expect(openai.openai.generateComprehensiveAnalysis).toHaveBeenCalledWith(
        mockTranscript.content
      )
      expect(database.updateTranscriptProcessing).toHaveBeenCalledWith(
        'transcript-123',
        expect.objectContaining({
          summary: mockAiSummary.summary,
          analysis: expect.stringContaining(mockAiAnalysis.analysis),
          processingStatus: 'completed',
          confidence: expect.any(Number),
          language: 'en',
          metadata: expect.objectContaining({
            processedAt: expect.any(String),
            aiGenerated: true,
            summaryConfidence: mockAiSummary.confidence,
            sentiment: mockAiAnalysis.sentiment,
            actionItems: mockAiAnalysis.actionItems,
          }),
        })
      )
      expect(result.processingStatus).toBe('completed')
    })

    it('should handle AI processing errors with fallback', async () => {
      ;(openai.openai.generateComprehensiveAnalysis as jest.Mock).mockRejectedValue(
        new Error('AI processing failed')
      )
      ;(database.updateTranscriptProcessing as jest.Mock)
        .mockResolvedValueOnce({ ...mockTranscript, processingStatus: 'processing' })
        .mockResolvedValueOnce({
          ...mockTranscript,
          processingStatus: 'completed',
          summary: 'Call transcript with 12 words (approx. 1 minute).',
        })

      const result = await processTranscript(mockTranscript)

      expect(database.updateTranscriptProcessing).toHaveBeenCalledWith(
        'transcript-123',
        expect.objectContaining({
          summary: expect.stringContaining('Call transcript with'),
          analysis: 'AI analysis unavailable due to processing error',
          metadata: expect.objectContaining({
            aiGenerated: false,
            error: 'AI processing failed',
            fallbackGenerated: true,
          }),
        })
      )
      expect(result.processingStatus).toBe('completed')
    })
  })

  describe('validateTranscriptContent', () => {
    it('should validate valid transcript content', () => {
      const content = 'Agent: Hello, how can I help you?\nUser: I need assistance.'
      const result = validateTranscriptContent(content)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect empty content', () => {
      const result = validateTranscriptContent('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Transcript content is empty')
    })

    it('should warn about short content', () => {
      const result = validateTranscriptContent('Hi there')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Transcript content is very short')
    })

    it('should warn about incomplete content', () => {
      const result = validateTranscriptContent('Agent: Hello [inaudible] help you?')

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain(
        'Transcript contains markers indicating incomplete or unclear audio'
      )
    })
  })

  describe('extractTranscriptMetrics', () => {
    it('should extract metrics from transcript', () => {
      const content = `Agent: Hello, how can I help you today?
User: I need help with my account. It's been locked.
Agent: I can help you with that. Let me check your account.`

      const result = extractTranscriptMetrics(content)

      expect(result.wordCount).toBe(24)
      expect(result.sentenceCount).toBe(3)
      expect(result.speakerCount).toBe(2)
      expect(result.averageWordsPerTurn).toBeGreaterThan(0)
    })

    it('should handle content with timestamps', () => {
      const content = `00:01:00 Agent: Hello
00:01:30 User: Hi there
00:02:00 Agent: How can I help?`

      const result = extractTranscriptMetrics(content)

      expect(result.duration).toBe(60) // 1 minute difference
      expect(result.wordCount).toBe(7)
    })

    it('should handle empty content', () => {
      const result = extractTranscriptMetrics('')

      expect(result.wordCount).toBe(0)
      expect(result.sentenceCount).toBe(0)
      expect(result.speakerCount).toBe(2) // Default minimum
      expect(result.averageWordsPerTurn).toBe(0)
      expect(result.duration).toBe(null)
    })
  })
}) 