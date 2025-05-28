// Core types for the AI Agent Calling application

// =============================================================================
// PRISMA TYPE MAPPINGS
// =============================================================================

// Raw Prisma types (what comes directly from database)
export interface PrismaCall {
  id: string
  phoneNumber: string
  status: string
  assistantId: string | null
  vapiCallId: string | null
  startedAt: Date | null
  endedAt: Date | null
  duration: number | null
  cost: number | null
  metadata: string | null
  createdAt: Date
  updatedAt: Date
  // Relations (when included)
  transcripts?: PrismaTranscript[]
  assistant?: PrismaAssistant | null
}

export interface PrismaTranscript {
  id: string
  callId: string
  content: string
  summary: string | null
  analysis: string | null
  processingStatus: string
  wordCount: number | null
  confidence: number | null
  language: string | null
  metadata: string | null
  createdAt: Date
  updatedAt: Date
  // Relations (when included)
  call?: PrismaCall
}

export interface PrismaAssistant {
  id: string
  name: string
  systemPrompt: string
  vapiAssistantId: string | null
  isActive: boolean
  voice: string | null
  language: string
  model: string
  temperature: number | null
  maxTokens: number | null
  description: string | null
  tags: string | null
  usageCount: number
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Relations (when included)
  calls?: PrismaCall[]
}

export interface PrismaSettings {
  id: string
  systemPrompt: string
  defaultAssistantId: string | null
  openaiApiKey: string | null
  vapiApiKey: string | null
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// APPLICATION TYPES (TypeScript-friendly)
// =============================================================================

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
  // Relations (when included)
  transcripts?: Transcript[]
  assistant?: Assistant
}

export interface Transcript {
  id: string
  callId: string
  content: string
  summary?: string
  analysis?: string
  processingStatus: TranscriptProcessingStatus
  wordCount?: number
  confidence?: number
  language?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  // Relations (when included)
  call?: Call
}

export interface Assistant {
  id: string
  name: string
  systemPrompt: string
  vapiAssistantId?: string
  isActive: boolean
  voice?: string
  language: string
  model: string
  temperature?: number
  maxTokens?: number
  description?: string
  tags?: string[]
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
  // Relations (when included)
  calls?: Call[]
}

export interface Settings {
  id: string
  systemPrompt: string
  defaultAssistantId?: string
  openaiApiKey?: string
  vapiApiKey?: string
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// ENUMS AND STATUS TYPES
// =============================================================================

export type CallStatus =
  | 'idle'
  | 'creating'
  | 'dialing'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type TranscriptProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

// =============================================================================
// FORM AND API TYPES
// =============================================================================

export interface CallFormData {
  phoneNumber: string
  customPrompt?: string
  assistantId?: string
}

export interface AssistantFormData {
  name: string
  systemPrompt: string
  voice?: string
  language?: string
  model?: string
  temperature?: number
  maxTokens?: number
  description?: string
  tags?: string[]
}

export interface SettingsFormData {
  systemPrompt: string
  defaultAssistantId?: string
  openaiApiKey?: string
  vapiApiKey?: string
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
  assistantId?: string
  page?: number
  limit?: number
}

export interface TranscriptFilters {
  callId?: string
  processingStatus?: TranscriptProcessingStatus
  language?: string
  page?: number
  limit?: number
}

export interface AssistantFilters {
  isActive?: boolean
  language?: string
  model?: string
  tags?: string[]
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

// =============================================================================
// STATISTICS AND ANALYTICS TYPES
// =============================================================================

export interface CallStats {
  totalCalls: number
  completedCalls: number
  failedCalls: number
  totalDuration: number
  totalCost: number
  averageDuration: number
  averageCost: number
  successRate: number
}

export interface AssistantStats {
  totalAssistants: number
  activeAssistants: number
  mostUsedAssistant: Assistant | null
  averageUsage: number
}

export interface TranscriptStats {
  totalTranscripts: number
  pendingTranscripts: number
  completedTranscripts: number
  failedTranscripts: number
  averageWordCount: number
  averageConfidence: number
}

export interface DashboardStats {
  calls: CallStats
  assistants: AssistantStats
  transcripts: TranscriptStats
}

// =============================================================================
// TYPE CONVERSION UTILITIES
// =============================================================================

export type CreateCallData = Omit<Call, 'id' | 'createdAt' | 'updatedAt' | 'transcripts' | 'assistant'>
export type UpdateCallData = Partial<Omit<Call, 'id' | 'createdAt' | 'updatedAt' | 'transcripts' | 'assistant'>>

export type CreateTranscriptData = Omit<Transcript, 'id' | 'createdAt' | 'updatedAt' | 'processingStatus' | 'wordCount' | 'confidence' | 'language' | 'metadata' | 'call'>
export type UpdateTranscriptData = Partial<Omit<Transcript, 'id' | 'callId' | 'createdAt' | 'updatedAt' | 'call'>>

export type CreateAssistantData = Omit<Assistant, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt' | 'calls'>
export type UpdateAssistantData = Partial<Omit<Assistant, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt' | 'calls'>>

export type CreateSettingsData = Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSettingsData = Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// =============================================================================
// WEBHOOK AND EVENT TYPES
// =============================================================================

export interface VapiWebhookPayload {
  message: {
    type: string
    call?: {
      id: string
      status: string
      phoneNumber: string
      startedAt?: string
      endedAt?: string
      cost?: number
      transcript?: string
    }
    assistant?: {
      id: string
      name: string
    }
    timestamp: string
  }
}

export type WebhookEventType = 
  | 'call.started'
  | 'call.ended'
  | 'call.failed'
  | 'transcript.ready'
  | 'assistant.created'
  | 'assistant.updated'
