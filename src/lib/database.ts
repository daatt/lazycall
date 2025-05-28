// Database operations for storing calls and settings
// Comprehensive utility functions for all database models

import { Assistant, Call, CallHistoryFilters, Settings, Transcript } from '@/types'
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

function convertPrismaCallToCall(prismaCall: any): Call {
  return {
    id: prismaCall.id,
    phoneNumber: prismaCall.phoneNumber,
    status: prismaCall.status as Call['status'],
    assistantId: prismaCall.assistantId || undefined,
    vapiCallId: prismaCall.vapiCallId || undefined,
    startedAt: prismaCall.startedAt || undefined,
    endedAt: prismaCall.endedAt || undefined,
    duration: prismaCall.duration || undefined,
    cost: prismaCall.cost || undefined,
    metadata: prismaCall.metadata ? JSON.parse(prismaCall.metadata) : undefined,
    createdAt: prismaCall.createdAt,
    updatedAt: prismaCall.updatedAt,
  }
}

function convertPrismaTranscriptToTranscript(prismaTranscript: any): Transcript {
  return {
    id: prismaTranscript.id,
    callId: prismaTranscript.callId,
    content: prismaTranscript.content,
    summary: prismaTranscript.summary || undefined,
    analysis: prismaTranscript.analysis || undefined,
    createdAt: prismaTranscript.createdAt,
    updatedAt: prismaTranscript.updatedAt,
  }
}

// =============================================================================
// CALL OPERATIONS
// =============================================================================

export async function createCall(
  data: Omit<Call, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Call> {
  const call = await prisma.call.create({
    data: {
      phoneNumber: data.phoneNumber,
      status: data.status,
      assistantId: data.assistantId,
      vapiCallId: data.vapiCallId,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      duration: data.duration,
      cost: data.cost,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
    include: {
      assistant: true,
      transcripts: true,
    },
  })

  return {
    ...call,
    status: call.status as Call['status'],
    metadata: call.metadata ? JSON.parse(call.metadata) : undefined,
  }
}

export async function updateCall(
  id: string,
  data: Partial<Call>
): Promise<Call> {
  const call = await prisma.call.update({
    where: { id },
    data: {
      phoneNumber: data.phoneNumber,
      status: data.status,
      assistantId: data.assistantId,
      vapiCallId: data.vapiCallId,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      duration: data.duration,
      cost: data.cost,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
    include: {
      assistant: true,
      transcripts: true,
    },
  })

  return convertPrismaCallToCall(call)
}

export async function getCall(id: string): Promise<Call | null> {
  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      assistant: true,
      transcripts: true,
    },
  })

  if (!call) return null

  return convertPrismaCallToCall(call)
}

export async function getCalls(filters?: CallHistoryFilters): Promise<{ calls: Call[]; total: number }> {
  const where: any = {}

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.phoneNumber) {
    where.phoneNumber = {
      contains: filters.phoneNumber,
    }
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
    calls: calls.map(call => ({
      ...call,
      status: call.status as Call['status'],
      metadata: call.metadata ? JSON.parse(call.metadata) : undefined,
    })),
    total,
  }
}

export async function updateCallStatus(id: string, status: Call['status']): Promise<Call> {
  return updateCall(id, { status })
}

export async function incrementCallUsage(assistantId: string): Promise<void> {
  await prisma.assistant.update({
    where: { id: assistantId },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  })
}

// =============================================================================
// TRANSCRIPT OPERATIONS
// =============================================================================

export async function createTranscript(
  data: Omit<Transcript, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transcript> {
  const transcript = await prisma.transcript.create({
    data: {
      callId: data.callId,
      content: data.content,
      summary: data.summary,
      analysis: data.analysis,
      processingStatus: 'pending',
      wordCount: data.content.split(' ').length,
      confidence: undefined,
      language: 'en',
      metadata: undefined,
    },
    include: {
      call: true,
    },
  })

  return transcript
}

export async function updateTranscript(
  id: string,
  data: Partial<Transcript>
): Promise<Transcript> {
  const updateData: any = {}

  if (data.content !== undefined) {
    updateData.content = data.content
    updateData.wordCount = data.content.split(' ').length
  }
  if (data.summary !== undefined) updateData.summary = data.summary
  if (data.analysis !== undefined) updateData.analysis = data.analysis

  const transcript = await prisma.transcript.update({
    where: { id },
    data: updateData,
    include: {
      call: true,
    },
  })

  return transcript
}

export async function updateTranscriptProcessing(
  id: string,
  data: {
    summary?: string
    analysis?: string
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
    confidence?: number
    language?: string
    metadata?: Record<string, unknown>
  }
): Promise<Transcript> {
  const transcript = await prisma.transcript.update({
    where: { id },
    data: {
      summary: data.summary,
      analysis: data.analysis,
      processingStatus: data.processingStatus,
      confidence: data.confidence,
      language: data.language,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
    include: {
      call: true,
    },
  })

  return transcript
}

export async function getTranscriptByCallId(callId: string): Promise<Transcript | null> {
  const transcript = await prisma.transcript.findFirst({
    where: { callId },
    include: {
      call: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return transcript
}

export async function getTranscriptsByCallId(callId: string): Promise<Transcript[]> {
  const transcripts = await prisma.transcript.findMany({
    where: { callId },
    include: {
      call: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return transcripts
}

export async function getPendingTranscripts(): Promise<Transcript[]> {
  return prisma.transcript.findMany({
    where: { processingStatus: 'pending' },
    include: {
      call: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

// =============================================================================
// ASSISTANT OPERATIONS
// =============================================================================

export async function createAssistant(
  data: Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Assistant> {
  const assistant = await prisma.assistant.create({
    data: {
      name: data.name,
      systemPrompt: data.systemPrompt,
      vapiAssistantId: data.vapiAssistantId,
      isActive: data.isActive,
      voice: undefined,
      language: 'en',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: undefined,
      description: undefined,
      tags: undefined,
    },
  })

  return assistant
}

export async function updateAssistant(
  id: string,
  data: Partial<Assistant>
): Promise<Assistant> {
  const assistant = await prisma.assistant.update({
    where: { id },
    data: {
      name: data.name,
      systemPrompt: data.systemPrompt,
      vapiAssistantId: data.vapiAssistantId,
      isActive: data.isActive,
    },
  })

  return assistant
}

export async function getAssistant(id: string): Promise<Assistant | null> {
  const assistant = await prisma.assistant.findUnique({
    where: { id },
    include: {
      calls: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return assistant
}

export async function getAssistants(activeOnly: boolean = false): Promise<Assistant[]> {
  const assistants = await prisma.assistant.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [
      { lastUsedAt: 'desc' },
      { usageCount: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return assistants
}

export async function getAssistantByVapiId(vapiAssistantId: string): Promise<Assistant | null> {
  return prisma.assistant.findFirst({
    where: { vapiAssistantId },
  })
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
  const settings = await prisma.settings.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  return settings
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  // Get the first (and should be only) settings record
  const existingSettings = await getSettings()

  if (!existingSettings) {
    // Create new settings if none exist
    return createDefaultSettings(data)
  }

  const settings = await prisma.settings.update({
    where: { id: existingSettings.id },
    data: {
      systemPrompt: data.systemPrompt,
      defaultAssistantId: data.defaultAssistantId,
      openaiApiKey: data.openaiApiKey,
      vapiApiKey: data.vapiApiKey,
    },
  })

  return settings
}

export async function createDefaultSettings(overrides?: Partial<Settings>): Promise<Settings> {
  const settings = await prisma.settings.create({
    data: {
      systemPrompt: overrides?.systemPrompt || 'You are a helpful AI assistant making phone calls on behalf of the user. Be polite, professional, and accomplish the task efficiently.',
      defaultAssistantId: overrides?.defaultAssistantId,
      openaiApiKey: overrides?.openaiApiKey,
      vapiApiKey: overrides?.vapiApiKey,
    },
  })

  return settings
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export async function getCallsWithTranscripts(limit: number = 10): Promise<Call[]> {
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

  return calls.map(call => ({
    ...call,
    status: call.status as Call['status'],
    metadata: call.metadata ? JSON.parse(call.metadata) : undefined,
  }))
}

export async function getCallStats(): Promise<{
  totalCalls: number
  completedCalls: number
  failedCalls: number
  totalDuration: number
  totalCost: number
  averageDuration: number
  averageCost: number
}> {
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

  return {
    totalCalls,
    completedCalls,
    failedCalls,
    totalDuration: aggregates._sum.duration || 0,
    totalCost: aggregates._sum.cost || 0,
    averageDuration: aggregates._avg.duration || 0,
    averageCost: aggregates._avg.cost || 0,
  }
}

export async function getAssistantStats(): Promise<{
  totalAssistants: number
  activeAssistants: number
  mostUsedAssistant: Assistant | null
}> {
  const [totalAssistants, activeAssistants, mostUsedAssistant] = await Promise.all([
    prisma.assistant.count(),
    prisma.assistant.count({ where: { isActive: true } }),
    prisma.assistant.findFirst({
      orderBy: { usageCount: 'desc' },
      where: { usageCount: { gt: 0 } },
    }),
  ])

  return {
    totalAssistants,
    activeAssistants,
    mostUsedAssistant,
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}
