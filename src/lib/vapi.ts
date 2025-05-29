// Vapi API client and helper functions
// Comprehensive client implementation with authentication and error handling

import { env } from './env'
import { vapiErrorHandler, type ApiError } from './error-handling'

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
  phoneNumberId?: string
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

// Phone Number interfaces
export interface VapiPhoneNumber {
  id: string
  orgId: string
  name?: string
  number: string
  provider: string
  createdAt: string
  updatedAt: string
  twilioPhoneNumber?: string
  twilioAccountSid?: string
  assistantId?: string
  serverUrl?: string
  serverUrlSecret?: string
  // ... other phone number properties from API response
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
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiAssistant>('/assistant', 'POST', config),
      'vapi',
      'createAssistant'
    )
  }

  async updateAssistant(
    assistantId: string,
    config: Partial<VapiAssistantConfig>,
    options?: VapiRequestOptions
  ): Promise<VapiAssistant> {
    return vapiErrorHandler.executeWithRetry(
      () =>
        this.makeRequest<VapiAssistant>(
          `/assistant/${assistantId}`,
          'PATCH',
          config
        ),
      'vapi',
      'updateAssistant'
    )
  }

  async getAssistant(
    assistantId: string,
    options?: VapiRequestOptions
  ): Promise<VapiAssistant> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiAssistant>(`/assistant/${assistantId}`, 'GET'),
      'vapi',
      'getAssistant'
    )
  }

  async listAssistants(options?: VapiRequestOptions): Promise<VapiAssistant[]> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiAssistant[]>('/assistant', 'GET'),
      'vapi',
      'listAssistants'
    )
  }

  async deleteAssistant(
    assistantId: string,
    options?: VapiRequestOptions
  ): Promise<void> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest(`/assistant/${assistantId}`, 'DELETE'),
      'vapi',
      'deleteAssistant'
    )
  }

  // =============================================================================
  // CALL METHODS
  // =============================================================================

  async createCall(
    config: VapiCallConfig,
    options?: VapiRequestOptions
  ): Promise<VapiCall> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiCall>('/call', 'POST', config),
      'vapi',
      'createCall'
    )
  }

  async getCall(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<VapiCall> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiCall>(`/call/${callId}`, 'GET'),
      'vapi',
      'getCall'
    )
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
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiCall[]>('/call', 'GET', { filters }),
      'vapi',
      'listCalls'
    )
  }

  async cancelCall(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<void> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest(`/call/${callId}`, 'DELETE'),
      'vapi',
      'cancelCall'
    )
  }

  async getCallTranscript(
    callId: string,
    options?: VapiRequestOptions
  ): Promise<string | null> {
    try {
      // Get the full call object which includes transcript in artifact field
      const call = await vapiErrorHandler.executeWithRetry(
        () =>
          this.makeRequest<VapiCall & { artifact?: { transcript?: string } }>(
            `/call/${callId}`,
            'GET'
          ),
        'vapi',
        'getCall'
      )

      // Extract transcript from the artifact field
      if (call.artifact?.transcript) {
        return call.artifact.transcript
      }

      return null
    } catch (error) {
      console.warn('Failed to retrieve call or transcript:', error)
      return null
    }
  }

  // =============================================================================
  // PHONE NUMBER METHODS
  // =============================================================================

  async listPhoneNumbers(
    options?: VapiRequestOptions
  ): Promise<VapiPhoneNumber[]> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiPhoneNumber[]>('/phone-number', 'GET'),
      'vapi',
      'listPhoneNumbers'
    )
  }

  async getPhoneNumber(
    phoneNumberId: string,
    options?: VapiRequestOptions
  ): Promise<VapiPhoneNumber> {
    return vapiErrorHandler.executeWithRetry(
      () =>
        this.makeRequest<VapiPhoneNumber>(
          `/phone-number/${phoneNumberId}`,
          'GET'
        ),
      'vapi',
      'getPhoneNumber'
    )
  }

  async createPhoneNumber(
    config: {
      number?: string
      name?: string
      assistantId?: string
      serverUrl?: string
      serverUrlSecret?: string
    },
    options?: VapiRequestOptions
  ): Promise<VapiPhoneNumber> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest<VapiPhoneNumber>('/phone-number', 'POST', config),
      'vapi',
      'createPhoneNumber'
    )
  }

  async updatePhoneNumber(
    phoneNumberId: string,
    config: {
      name?: string
      assistantId?: string
      serverUrl?: string
      serverUrlSecret?: string
    },
    options?: VapiRequestOptions
  ): Promise<VapiPhoneNumber> {
    return vapiErrorHandler.executeWithRetry(
      () =>
        this.makeRequest<VapiPhoneNumber>(
          `/phone-number/${phoneNumberId}`,
          'PATCH',
          config
        ),
      'vapi',
      'updatePhoneNumber'
    )
  }

  async deletePhoneNumber(
    phoneNumberId: string,
    options?: VapiRequestOptions
  ): Promise<void> {
    return vapiErrorHandler.executeWithRetry(
      () => this.makeRequest(`/phone-number/${phoneNumberId}`, 'DELETE'),
      'vapi',
      'deletePhoneNumber'
    )
  }

  // =============================================================================
  // CORE HTTP CLIENT METHODS
  // =============================================================================

  private async makeRequest<T = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(
        `Vapi API error: ${response.status} ${response.statusText}`
      ) as ApiError
      error.status = response.status
      error.details = errorData
      error.service = 'vapi'
      throw error
    }

    // Handle empty responses
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined as T
    }

    return (await response.json()) as T
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
