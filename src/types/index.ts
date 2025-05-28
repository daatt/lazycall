// Core types for the AI Agent Calling application

export interface Call {
  id: string
  phoneNumber: string
  status: CallStatus
  assistantId?: string
  vapiCallId?: string
  startedAt?: Date
  endedAt?: Date
  duration?: number
  cost?: number
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Transcript {
  id: string
  callId: string
  content: string
  summary?: string
  analysis?: string
  createdAt: Date
  updatedAt: Date
}

export interface Assistant {
  id: string
  name: string
  systemPrompt: string
  vapiAssistantId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Settings {
  id: string
  systemPrompt: string
  defaultAssistantId?: string
  openaiApiKey?: string
  vapiApiKey?: string
  updatedAt: Date
}

export type CallStatus =
  | 'idle'
  | 'creating'
  | 'dialing'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface CallFormData {
  phoneNumber: string
  customPrompt?: string
  assistantId?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface VapiCallEvent {
  type: string
  callId: string
  timestamp: string
  data: Record<string, unknown>
}

export interface CallHistoryFilters {
  status?: CallStatus
  dateFrom?: Date
  dateTo?: Date
  phoneNumber?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
