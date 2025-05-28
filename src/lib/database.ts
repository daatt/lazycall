// Database operations for storing calls and settings
// Comprehensive utility functions for all database models

import {
    Assistant,
    AssistantFilters,
    AssistantStats,
    Call,
    CallHistoryFilters,
    CallStats,
    CreateAssistantData,
    CreateCallData,
    CreateSettingsData,
    CreateTranscriptData,
    PrismaAssistant,
    PrismaCall,
    PrismaSettings,
    PrismaTranscript,
    Settings,
    Transcript,
    TranscriptFilters,
    TranscriptProcessingStatus,
    TranscriptStats,
    UpdateAssistantData,
    UpdateCallData,
    UpdateSettingsData,
    UpdateTranscriptData
} from '@/types'
import { PrismaClient } from '@prisma/client'

// Create a singleton Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// =============================================================================
// TYPE CONVERSION HELPERS
// =============================================================================

// Helper to convert null to undefined for optional fields
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Helper to convert undefined to null for database operations
function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

// Helper to safely parse JSON metadata
function parseMetadata(metadata: string | null): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  try {
    return JSON.parse(metadata)
  } catch (error) {
    console.warn('Failed to parse metadata JSON:', error)
    return undefined
  }
}

// Helper to safely stringify metadata
function stringifyMetadata(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null
  try {
    return JSON.stringify(metadata)
  } catch (error) {
    console.warn('Failed to stringify metadata:', error)
    return null
  }
}

// Helper to safely parse tags array
function parseTags(tags: string | null): string[] | undefined {
  if (!tags) return undefined
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : undefined
  } catch (error) {
    console.warn('Failed to parse tags JSON:', error)
    return undefined
  }
}

// Helper to safely stringify tags array
function stringifyTags(tags: string[] | undefined): string | null {
  if (!tags || !Array.isArray(tags)) return null
  try {
    return JSON.stringify(tags)
  } catch (error) {
    console.warn('Failed to stringify tags:', error)
    return null
  }
}

// Helper to safely cast string to CallStatus enum
function castToCallStatus(status: string): Call['status'] {
  const validStatuses: Call['status'][] = [
    'idle',
    'creating', 
    'dialing',
    'ringing',
    'in-progress',
    'completed',
    'failed',
    'cancelled'
  ]
  
  if (validStatuses.includes(status as Call['status'])) {
    return status as Call['status']
  }
  
  // Default to 'idle' if invalid status
  console.warn(`Invalid call status: ${status}, defaulting to 'idle'`)
  return 'idle'
}

// Helper to safely cast string to transcript processing status
function castToProcessingStatus(status: string): TranscriptProcessingStatus {
  const validStatuses: TranscriptProcessingStatus[] = ['pending', 'processing', 'completed', 'failed']
  
  if (validStatuses.includes(status as TranscriptProcessingStatus)) {
    return status as TranscriptProcessingStatus
  }
  
  // Default to 'pending' if invalid status
  console.warn(`Invalid processing status: ${status}, defaulting to 'pending'`)
  return 'pending'
}

// Helper to validate and cast CallStatus for database operations
function validateCallStatus(status: Call['status'] | string): string {
  const validStatuses = [
    'idle',
    'creating', 
    'dialing',
    'ringing',
    'in-progress',
    'completed',
    'failed',
    'cancelled'
  ]
  
  if (typeof status === 'string' && validStatuses.includes(status)) {
    return status
  }
  
  console.warn(`Invalid call status for database: ${status}, using 'idle'`)
  return 'idle'
}

// Helper to validate transcript processing status for database operations
function validateProcessingStatus(status: TranscriptProcessingStatus | string): string {
  const validStatuses = ['pending', 'processing', 'completed', 'failed']
  
  if (typeof status === 'string' && validStatuses.includes(status)) {
    return status
  }
  
  console.warn(`Invalid processing status for database: ${status}, using 'pending'`)
  return 'pending'
}

// =============================================================================
// COMPREHENSIVE TYPE CONVERSION FUNCTIONS
// =============================================================================

function convertPrismaCallToCall(prismaCall: PrismaCall): Call {
  return {
    id: prismaCall.id,
    phoneNumber: prismaCall.phoneNumber,
    status: castToCallStatus(prismaCall.status),
    assistantId: nullToUndefined(prismaCall.assistantId),
    vapiCallId: nullToUndefined(prismaCall.vapiCallId),
    startedAt: nullToUndefined(prismaCall.startedAt),
    endedAt: nullToUndefined(prismaCall.endedAt),
    duration: nullToUndefined(prismaCall.duration),
    cost: nullToUndefined(prismaCall.cost),
    metadata: parseMetadata(prismaCall.metadata),
    createdAt: prismaCall.createdAt,
    updatedAt: prismaCall.updatedAt,
    // Convert relations if included
    transcripts: prismaCall.transcripts?.map(convertPrismaTranscriptToTranscript),
    assistant: prismaCall.assistant ? convertPrismaAssistantToAssistant(prismaCall.assistant) : undefined,
  }
}

function convertPrismaTranscriptToTranscript(prismaTranscript: PrismaTranscript): Transcript {
  return {
    id: prismaTranscript.id,
    callId: prismaTranscript.callId,
    content: prismaTranscript.content,
    summary: nullToUndefined(prismaTranscript.summary),
    analysis: nullToUndefined(prismaTranscript.analysis),
    processingStatus: castToProcessingStatus(prismaTranscript.processingStatus),
    wordCount: nullToUndefined(prismaTranscript.wordCount),
    confidence: nullToUndefined(prismaTranscript.confidence),
    language: nullToUndefined(prismaTranscript.language),
    metadata: parseMetadata(prismaTranscript.metadata),
    createdAt: prismaTranscript.createdAt,
    updatedAt: prismaTranscript.updatedAt,
    // Convert relations if included
    call: prismaTranscript.call ? convertPrismaCallToCall(prismaTranscript.call) : undefined,
  }
}

function convertPrismaAssistantToAssistant(prismaAssistant: PrismaAssistant): Assistant {
  return {
    id: prismaAssistant.id,
    name: prismaAssistant.name,
    systemPrompt: prismaAssistant.systemPrompt,
    vapiAssistantId: nullToUndefined(prismaAssistant.vapiAssistantId),
    isActive: prismaAssistant.isActive,
    voice: nullToUndefined(prismaAssistant.voice),
    language: prismaAssistant.language,
    model: prismaAssistant.model,
    temperature: nullToUndefined(prismaAssistant.temperature),
    maxTokens: nullToUndefined(prismaAssistant.maxTokens),
    description: nullToUndefined(prismaAssistant.description),
    tags: parseTags(prismaAssistant.tags),
    usageCount: prismaAssistant.usageCount,
    lastUsedAt: nullToUndefined(prismaAssistant.lastUsedAt),
    createdAt: prismaAssistant.createdAt,
    updatedAt: prismaAssistant.updatedAt,
    // Convert relations if included
    calls: prismaAssistant.calls?.map(convertPrismaCallToCall),
  }
}

function convertPrismaSettingsToSettings(prismaSettings: PrismaSettings): Settings {
  return {
    id: prismaSettings.id,
    systemPrompt: prismaSettings.systemPrompt,
    defaultAssistantId: nullToUndefined(prismaSettings.defaultAssistantId),
    openaiApiKey: nullToUndefined(prismaSettings.openaiApiKey),
    vapiApiKey: nullToUndefined(prismaSettings.vapiApiKey),
    createdAt: prismaSettings.createdAt,
    updatedAt: prismaSettings.updatedAt,
  }
}

// =============================================================================
// CALL OPERATIONS
// =============================================================================

export async function createCall(data: CreateCallData): Promise<Call> {
  try {
    const call = await prisma.call.create({
      data: {
        phoneNumber: data.phoneNumber,
        status: validateCallStatus(data.status),
        assistantId: undefinedToNull(data.assistantId),
        vapiCallId: undefinedToNull(data.vapiCallId),
        startedAt: undefinedToNull(data.startedAt),
        endedAt: undefinedToNull(data.endedAt),
        duration: undefinedToNull(data.duration),
        cost: undefinedToNull(data.cost),
        metadata: stringifyMetadata(data.metadata),
      },
      include: {
        assistant: true,
        transcripts: true,
      },
    })

    return convertPrismaCallToCall(call)
  } catch (error) {
    console.error('Failed to create call:', error)
    throw new Error('Failed to create call')
  }
}

export async function updateCall(id: string, data: UpdateCallData): Promise<Call> {
  try {
    const updateData: any = {}

    // Only include fields that are explicitly provided
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber
    if (data.status !== undefined) updateData.status = validateCallStatus(data.status)
    if (data.assistantId !== undefined) updateData.assistantId = undefinedToNull(data.assistantId)
    if (data.vapiCallId !== undefined) updateData.vapiCallId = undefinedToNull(data.vapiCallId)
    if (data.startedAt !== undefined) updateData.startedAt = undefinedToNull(data.startedAt)
    if (data.endedAt !== undefined) updateData.endedAt = undefinedToNull(data.endedAt)
    if (data.duration !== undefined) updateData.duration = undefinedToNull(data.duration)
    if (data.cost !== undefined) updateData.cost = undefinedToNull(data.cost)
    if (data.metadata !== undefined) updateData.metadata = stringifyMetadata(data.metadata)

    const call = await prisma.call.update({
      where: { id },
      data: updateData,
      include: {
        assistant: true,
        transcripts: true,
      },
    })

    return convertPrismaCallToCall(call)
  } catch (error) {
    console.error('Failed to update call:', error)
    throw new Error('Failed to update call')
  }
}

export async function getCall(id: string): Promise<Call | null> {
  try {
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        assistant: true,
        transcripts: true,
      },
    })

    if (!call) return null

    return convertPrismaCallToCall(call)
  } catch (error) {
    console.error('Failed to get call:', error)
    throw new Error('Failed to get call')
  }
}

export async function getCalls(filters?: CallHistoryFilters): Promise<{ calls: Call[]; total: number }> {
  try {
    const where: any = {}

    if (filters?.status) {
      where.status = validateCallStatus(filters.status)
    }

    if (filters?.phoneNumber) {
      where.phoneNumber = {
        contains: filters.phoneNumber,
      }
    }

    if (filters?.assistantId) {
      where.assistantId = filters.assistantId
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          assistant: true,
          transcripts: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 50),
      }),
      prisma.call.count({ where }),
    ])

    return {
      calls: calls.map(call => convertPrismaCallToCall(call)),
      total,
    }
  } catch (error) {
    console.error('Failed to get calls:', error)
    throw new Error('Failed to get calls')
  }
}

export async function updateCallStatus(id: string, status: Call['status']): Promise<Call> {
  return updateCall(id, { status })
}

export async function incrementCallUsage(assistantId: string): Promise<void> {
  try {
    await prisma.assistant.update({
      where: { id: assistantId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to increment call usage:', error)
    throw new Error('Failed to increment call usage')
  }
}

// =============================================================================
// TRANSCRIPT OPERATIONS
// =============================================================================

export async function createTranscript(data: CreateTranscriptData): Promise<Transcript> {
  try {
    const transcript = await prisma.transcript.create({
      data: {
        callId: data.callId,
        content: data.content,
        summary: undefinedToNull(data.summary),
        analysis: undefinedToNull(data.analysis),
        processingStatus: 'pending',
        wordCount: data.content.split(' ').length,
        confidence: null,
        language: 'en',
        metadata: null,
      },
      include: {
        call: true,
      },
    })

    return convertPrismaTranscriptToTranscript(transcript)
  } catch (error) {
    console.error('Failed to create transcript:', error)
    throw new Error('Failed to create transcript')
  }
}

export async function updateTranscript(id: string, data: UpdateTranscriptData): Promise<Transcript> {
  try {
    const updateData: any = {}

    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.wordCount = data.content.split(' ').length
    }
    if (data.summary !== undefined) updateData.summary = undefinedToNull(data.summary)
    if (data.analysis !== undefined) updateData.analysis = undefinedToNull(data.analysis)
    if (data.processingStatus !== undefined) updateData.processingStatus = validateProcessingStatus(data.processingStatus)
    if (data.wordCount !== undefined) updateData.wordCount = undefinedToNull(data.wordCount)
    if (data.confidence !== undefined) updateData.confidence = undefinedToNull(data.confidence)
    if (data.language !== undefined) updateData.language = undefinedToNull(data.language)
    if (data.metadata !== undefined) updateData.metadata = stringifyMetadata(data.metadata)

    const transcript = await prisma.transcript.update({
      where: { id },
      data: updateData,
      include: {
        call: true,
      },
    })

    return convertPrismaTranscriptToTranscript(transcript)
  } catch (error) {
    console.error('Failed to update transcript:', error)
    throw new Error('Failed to update transcript')
  }
}

export async function updateTranscriptProcessing(
  id: string,
  data: {
    summary?: string
    analysis?: string
    processingStatus: TranscriptProcessingStatus
    confidence?: number
    language?: string
    metadata?: Record<string, unknown>
  }
): Promise<Transcript> {
  try {
    const transcript = await prisma.transcript.update({
      where: { id },
      data: {
        summary: undefinedToNull(data.summary),
        analysis: undefinedToNull(data.analysis),
        processingStatus: validateProcessingStatus(data.processingStatus),
        confidence: undefinedToNull(data.confidence),
        language: undefinedToNull(data.language),
        metadata: stringifyMetadata(data.metadata),
      },
      include: {
        call: true,
      },
    })

    return convertPrismaTranscriptToTranscript(transcript)
  } catch (error) {
    console.error('Failed to update transcript processing:', error)
    throw new Error('Failed to update transcript processing')
  }
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  try {
    const transcript = await prisma.transcript.findUnique({
      where: { id },
      include: {
        call: {
          include: {
            assistant: true,
          },
        },
      },
    })

    return transcript ? convertPrismaTranscriptToTranscript(transcript) : null
  } catch (error) {
    console.error('Failed to get transcript:', error)
    throw new Error('Failed to get transcript')
  }
}

export async function getTranscripts(filters?: TranscriptFilters): Promise<{ transcripts: Transcript[]; total: number }> {
  try {
    const where: any = {}

    if (filters?.callId) {
      where.callId = filters.callId
    }

    if (filters?.processingStatus) {
      where.processingStatus = validateProcessingStatus(filters.processingStatus)
    }

    if (filters?.language) {
      where.language = filters.language
    }

    const [transcripts, total] = await Promise.all([
      prisma.transcript.findMany({
        where,
        include: {
          call: {
            include: {
              assistant: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 50),
      }),
      prisma.transcript.count({ where }),
    ])

    return {
      transcripts: transcripts.map(transcript => convertPrismaTranscriptToTranscript(transcript)),
      total,
    }
  } catch (error) {
    console.error('Failed to get transcripts:', error)
    throw new Error('Failed to get transcripts')
  }
}

export async function getTranscriptByCallId(callId: string): Promise<Transcript | null> {
  try {
    const transcript = await prisma.transcript.findFirst({
      where: { callId },
      include: {
        call: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return transcript ? convertPrismaTranscriptToTranscript(transcript) : null
  } catch (error) {
    console.error('Failed to get transcript by call ID:', error)
    throw new Error('Failed to get transcript by call ID')
  }
}

export async function getTranscriptsByCallId(callId: string): Promise<Transcript[]> {
  try {
    const transcripts = await prisma.transcript.findMany({
      where: { callId },
      include: {
        call: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return transcripts.map(transcript => convertPrismaTranscriptToTranscript(transcript))
  } catch (error) {
    console.error('Failed to get transcripts by call ID:', error)
    throw new Error('Failed to get transcripts by call ID')
  }
}

export async function getPendingTranscripts(): Promise<Transcript[]> {
  try {
    const transcripts = await prisma.transcript.findMany({
      where: { processingStatus: 'pending' },
      include: {
        call: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return transcripts.map(transcript => convertPrismaTranscriptToTranscript(transcript))
  } catch (error) {
    console.error('Failed to get pending transcripts:', error)
    throw new Error('Failed to get pending transcripts')
  }
}

// =============================================================================
// ASSISTANT OPERATIONS
// =============================================================================

export async function createAssistant(data: CreateAssistantData): Promise<Assistant> {
  try {
    const assistant = await prisma.assistant.create({
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        vapiAssistantId: undefinedToNull(data.vapiAssistantId),
        isActive: data.isActive,
        voice: undefinedToNull(data.voice),
        language: data.language || 'en',
        model: data.model || 'gpt-4',
        temperature: undefinedToNull(data.temperature),
        maxTokens: undefinedToNull(data.maxTokens),
        description: undefinedToNull(data.description),
        tags: stringifyTags(data.tags),
      },
    })

    return convertPrismaAssistantToAssistant(assistant)
  } catch (error) {
    console.error('Failed to create assistant:', error)
    throw new Error('Failed to create assistant')
  }
}

export async function updateAssistant(id: string, data: UpdateAssistantData): Promise<Assistant> {
  try {
    const updateData: any = {}

    // Only include fields that are explicitly provided
    if (data.name !== undefined) updateData.name = data.name
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt
    if (data.vapiAssistantId !== undefined) updateData.vapiAssistantId = undefinedToNull(data.vapiAssistantId)
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.voice !== undefined) updateData.voice = undefinedToNull(data.voice)
    if (data.language !== undefined) updateData.language = data.language
    if (data.model !== undefined) updateData.model = data.model
    if (data.temperature !== undefined) updateData.temperature = undefinedToNull(data.temperature)
    if (data.maxTokens !== undefined) updateData.maxTokens = undefinedToNull(data.maxTokens)
    if (data.description !== undefined) updateData.description = undefinedToNull(data.description)
    if (data.tags !== undefined) updateData.tags = stringifyTags(data.tags)

    const assistant = await prisma.assistant.update({
      where: { id },
      data: updateData,
    })

    return convertPrismaAssistantToAssistant(assistant)
  } catch (error) {
    console.error('Failed to update assistant:', error)
    throw new Error('Failed to update assistant')
  }
}

export async function getAssistant(id: string): Promise<Assistant | null> {
  try {
    const assistant = await prisma.assistant.findUnique({
      where: { id },
      include: {
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    return assistant ? convertPrismaAssistantToAssistant(assistant) : null
  } catch (error) {
    console.error('Failed to get assistant:', error)
    throw new Error('Failed to get assistant')
  }
}

export async function getAssistants(filters?: AssistantFilters): Promise<{ assistants: Assistant[]; total: number }> {
  try {
    const where: any = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.language) {
      where.language = filters.language
    }

    if (filters?.model) {
      where.model = filters.model
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Search for assistants that have any of the specified tags
      where.tags = {
        contains: filters.tags[0], // Simple contains search for now
      }
    }

    const [assistants, total] = await Promise.all([
      prisma.assistant.findMany({
        where,
        orderBy: [
          { lastUsedAt: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 50,
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 50),
      }),
      prisma.assistant.count({ where }),
    ])

    return {
      assistants: assistants.map(assistant => convertPrismaAssistantToAssistant(assistant)),
      total,
    }
  } catch (error) {
    console.error('Failed to get assistants:', error)
    throw new Error('Failed to get assistants')
  }
}

export async function getActiveAssistants(): Promise<Assistant[]> {
  const result = await getAssistants({ isActive: true })
  return result.assistants
}

export async function getAssistantByVapiId(vapiAssistantId: string): Promise<Assistant | null> {
  try {
    const assistant = await prisma.assistant.findFirst({
      where: { vapiAssistantId },
    })

    return assistant ? convertPrismaAssistantToAssistant(assistant) : null
  } catch (error) {
    console.error('Failed to get assistant by Vapi ID:', error)
    throw new Error('Failed to get assistant by Vapi ID')
  }
}

export async function deactivateAssistant(id: string): Promise<Assistant> {
  return updateAssistant(id, { isActive: false })
}

export async function activateAssistant(id: string): Promise<Assistant> {
  return updateAssistant(id, { isActive: true })
}

// =============================================================================
// SETTINGS OPERATIONS
// =============================================================================

export async function getSettings(): Promise<Settings | null> {
  try {
    const settings = await prisma.settings.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    return settings ? convertPrismaSettingsToSettings(settings) : null
  } catch (error) {
    console.error('Failed to get settings:', error)
    throw new Error('Failed to get settings')
  }
}

export async function updateSettings(data: UpdateSettingsData): Promise<Settings> {
  try {
    // Get the first (and should be only) settings record
    const existingSettings = await getSettings()

    if (!existingSettings) {
      // Create new settings if none exist
      return createDefaultSettings(data)
    }

    const updateData: any = {}

    // Only include fields that are explicitly provided
    if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt
    if (data.defaultAssistantId !== undefined) updateData.defaultAssistantId = undefinedToNull(data.defaultAssistantId)
    if (data.openaiApiKey !== undefined) updateData.openaiApiKey = undefinedToNull(data.openaiApiKey)
    if (data.vapiApiKey !== undefined) updateData.vapiApiKey = undefinedToNull(data.vapiApiKey)

    const settings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data: updateData,
    })

    return convertPrismaSettingsToSettings(settings)
  } catch (error) {
    console.error('Failed to update settings:', error)
    throw new Error('Failed to update settings')
  }
}

export async function createDefaultSettings(overrides?: Partial<CreateSettingsData>): Promise<Settings> {
  try {
    const settings = await prisma.settings.create({
      data: {
        systemPrompt: overrides?.systemPrompt || 'You are a helpful AI assistant making phone calls on behalf of the user. Be polite, professional, and accomplish the task efficiently.',
        defaultAssistantId: undefinedToNull(overrides?.defaultAssistantId),
        openaiApiKey: undefinedToNull(overrides?.openaiApiKey),
        vapiApiKey: undefinedToNull(overrides?.vapiApiKey),
      },
    })

    return convertPrismaSettingsToSettings(settings)
  } catch (error) {
    console.error('Failed to create default settings:', error)
    throw new Error('Failed to create default settings')
  }
}

// =============================================================================
// ENHANCED UTILITY FUNCTIONS
// =============================================================================

export async function getCallsWithTranscripts(limit: number = 10): Promise<Call[]> {
  try {
    const calls = await prisma.call.findMany({
      include: {
        assistant: true,
        transcripts: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return calls.map(call => convertPrismaCallToCall(call))
  } catch (error) {
    console.error('Failed to get calls with transcripts:', error)
    throw new Error('Failed to get calls with transcripts')
  }
}

export async function getCallStats(): Promise<CallStats> {
  try {
    const [totalCalls, completedCalls, failedCalls, aggregates] = await Promise.all([
      prisma.call.count(),
      prisma.call.count({ where: { status: 'completed' } }),
      prisma.call.count({ where: { status: 'failed' } }),
      prisma.call.aggregate({
        _sum: { duration: true, cost: true },
        _avg: { duration: true, cost: true },
        where: { status: 'completed' },
      }),
    ])

    const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      totalDuration: aggregates._sum.duration || 0,
      totalCost: aggregates._sum.cost || 0,
      averageDuration: aggregates._avg.duration || 0,
      averageCost: aggregates._avg.cost || 0,
      successRate,
    }
  } catch (error) {
    console.error('Failed to get call stats:', error)
    throw new Error('Failed to get call stats')
  }
}

export async function getAssistantStats(): Promise<AssistantStats> {
  try {
    const [totalAssistants, activeAssistants, mostUsedAssistant, avgUsage] = await Promise.all([
      prisma.assistant.count(),
      prisma.assistant.count({ where: { isActive: true } }),
      prisma.assistant.findFirst({
        orderBy: { usageCount: 'desc' },
        where: { usageCount: { gt: 0 } },
      }),
      prisma.assistant.aggregate({
        _avg: { usageCount: true },
      }),
    ])

    return {
      totalAssistants,
      activeAssistants,
      mostUsedAssistant: mostUsedAssistant ? convertPrismaAssistantToAssistant(mostUsedAssistant) : null,
      averageUsage: avgUsage._avg.usageCount || 0,
    }
  } catch (error) {
    console.error('Failed to get assistant stats:', error)
    throw new Error('Failed to get assistant stats')
  }
}

export async function getTranscriptStats(): Promise<TranscriptStats> {
  try {
    const [
      totalTranscripts,
      pendingTranscripts,
      completedTranscripts,
      failedTranscripts,
      aggregates
    ] = await Promise.all([
      prisma.transcript.count(),
      prisma.transcript.count({ where: { processingStatus: 'pending' } }),
      prisma.transcript.count({ where: { processingStatus: 'completed' } }),
      prisma.transcript.count({ where: { processingStatus: 'failed' } }),
      prisma.transcript.aggregate({
        _avg: { wordCount: true, confidence: true },
      }),
    ])

    return {
      totalTranscripts,
      pendingTranscripts,
      completedTranscripts,
      failedTranscripts,
      averageWordCount: aggregates._avg.wordCount || 0,
      averageConfidence: aggregates._avg.confidence || 0,
    }
  } catch (error) {
    console.error('Failed to get transcript stats:', error)
    throw new Error('Failed to get transcript stats')
  }
}

// =============================================================================
// ADVANCED QUERY FUNCTIONS
// =============================================================================

export async function searchCalls(query: string, limit: number = 20): Promise<Call[]> {
  try {
    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: query } },
          { vapiCallId: { contains: query } },
          { metadata: { contains: query } },
        ],
      },
      include: {
        assistant: true,
        transcripts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return calls.map(call => convertPrismaCallToCall(call))
  } catch (error) {
    console.error('Failed to search calls:', error)
    throw new Error('Failed to search calls')
  }
}

export async function searchTranscripts(query: string, limit: number = 20): Promise<Transcript[]> {
  try {
    const transcripts = await prisma.transcript.findMany({
      where: {
        OR: [
          { content: { contains: query } },
          { summary: { contains: query } },
          { analysis: { contains: query } },
        ],
      },
      include: {
        call: {
          include: {
            assistant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return transcripts.map(transcript => convertPrismaTranscriptToTranscript(transcript))
  } catch (error) {
    console.error('Failed to search transcripts:', error)
    throw new Error('Failed to search transcripts')
  }
}

export async function searchAssistants(query: string, limit: number = 20): Promise<Assistant[]> {
  try {
    const assistants = await prisma.assistant.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { systemPrompt: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return assistants.map(assistant => convertPrismaAssistantToAssistant(assistant))
  } catch (error) {
    console.error('Failed to search assistants:', error)
    throw new Error('Failed to search assistants')
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Failed to disconnect database:', error)
  }
}
