import { createAssistantWithSystemPrompt } from '@/lib/assistants'
import type { AssistantFormData } from '@/types'
import { ApiResponse, Assistant } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/assistants - Retrieve all assistants
export async function GET(_request: NextRequest) {
  try {
    // TODO: Implement assistants retrieval
    // This will be implemented in task 4.6

    const response: ApiResponse<Assistant[]> = {
      success: true,
      data: [],
      message: 'Assistants retrieved successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error retrieving assistants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve assistants' },
      { status: 500 }
    )
  }
}

// POST /api/assistants - Create a new assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AssistantFormData

    // Validate required fields
    if (!body.name || !body.systemPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and system prompt are required',
        },
        { status: 400 }
      )
    }

    // Create the assistant with system prompt integration
    const assistant = await createAssistantWithSystemPrompt({
      name: body.name,
      systemPrompt: body.systemPrompt,
      voice: body.voice,
      language: body.language || 'en',
      model: body.model || 'gpt-4',
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      description: body.description,
      tags: body.tags,
      isActive: true,
    })

    const response: ApiResponse<Assistant> = {
      success: true,
      data: assistant,
      message: 'Assistant created successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating assistant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assistant' },
      { status: 500 }
    )
  }
}
