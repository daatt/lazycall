// Unit tests for VapiClient implementation
// Tests the authentication, error handling, and retry logic

// Mock the environment before importing the VapiClient
jest.mock('../env', () => ({
  env: {
    VAPI_API_KEY: 'test-api-key',
    DATABASE_URL: 'file:./test.db',
    OPENAI_API_KEY: 'test-openai-key',
    VAPI_BASE_URL: 'https://api.vapi.ai',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}))

import { VapiClient } from '../vapi'

// Mock fetch globally
global.fetch = jest.fn()

describe('VapiClient', () => {
  let vapiClient: VapiClient
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    vapiClient = new VapiClient('test-api-key')
  })

  describe('Constructor', () => {
    it('should initialize with provided API key', () => {
      const client = new VapiClient('my-test-key')
      expect(client).toBeInstanceOf(VapiClient)
    })
  })

  describe('makeRequest', () => {
    it('should make successful API request', async () => {
      const mockResponse = {
        id: 'test-assistant-id',
        name: 'Test Assistant',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
        statusText: 'OK',
      } as Response)

      const result = await vapiClient.listAssistants()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vapi.ai/assistant',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors correctly', async () => {
      const errorResponse = {
        message: 'Invalid request',
        code: 'INVALID_REQUEST',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify(errorResponse),
        headers: new Headers(),
      } as Response)

      await expect(vapiClient.listAssistants({ retries: 0 })).rejects.toThrow(
        'Failed to list assistants: Vapi API error: 400 Bad Request'
      )
    })

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), 100)
          })
      )

      await expect(
        vapiClient.listAssistants({ timeout: 50, retries: 0 })
      ).rejects.toThrow('Failed to list assistants')
    })

    it('should retry on 5xx errors', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        statusText: 'Internal Server Error',
      } as Response)

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([]),
        headers: new Headers(),
      } as Response)

      const result = await vapiClient.listAssistants({ retries: 1 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual([])
    })

    it('should not retry on 4xx errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        statusText: 'Unauthorized',
      } as Response)

      await expect(vapiClient.listAssistants()).rejects.toThrow(
        'Vapi API error: 401 Unauthorized'
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('createAssistant', () => {
    it('should create assistant with minimal config', async () => {
      const config = {
        name: 'Test Assistant',
        model: {
          provider: 'openai',
          model: 'gpt-4',
        },
      }

      const mockResponse = {
        id: 'assistant-123',
        orgId: 'org-123',
        name: 'Test Assistant',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers(),
      } as Response)

      const result = await vapiClient.createAssistant(config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vapi.ai/assistant',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Assistant'),
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('createCall', () => {
    it('should create call with assistant ID', async () => {
      const config = {
        customer: { number: '+1234567890' },
        assistantId: 'assistant-123',
        name: 'Test Call',
      }

      const mockResponse = {
        id: 'call-123',
        orgId: 'org-123',
        type: 'outboundPhoneCall',
        status: 'scheduled',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers(),
      } as Response)

      const result = await vapiClient.createCall(config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.vapi.ai/call',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('+1234567890'),
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Utility methods', () => {
    it('should update base URL correctly', () => {
      vapiClient.setBaseUrl('https://custom-api.example.com/')
      expect(vapiClient['baseUrl']).toBe('https://custom-api.example.com')
    })

    it('should update timeout correctly', () => {
      vapiClient.setTimeout(60000)
      expect(vapiClient['defaultTimeout']).toBe(60000)
    })

    it('should update retry config correctly', () => {
      vapiClient.setRetryConfig({ maxRetries: 5, baseDelayMs: 2000 })
      expect(vapiClient['retryConfig'].maxRetries).toBe(5)
      expect(vapiClient['retryConfig'].baseDelayMs).toBe(2000)
    })
  })

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([]),
        headers: new Headers(),
      } as Response)

      const result = await vapiClient.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false for failed health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        statusText: 'Internal Server Error',
      } as Response)

      const result = await vapiClient.healthCheck()
      expect(result).toBe(false)
    })
  })
})
