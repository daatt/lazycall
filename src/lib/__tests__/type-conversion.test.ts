// Unit tests for type conversion functions
// Tests type safety and conversion accuracy without database dependencies

import {
  Assistant,
  Call,
  CallStatus,
  CreateAssistantData,
  CreateCallData,
  PrismaAssistant,
  PrismaCall,
  PrismaSettings,
  PrismaTranscript,
  Settings,
  Transcript,
  TranscriptProcessingStatus,
  UpdateCallData,
  UpdateTranscriptData,
} from '@/types'
import { describe, expect, it } from '@jest/globals'

// Mock type conversion functions (extracted from database.ts for testing)
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

function parseMetadata(
  metadata: string | null
): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  try {
    return JSON.parse(metadata)
  } catch (error) {
    console.warn('Failed to parse metadata JSON:', error)
    return undefined
  }
}

function stringifyMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null
  try {
    return JSON.stringify(metadata)
  } catch (error) {
    console.warn('Failed to stringify metadata:', error)
    return null
  }
}

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

function stringifyTags(tags: string[] | undefined): string | null {
  if (!tags || !Array.isArray(tags)) return null
  try {
    return JSON.stringify(tags)
  } catch (error) {
    console.warn('Failed to stringify tags:', error)
    return null
  }
}

function castToCallStatus(status: string): CallStatus {
  const validStatuses: CallStatus[] = [
    'idle',
    'creating',
    'dialing',
    'ringing',
    'in-progress',
    'completed',
    'failed',
    'cancelled',
  ]

  if (validStatuses.includes(status as CallStatus)) {
    return status as CallStatus
  }

  console.warn(`Invalid call status: ${status}, defaulting to 'idle'`)
  return 'idle'
}

function castToProcessingStatus(status: string): TranscriptProcessingStatus {
  const validStatuses: TranscriptProcessingStatus[] = [
    'pending',
    'processing',
    'completed',
    'failed',
  ]

  if (validStatuses.includes(status as TranscriptProcessingStatus)) {
    return status as TranscriptProcessingStatus
  }

  console.warn(`Invalid processing status: ${status}, defaulting to 'pending'`)
  return 'pending'
}

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
  }
}

function convertPrismaTranscriptToTranscript(
  prismaTranscript: PrismaTranscript
): Transcript {
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
  }
}

function convertPrismaAssistantToAssistant(
  prismaAssistant: PrismaAssistant
): Assistant {
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
  }
}

function convertPrismaSettingsToSettings(
  prismaSettings: PrismaSettings
): Settings {
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

describe('Type Conversion Functions', () => {
  // =============================================================================
  // NULL/UNDEFINED CONVERSION TESTS
  // =============================================================================

  describe('Null/Undefined Conversion', () => {
    it('should convert null to undefined', () => {
      expect(nullToUndefined(null)).toBeUndefined()
      expect(nullToUndefined('test')).toBe('test')
      expect(nullToUndefined(123)).toBe(123)
      expect(nullToUndefined(false)).toBe(false)
    })

    it('should convert undefined to null', () => {
      expect(undefinedToNull(undefined)).toBeNull()
      expect(undefinedToNull('test')).toBe('test')
      expect(undefinedToNull(123)).toBe(123)
      expect(undefinedToNull(false)).toBe(false)
    })
  })

  // =============================================================================
  // JSON CONVERSION TESTS
  // =============================================================================

  describe('JSON Conversion', () => {
    it('should parse valid JSON metadata', () => {
      const metadata = { test: true, value: 123 }
      const jsonString = JSON.stringify(metadata)

      expect(parseMetadata(jsonString)).toEqual(metadata)
      expect(parseMetadata(null)).toBeUndefined()
      expect(parseMetadata('')).toBeUndefined()
    })

    it('should handle invalid JSON gracefully', () => {
      expect(parseMetadata('invalid-json')).toBeUndefined()
      expect(parseMetadata('{')).toBeUndefined()
      expect(parseMetadata('undefined')).toBeUndefined()
    })

    it('should stringify metadata correctly', () => {
      const metadata = { test: true, value: 123 }
      const expected = JSON.stringify(metadata)

      expect(stringifyMetadata(metadata)).toBe(expected)
      expect(stringifyMetadata(undefined)).toBeNull()
      expect(stringifyMetadata({})).toBe('{}')
    })

    it('should parse valid tags array', () => {
      const tags = ['tag1', 'tag2', 'tag3']
      const jsonString = JSON.stringify(tags)

      expect(parseTags(jsonString)).toEqual(tags)
      expect(parseTags(null)).toBeUndefined()
      expect(parseTags('')).toBeUndefined()
    })

    it('should handle invalid tags gracefully', () => {
      expect(parseTags('invalid-json')).toBeUndefined()
      expect(parseTags('{"not": "array"}')).toBeUndefined()
      expect(parseTags('null')).toBeUndefined()
    })

    it('should stringify tags correctly', () => {
      const tags = ['tag1', 'tag2', 'tag3']
      const expected = JSON.stringify(tags)

      expect(stringifyTags(tags)).toBe(expected)
      expect(stringifyTags(undefined)).toBeNull()
      expect(stringifyTags([])).toBe('[]')
    })
  })

  // =============================================================================
  // ENUM VALIDATION TESTS
  // =============================================================================

  describe('Enum Validation', () => {
    it('should validate call status correctly', () => {
      expect(castToCallStatus('idle')).toBe('idle')
      expect(castToCallStatus('completed')).toBe('completed')
      expect(castToCallStatus('failed')).toBe('failed')
      expect(castToCallStatus('invalid-status')).toBe('idle') // Default
    })

    it('should validate processing status correctly', () => {
      expect(castToProcessingStatus('pending')).toBe('pending')
      expect(castToProcessingStatus('completed')).toBe('completed')
      expect(castToProcessingStatus('failed')).toBe('failed')
      expect(castToProcessingStatus('invalid-status')).toBe('pending') // Default
    })
  })

  // =============================================================================
  // PRISMA TO APPLICATION TYPE CONVERSION TESTS
  // =============================================================================

  describe('Prisma to Application Type Conversion', () => {
    it('should convert PrismaCall to Call correctly', () => {
      const prismaCall: PrismaCall = {
        id: 'call-123',
        phoneNumber: '+1234567890',
        status: 'completed',
        assistantId: 'assistant-123',
        vapiCallId: 'vapi-123',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:05:00Z'),
        duration: 300,
        cost: 2.5,
        metadata: JSON.stringify({ purpose: 'test' }),
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T10:05:00Z'),
      }

      const call = convertPrismaCallToCall(prismaCall)

      expect(call.id).toBe(prismaCall.id)
      expect(call.phoneNumber).toBe(prismaCall.phoneNumber)
      expect(call.status).toBe('completed')
      expect(call.assistantId).toBe(prismaCall.assistantId)
      expect(call.vapiCallId).toBe(prismaCall.vapiCallId)
      expect(call.startedAt).toEqual(prismaCall.startedAt)
      expect(call.endedAt).toEqual(prismaCall.endedAt)
      expect(call.duration).toBe(prismaCall.duration)
      expect(call.cost).toBe(prismaCall.cost)
      expect(call.metadata).toEqual({ purpose: 'test' })
      expect(call.createdAt).toEqual(prismaCall.createdAt)
      expect(call.updatedAt).toEqual(prismaCall.updatedAt)
    })

    it('should handle null values in PrismaCall', () => {
      const prismaCall: PrismaCall = {
        id: 'call-123',
        phoneNumber: '+1234567890',
        status: 'idle',
        assistantId: null,
        vapiCallId: null,
        startedAt: null,
        endedAt: null,
        duration: null,
        cost: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const call = convertPrismaCallToCall(prismaCall)

      expect(call.assistantId).toBeUndefined()
      expect(call.vapiCallId).toBeUndefined()
      expect(call.startedAt).toBeUndefined()
      expect(call.endedAt).toBeUndefined()
      expect(call.duration).toBeUndefined()
      expect(call.cost).toBeUndefined()
      expect(call.metadata).toBeUndefined()
    })

    it('should convert PrismaTranscript to Transcript correctly', () => {
      const prismaTranscript: PrismaTranscript = {
        id: 'transcript-123',
        callId: 'call-123',
        content: 'Test transcript content',
        summary: 'Test summary',
        analysis: 'Test analysis',
        processingStatus: 'completed',
        wordCount: 3,
        confidence: 0.95,
        language: 'en',
        metadata: JSON.stringify({ model: 'whisper-1' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const transcript = convertPrismaTranscriptToTranscript(prismaTranscript)

      expect(transcript.id).toBe(prismaTranscript.id)
      expect(transcript.callId).toBe(prismaTranscript.callId)
      expect(transcript.content).toBe(prismaTranscript.content)
      expect(transcript.summary).toBe(prismaTranscript.summary)
      expect(transcript.analysis).toBe(prismaTranscript.analysis)
      expect(transcript.processingStatus).toBe('completed')
      expect(transcript.wordCount).toBe(prismaTranscript.wordCount)
      expect(transcript.confidence).toBe(prismaTranscript.confidence)
      expect(transcript.language).toBe(prismaTranscript.language)
      expect(transcript.metadata).toEqual({ model: 'whisper-1' })
    })

    it('should convert PrismaAssistant to Assistant correctly', () => {
      const prismaAssistant: PrismaAssistant = {
        id: 'assistant-123',
        name: 'Test Assistant',
        systemPrompt: 'Test prompt',
        vapiAssistantId: 'vapi-assistant-123',
        isActive: true,
        voice: 'alloy',
        language: 'en',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        description: 'Test description',
        tags: JSON.stringify(['test', 'assistant']),
        usageCount: 5,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const assistant = convertPrismaAssistantToAssistant(prismaAssistant)

      expect(assistant.id).toBe(prismaAssistant.id)
      expect(assistant.name).toBe(prismaAssistant.name)
      expect(assistant.systemPrompt).toBe(prismaAssistant.systemPrompt)
      expect(assistant.vapiAssistantId).toBe(prismaAssistant.vapiAssistantId)
      expect(assistant.isActive).toBe(prismaAssistant.isActive)
      expect(assistant.voice).toBe(prismaAssistant.voice)
      expect(assistant.language).toBe(prismaAssistant.language)
      expect(assistant.model).toBe(prismaAssistant.model)
      expect(assistant.temperature).toBe(prismaAssistant.temperature)
      expect(assistant.maxTokens).toBe(prismaAssistant.maxTokens)
      expect(assistant.description).toBe(prismaAssistant.description)
      expect(assistant.tags).toEqual(['test', 'assistant'])
      expect(assistant.usageCount).toBe(prismaAssistant.usageCount)
      expect(assistant.lastUsedAt).toEqual(prismaAssistant.lastUsedAt)
    })

    it('should convert PrismaSettings to Settings correctly', () => {
      const prismaSettings: PrismaSettings = {
        id: 'settings-123',
        systemPrompt: 'Test system prompt',
        defaultAssistantId: 'assistant-123',
        openaiApiKey: 'openai-key',
        vapiApiKey: 'vapi-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const settings = convertPrismaSettingsToSettings(prismaSettings)

      expect(settings.id).toBe(prismaSettings.id)
      expect(settings.systemPrompt).toBe(prismaSettings.systemPrompt)
      expect(settings.defaultAssistantId).toBe(
        prismaSettings.defaultAssistantId
      )
      expect(settings.openaiApiKey).toBe(prismaSettings.openaiApiKey)
      expect(settings.vapiApiKey).toBe(prismaSettings.vapiApiKey)
      expect(settings.createdAt).toEqual(prismaSettings.createdAt)
      expect(settings.updatedAt).toEqual(prismaSettings.updatedAt)
    })
  })

  // =============================================================================
  // TYPE SAFETY TESTS
  // =============================================================================

  describe('Type Safety', () => {
    it('should maintain type safety for CreateCallData', () => {
      const callData: CreateCallData = {
        phoneNumber: '+1234567890',
        status: 'idle',
        assistantId: 'assistant-123',
        metadata: { purpose: 'test' },
      }

      expect(callData.phoneNumber).toBe('+1234567890')
      expect(callData.status).toBe('idle')
      expect(callData.assistantId).toBe('assistant-123')
      expect(callData.metadata).toEqual({ purpose: 'test' })

      // Optional fields should be undefined, not null
      expect(callData.vapiCallId).toBeUndefined()
      expect(callData.startedAt).toBeUndefined()
      expect(callData.endedAt).toBeUndefined()
      expect(callData.duration).toBeUndefined()
      expect(callData.cost).toBeUndefined()
    })

    it('should maintain type safety for CreateAssistantData', () => {
      const assistantData: CreateAssistantData = {
        name: 'Test Assistant',
        systemPrompt: 'Test prompt',
        isActive: true,
        language: 'en',
        model: 'gpt-4',
        voice: 'alloy',
        temperature: 0.7,
        tags: ['test', 'assistant'],
      }

      expect(assistantData.name).toBe('Test Assistant')
      expect(assistantData.systemPrompt).toBe('Test prompt')
      expect(assistantData.isActive).toBe(true)
      expect(assistantData.language).toBe('en')
      expect(assistantData.model).toBe('gpt-4')
      expect(assistantData.voice).toBe('alloy')
      expect(assistantData.temperature).toBe(0.7)
      expect(assistantData.tags).toEqual(['test', 'assistant'])

      // Optional fields should be undefined, not null
      expect(assistantData.vapiAssistantId).toBeUndefined()
      expect(assistantData.maxTokens).toBeUndefined()
      expect(assistantData.description).toBeUndefined()
    })

    it('should maintain type safety for UpdateCallData', () => {
      const updateData: UpdateCallData = {
        status: 'completed',
        duration: 300,
        cost: 2.5,
      }

      expect(updateData.status).toBe('completed')
      expect(updateData.duration).toBe(300)
      expect(updateData.cost).toBe(2.5)

      // Fields not provided should be undefined
      expect(updateData.phoneNumber).toBeUndefined()
      expect(updateData.assistantId).toBeUndefined()
      expect(updateData.vapiCallId).toBeUndefined()
    })

    it('should maintain type safety for UpdateTranscriptData', () => {
      const updateData: UpdateTranscriptData = {
        processingStatus: 'completed',
        confidence: 0.95,
        metadata: { model: 'whisper-1' },
      }

      expect(updateData.processingStatus).toBe('completed')
      expect(updateData.confidence).toBe(0.95)
      expect(updateData.metadata).toEqual({ model: 'whisper-1' })

      // Fields not provided should be undefined
      expect(updateData.content).toBeUndefined()
      expect(updateData.summary).toBeUndefined()
      expect(updateData.analysis).toBeUndefined()
    })
  })

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const prismaCall: PrismaCall = {
        id: 'call-123',
        phoneNumber: '+1234567890',
        status: 'idle',
        assistantId: null,
        vapiCallId: null,
        startedAt: null,
        endedAt: null,
        duration: null,
        cost: null,
        metadata: 'invalid-json-string',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const call = convertPrismaCallToCall(prismaCall)
      expect(call.metadata).toBeUndefined()
    })

    it('should handle invalid enum values gracefully', () => {
      const prismaCall: PrismaCall = {
        id: 'call-123',
        phoneNumber: '+1234567890',
        status: 'invalid-status',
        assistantId: null,
        vapiCallId: null,
        startedAt: null,
        endedAt: null,
        duration: null,
        cost: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const call = convertPrismaCallToCall(prismaCall)
      expect(call.status).toBe('idle') // Should default to 'idle'
    })

    it('should handle circular references in metadata gracefully', () => {
      const circularObj: any = { test: true }
      circularObj.self = circularObj

      expect(stringifyMetadata(circularObj)).toBeNull()
    })
  })
})
