import { createAssistantWithSystemPrompt } from '@/lib/assistants'
import { getAssistants } from '@/lib/database'
import type {
  ApiResponse,
  Assistant,
  AssistantFilters,
  AssistantFormData,
  PaginatedResponse,
} from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/assistants - Retrieve all assistants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const isActiveStr = searchParams.get('isActive')
    const language = searchParams.get('language') || undefined
    const model = searchParams.get('model') || undefined
    const tagsStr = searchParams.get('tags')

    // Parse boolean and array parameters
    const isActive = isActiveStr ? isActiveStr === 'true' : undefined
    const tags = tagsStr
      ? tagsStr.split(',').filter(tag => tag.trim())
      : undefined

    const filters: AssistantFilters = {
      page,
      limit,
      isActive,
      language,
      model,
      tags,
    }

    const result = await getAssistants(filters)
    const totalPages = Math.ceil(result.total / limit)

    const paginatedResponse: PaginatedResponse<Assistant> = {
      data: result.assistants,
      page,
      limit,
      total: result.total,
      totalPages,
    }

    const response: ApiResponse<PaginatedResponse<Assistant>> = {
      success: true,
      data: paginatedResponse,
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
    const body = (await request.json()) as AssistantFormData

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
