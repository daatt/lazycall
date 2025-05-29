import {
  createAssistantWithSystemPrompt,
  updateAssistantSystemPrompt,
} from '../assistants'
import * as database from '../database'
import { vapi } from '../vapi'

// Mock dependencies
jest.mock('../vapi')
jest.mock('../database')

describe('Assistant Creation', () => {
  const mockVapiAssistant = {
    id: 'vapi-assistant-123',
    name: 'Test Assistant',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockDbAssistant = {
    id: 'db-assistant-123',
    name: 'Test Assistant',
    systemPrompt: 'Test system prompt',
    vapiAssistantId: 'vapi-assistant-123',
    isActive: true,
    language: 'en',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(vapi.createAssistant as jest.Mock).mockResolvedValue(mockVapiAssistant)
    ;(database.createAssistant as jest.Mock).mockResolvedValue(mockDbAssistant)
  })

  it('should create assistant with system prompt', async () => {
    const assistantData = {
      name: 'Test Assistant',
      systemPrompt: 'Test system prompt',
      language: 'en',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      description: 'Test description',
      tags: ['test', 'assistant'],
      isActive: true,
    }

    const result = await createAssistantWithSystemPrompt(assistantData)

    // Verify Vapi API call
    expect(vapi.createAssistant).toHaveBeenCalledWith({
      name: assistantData.name,
      model: {
        provider: 'openai',
        model: assistantData.model,
        temperature: assistantData.temperature,
        maxTokens: assistantData.maxTokens,
        messages: [
          {
            role: 'system',
            content: assistantData.systemPrompt,
          },
        ],
      },
      transcriber: {
        provider: 'deepgram',
        language: assistantData.language,
      },
      metadata: {
        description: assistantData.description,
        tags: assistantData.tags,
      },
    })

    // Verify database call
    expect(database.createAssistant).toHaveBeenCalledWith({
      ...assistantData,
      vapiAssistantId: mockVapiAssistant.id,
    })

    // Verify result
    expect(result).toEqual(mockDbAssistant)
  })

  it('should handle errors during creation', async () => {
    const error = new Error('API error')
    ;(vapi.createAssistant as jest.Mock).mockRejectedValue(error)

    await expect(
      createAssistantWithSystemPrompt({
        name: 'Test Assistant',
        systemPrompt: 'Test system prompt',
        language: 'en',
        model: 'gpt-4',
        isActive: true,
      })
    ).rejects.toThrow('Failed to create assistant')
  })

  it('should update assistant system prompt', async () => {
    const newSystemPrompt = 'Updated system prompt'
    ;(database.getAssistant as jest.Mock).mockResolvedValue(mockDbAssistant)
    ;(vapi.updateAssistant as jest.Mock).mockResolvedValue({
      ...mockVapiAssistant,
      name: 'Updated Assistant',
    })
    ;(database.updateAssistant as jest.Mock).mockResolvedValue({
      ...mockDbAssistant,
      systemPrompt: newSystemPrompt,
    })

    const result = await updateAssistantSystemPrompt(
      mockDbAssistant.id,
      newSystemPrompt
    )

    // Verify Vapi API call
    expect(vapi.updateAssistant).toHaveBeenCalledWith(
      mockDbAssistant.vapiAssistantId,
      {
        model: {
          provider: 'openai',
          model: mockDbAssistant.model,
          temperature: mockDbAssistant.temperature,
          maxTokens: mockDbAssistant.maxTokens,
          messages: [
            {
              role: 'system',
              content: newSystemPrompt,
            },
          ],
        },
      }
    )

    // Verify database call
    expect(database.updateAssistant).toHaveBeenCalledWith(mockDbAssistant.id, {
      systemPrompt: newSystemPrompt,
    })

    // Verify result
    expect(result.systemPrompt).toBe(newSystemPrompt)
  })
})
