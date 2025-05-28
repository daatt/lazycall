import type { Assistant, CreateAssistantData } from '../types'
import {
    createAssistant as createDbAssistant,
    getAssistant as getDbAssistant,
    updateAssistant as updateDbAssistant,
} from './database'
import { vapi } from './vapi'

/**
 * Creates a new assistant with both Vapi API and database integration
 */
export async function createAssistantWithSystemPrompt(
  data: CreateAssistantData
): Promise<Assistant> {
  try {
    // 1. Create the assistant in Vapi API
    const vapiAssistant = await vapi.createAssistant({
      name: data.name,
      model: {
        provider: 'openai',
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        messages: [
          {
            role: 'system',
            content: data.systemPrompt,
          },
        ],
      },
      voice: data.voice
        ? {
            provider: 'azure',
            voiceId: data.voice,
          }
        : undefined,
      transcriber: {
        provider: 'deepgram',
        language: data.language,
      },
      metadata: {
        description: data.description,
        tags: data.tags,
      },
    })

    // 2. Create the assistant in our database
    const assistant = await createDbAssistant({
      ...data,
      vapiAssistantId: vapiAssistant.id,
    })

    return assistant
  } catch (error) {
    console.error('Failed to create assistant:', error)
    throw new Error('Failed to create assistant')
  }
}

/**
 * Updates an existing assistant with new system prompt
 */
export async function updateAssistantSystemPrompt(
  assistantId: string,
  systemPrompt: string
): Promise<Assistant> {
  try {
    // 1. Get the current assistant from database
    const assistant = await getAssistant(assistantId)
    if (!assistant.vapiAssistantId) {
      throw new Error('Assistant not found in Vapi')
    }

    // 2. Update the assistant in Vapi API
    await vapi.updateAssistant(assistant.vapiAssistantId, {
      model: {
        provider: 'openai',
        model: assistant.model,
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
    })

    // 3. Update the assistant in our database
    const updatedAssistant = await updateDbAssistant(assistantId, {
      systemPrompt,
    })

    return updatedAssistant
  } catch (error) {
    console.error('Failed to update assistant system prompt:', error)
    throw new Error('Failed to update assistant system prompt')
  }
}

/**
 * Gets an assistant by ID
 */
export async function getAssistant(assistantId: string): Promise<Assistant> {
  try {
    const assistant = await getDbAssistant(assistantId)
    if (!assistant) {
      throw new Error('Assistant not found')
    }
    return assistant
  } catch (error) {
    console.error('Failed to get assistant:', error)
    throw new Error('Failed to get assistant')
  }
} 