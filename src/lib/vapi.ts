// Vapi API client and helper functions
// Comprehensive client implementation with authentication and error handling

import { env } from './env'

// =============================================================================
// VAPI API TYPES AND INTERFACES
// =============================================================================

export interface VapiError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

export interface VapiRequestOptions {
  timeout?: number
  retries?: number
  skipRetry?: boolean
}

// Assistant interfaces
export interface VapiAssistantConfig {
  name: string
  firstMessage?: string
  model: {
    provider: string
    model: string
    messages?: Array<{ role: string; content: string }>
    temperature?: number
    maxTokens?: number
  }
  voice?: {
    provider: string
    voiceId: string
  }
  transcriber?: {
    provider: string
    language?: string
  }
  metadata?: Record<string, unknown>
}

export interface VapiAssistant {
  id: string
  orgId: string
  name?: string
  createdAt: string
  updatedAt: string
  // ... other assistant properties from API response
}

// Call interfaces
export interface VapiCallConfig {
  customer: {
    number: string
  }
  assistantId?: string
  assistant?: VapiAssistantConfig
  name?: string
  metadata?: Record<string, unknown>
}

export interface VapiCall {
  id: string
  orgId: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  endedAt?: string
  cost?: number
  phoneNumber?: string
  assistantId?: string
  // ... other call properties from API response
}

export interface VapiCallListResponse {
  calls: VapiCall[]
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

// =============================================================================
// VAPI CLIENT CLASS
// =============================================================================

export class VapiClient {
  private apiKey: string
  private baseUrl: string = 'https://api.vapi.ai'
  private defaultTimeout: number = 30000
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  }

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.VAPI_API_KEY || ''

    if (!this.apiKey) {
      throw new Error(
        'Vapi API key is required. Set VAPI_API_KEY environment variable.'
      )
    }
  }

  // =============================================================================
  // ASSISTANT METHODS
  // =============================================================================

  async createAssistant(
    config: VapiAssistantConfig,
    options?: VapiRequestOptions
  ): Promise<VapiAssistant> {
    try {
      const requestBody = {
        name: config.name,
        firstMessage: config.firstMessage || 'Hello! How can I help you today?',
        model: {
          provider: config.model.provider || 'openai',
          model: config.model.model || 'gpt-4',
          messages: config.model.messages || [
            {
              role: 'system',
              content: 'You are a helpful AI assistant.',
            },
          ],
          temperature: config.model.temperature ?? 0.7,
          maxTokens: config.model.maxTokens ?? 1000,
        },
        voice: config.voice || {
          provider: 'azure',
          voiceId: 'andrew',
        },
        transcriber: config.transcriber || {
          provider: 'deepgram',
          language: 'en',
        },
        metadata: config.metadata || {},
      }

      const response = await this.makeRequest<VapiAssistant>(
        '/assistant',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        },
        options
      )

      return response
    } catch (error) {
      throw this.handleError(error, 'Failed to create assistant')
    }
  }

  async getAssistant(
    assistantId: string,
    options?: VapiRequestOptions
  ): Promise<VapiAssistant> {
    try {
      return await this.makeRequest<VapiAssistant>(
        `/assistant/${assistantId}`,
        { method: 'GET' },
        options
      )
    } catch (error) {
      throw this.handleError(error, `Failed to get assistant ${assistantId}`)
    }
  }

  async listAssistants(options?: VapiRequestOptions): Promise<VapiAssistant[]> {
    try {
      return await this.makeRequest<VapiAssistant[]>(
        '/assistant',
        { method: 'GET' },
        options
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to list assistants')
    }
  }

  async deleteAssistant(
    assistantId: string,
    options?: VapiRequestOptions
  ): Promise<void> {
    try {
      await this.makeRequest(
        `/assistant/${assistantId}`,
        { method: 'DELETE' },
        options
      )
    } catch (error) {
      throw this.handleError(error, `Failed to delete assistant ${assistantId}`)
    }
  }

  // =============================================================================
  // CALL METHODS
  // =============================================================================

  async createCall(
    config: VapiCallConfig,
    options?: VapiRequestOptions
  ): Promise<VapiCall> {
    try {
      const requestBody = {
        customer: {
          number: config.customer.number,
        },
        name: config.name,
        metadata: config.metadata || {},
        ...(config.assistantId ? { assistantId: config.assistantId } : {}),
        ...(config.assistant ? { assistant: config.assistant } : {}),
      }

      const response = await this.makeRequest<VapiCall>(
        '/call',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        },
        options
      )

      return response
    } catch (error) {
      throw this.handleError(error, 'Failed to create call')
    }
  }

  async getCall(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<VapiCall> {
    try {
      return await this.makeRequest<VapiCall>(
        `/call/${callId}`,
        { method: 'GET' },
        options
      )
    } catch (error) {
      throw this.handleError(error, `Failed to get call ${callId}`)
    }
  }

  async listCalls(
    filters?: {
      assistantId?: string
      limit?: number
      createdAtGt?: string
      createdAtLt?: string
    },
    options?: VapiRequestOptions
  ): Promise<VapiCall[]> {
    try {
      const queryParams = new URLSearchParams()

      if (filters?.assistantId) {
        queryParams.append('assistantId', filters.assistantId)
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString())
      }
      if (filters?.createdAtGt) {
        queryParams.append('createdAtGt', filters.createdAtGt)
      }
      if (filters?.createdAtLt) {
        queryParams.append('createdAtLt', filters.createdAtLt)
      }

      const endpoint = queryParams.toString()
        ? `/call?${queryParams.toString()}`
        : '/call'

      return await this.makeRequest<VapiCall[]>(
        endpoint,
        { method: 'GET' },
        options
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to list calls')
    }
  }

  async cancelCall(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<void> {
    try {
      await this.makeRequest(`/call/${callId}`, { method: 'DELETE' }, options)
    } catch (error) {
      throw this.handleError(error, `Failed to cancel call ${callId}`)
    }
  }

  async getCallTranscript(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<string> {
    try {
      const call = await this.getCall(callId, options)

      // Extract transcript from call artifact or messages
      if (call && typeof call === 'object' && 'artifact' in call) {
        const artifact = call.artifact as { transcript?: string }
        if (artifact?.transcript) {
          return artifact.transcript
        }
      }

      // Fallback: extract from messages if available
      if (call && typeof call === 'object' && 'messages' in call) {
        const messages = call.messages as Array<{
          role: string
          message: string
        }>
        return messages.map(msg => `${msg.role}: ${msg.message}`).join('\n')
      }

      return ''
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to get transcript for call ${callId}`
      )
    }
  }

  // =============================================================================
  // CORE HTTP CLIENT METHODS
  // =============================================================================

  private async makeRequest<T = unknown>(
    endpoint: string,
    requestInit: RequestInit = {},
    options?: VapiRequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const timeout = options?.timeout ?? this.defaultTimeout
    const maxRetries = options?.retries ?? this.retryConfig.maxRetries
    const skipRetry = options?.skipRetry ?? false

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...requestInit.headers,
    }

    const requestOptions: RequestInit = {
      ...requestInit,
      headers,
    }

    let lastError: Error = new Error('Request failed')
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')

          let errorData: unknown
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          const error = new Error(
            `Vapi API error: ${response.status} ${response.statusText}`
          ) as VapiError
          error.status = response.status
          error.details = errorData

          // Don't retry client errors (4xx) except for rate limiting (429)
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            throw error
          }

          throw error
        }

        // Handle empty responses (like DELETE operations)
        if (
          response.status === 204 ||
          response.headers.get('content-length') === '0'
        ) {
          return undefined as T
        }

        const responseText = await response.text()
        if (!responseText) {
          return undefined as T
        }

        try {
          return JSON.parse(responseText) as T
        } catch (parseError) {
          throw new Error(`Failed to parse response: ${parseError}`)
        }
      } catch (error) {
        lastError = error as Error
        attempt++

        // Don't retry if explicitly disabled or on last attempt
        if (skipRetry || attempt > maxRetries) {
          break
        }

        // Don't retry on certain errors
        if (this.shouldNotRetry(error as VapiError)) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelayMs *
            Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelayMs
        )

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay
        await this.sleep(delay + jitter)

        console.warn(
          `Vapi API request failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`,
          error
        )
      }
    }

    throw lastError
  }

  private shouldNotRetry(error: VapiError): boolean {
    // Don't retry on authentication errors, not found, etc.
    if (error.status) {
      return (
        error.status === 401 || error.status === 403 || error.status === 404
      )
    }

    // Don't retry on network errors that won't benefit from retry
    const message = error.message.toLowerCase()
    return message.includes('abort') || message.includes('network error')
  }

  private handleError(error: unknown, context: string): VapiError {
    if (error instanceof Error) {
      const vapiError = error as VapiError
      vapiError.message = `${context}: ${vapiError.message}`
      return vapiError
    }

    return {
      message: `${context}: ${String(error)}`,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '') // Remove trailing slash
  }

  public setTimeout(timeout: number): void {
    this.defaultTimeout = timeout
  }

  public setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Try to list assistants as a health check
      await this.listAssistants({ timeout: 5000, retries: 0 })
      return true
    } catch {
      return false
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export a default instance
export const vapi = new VapiClient()
