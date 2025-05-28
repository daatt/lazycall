// Vapi API client and helper functions
// This will be implemented in task 3.1

import { env } from './env'

export class VapiClient {
  private apiKey: string
  private baseUrl: string = 'https://api.vapi.ai'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.VAPI_API_KEY || ''
  }

  // TODO: Implement assistant creation
  // This will be implemented in task 3.2
  async createAssistant(_config: {
    name: string
    systemPrompt: string
    voice?: string
  }) {
    throw new Error('createAssistant not implemented yet - task 3.2')
  }

  // TODO: Implement outbound call creation
  // This will be implemented in task 3.3
  async createCall(_config: {
    phoneNumber: string
    assistantId: string
    metadata?: Record<string, unknown>
  }) {
    throw new Error('createCall not implemented yet - task 3.3')
  }

  // TODO: Implement call transcript retrieval
  // This will be implemented in task 3.5
  async getCallTranscript(_callId: string) {
    throw new Error('getCallTranscript not implemented yet - task 3.5')
  }

  // TODO: Implement call status retrieval
  async getCallStatus(_callId: string) {
    throw new Error('getCallStatus not implemented yet')
  }

  // TODO: Implement call cancellation
  async cancelCall(_callId: string) {
    throw new Error('cancelCall not implemented yet')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Vapi API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }
}

// Export a default instance
export const vapi = new VapiClient()
