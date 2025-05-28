import { OpenAIClient } from '../openai'

// Mock fetch globally
global.fetch = jest.fn()

describe('OpenAIClient', () => {
  let openaiClient: OpenAIClient
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    openaiClient = new OpenAIClient('test-api-key')
  })

  describe('Constructor', () => {
    it('should initialize with provided API key', () => {
      const client = new OpenAIClient('my-test-key')
      expect(client).toBeInstanceOf(OpenAIClient)
    })

    it('should throw error if no API key provided', () => {
      expect(() => new OpenAIClient('')).toThrow(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable.'
      )
    })
  })

  describe('generateCallSummary', () => {
    it('should generate summary successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Customer called to schedule an appointment',
                keyPoints: ['Appointment scheduled', 'Customer satisfied'],
                outcome: 'successful',
                confidence: 0.95,
              }),
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: I need to schedule an appointment.'
      const result = await openaiClient.generateCallSummary(transcript)

      expect(result.summary).toBe('Customer called to schedule an appointment')
      expect(result.keyPoints).toEqual(['Appointment scheduled', 'Customer satisfied'])
      expect(result.outcome).toBe('successful')
      expect(result.confidence).toBe(0.95)
    })

    it('should handle invalid JSON response with fallback', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON response from OpenAI',
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: I need help.'
      const result = await openaiClient.generateCallSummary(transcript)

      expect(result.summary).toBe('Invalid JSON response from OpenAI')
      expect(result.outcome).toBe('unknown')
      expect(result.confidence).toBe(0.5)
    })

    it('should handle empty transcript', async () => {
      await expect(openaiClient.generateCallSummary('')).rejects.toThrow(
        'Transcript content is required for summary generation'
      )
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' }),
      } as Response)

      await expect(
        openaiClient.generateCallSummary('test transcript')
      ).rejects.toThrow('Failed to generate call summary')
    })
  })

  describe('analyzeCall', () => {
    it('should analyze call successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                analysis: 'Call went well with positive customer interaction',
                sentiment: 'positive',
                sentimentConfidence: 0.9,
                actionItems: ['Follow up next week', 'Send confirmation'],
                followUpNeeded: true,
                callQuality: 'excellent',
                reasoning: 'Customer was satisfied and all issues resolved',
              }),
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: Thank you for your help!'
      const result = await openaiClient.analyzeCall(transcript)

      expect(result.analysis).toBe('Call went well with positive customer interaction')
      expect(result.sentiment).toBe('positive')
      expect(result.sentimentConfidence).toBe(0.9)
      expect(result.actionItems).toEqual(['Follow up next week', 'Send confirmation'])
      expect(result.followUpNeeded).toBe(true)
      expect(result.callQuality).toBe('excellent')
    })

    it('should handle non-JSON response with fallback', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This call was very positive and went well',
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: Thank you!'
      const result = await openaiClient.analyzeCall(transcript)

      expect(result.analysis).toBe('This call was very positive and went well')
      expect(result.sentiment).toBe('neutral')
      expect(result.callQuality).toBe('fair')
    })
  })

  describe('generateComprehensiveAnalysis', () => {
    it('should generate both summary and analysis', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: {
                  summary: 'Customer service call',
                  keyPoints: ['Issue resolved'],
                  outcome: 'successful',
                  confidence: 0.9,
                },
                analysis: {
                  analysis: 'Excellent customer service',
                  sentiment: 'positive',
                  sentimentConfidence: 0.95,
                  actionItems: ['Send follow-up email'],
                  followUpNeeded: false,
                  callQuality: 'excellent',
                  reasoning: 'Customer was very satisfied',
                },
              }),
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: Thanks for resolving my issue!'
      const result = await openaiClient.generateComprehensiveAnalysis(transcript)

      expect(result.summary.summary).toBe('Customer service call')
      expect(result.analysis.sentiment).toBe('positive')
      expect(result.analysis.callQuality).toBe('excellent')
    })
  })

  describe('extractKeyPoints', () => {
    it('should extract key points from transcript', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: `• Customer needs appointment
• Scheduled for next Tuesday
• Customer provided contact info
• Confirmation sent
• Follow-up required`,
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: I need an appointment.'
      const result = await openaiClient.extractKeyPoints(transcript)

      expect(result).toEqual([
        'Customer needs appointment',
        'Scheduled for next Tuesday',
        'Customer provided contact info',
        'Confirmation sent',
        'Follow-up required',
      ])
    })

    it('should handle numbered list format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: `1. Customer called for support
2. Issue was identified
3. Solution provided
4. Customer satisfied`,
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const transcript = 'Agent: Hello! Customer: I need help.'
      const result = await openaiClient.extractKeyPoints(transcript)

      expect(result).toEqual([
        'Customer called for support',
        'Issue was identified',
        'Solution provided',
        'Customer satisfied',
      ])
    })
  })

  describe('Error handling and retries', () => {
    it('should retry on 5xx errors', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response)

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Test summary',
                  keyPoints: [],
                  outcome: 'successful',
                  confidence: 0.8,
                }),
              },
            },
          ],
        }),
      } as Response)

      const result = await openaiClient.generateCallSummary('test transcript')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.summary).toBe('Test summary')
    })

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' }),
      } as Response)

      await expect(
        openaiClient.generateCallSummary('test transcript')
      ).rejects.toThrow('Failed to generate call summary')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100)
          })
      )

      await expect(
        openaiClient.generateCallSummary('test transcript', {
          timeout: 50,
          retries: 0,
        })
      ).rejects.toThrow('Failed to generate call summary')
    })
  })

  describe('Validation helpers', () => {
    it('should validate outcome values', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test',
                keyPoints: [],
                outcome: 'invalid_outcome',
                confidence: 1.5,
              }),
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await openaiClient.generateCallSummary('test transcript')

      expect(result.outcome).toBe('unknown') // Should default invalid values
      expect(result.confidence).toBe(1.0) // Should clamp to max 1.0
    })

    it('should validate sentiment values', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                analysis: 'Test',
                sentiment: 'invalid_sentiment',
                sentimentConfidence: -0.5,
                actionItems: [],
                followUpNeeded: false,
                callQuality: 'invalid_quality',
                reasoning: 'Test',
              }),
            },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await openaiClient.analyzeCall('test transcript')

      expect(result.sentiment).toBe('neutral') // Should default invalid values
      expect(result.sentimentConfidence).toBe(0.0) // Should clamp to min 0.0
      expect(result.callQuality).toBe('fair') // Should default invalid values
    })
  })
}) 