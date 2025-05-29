import { createOutboundCall } from '@/lib/calls'
import { getCalls, searchCalls } from '@/lib/database'
import {
  ApiResponse,
  Call,
  CallFormData,
  CallHistoryFilters,
  PaginatedResponse,
} from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/calls - Retrieve call history with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const status = searchParams.get('status') || undefined
    const assistantId = searchParams.get('assistantId') || undefined
    const phoneNumber = searchParams.get('phoneNumber') || undefined
    const query = searchParams.get('q') || undefined
    const dateFromStr = searchParams.get('dateFrom')
    const dateToStr = searchParams.get('dateTo')

    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined
    const dateTo = dateToStr ? new Date(dateToStr) : undefined

    let calls: Call[]
    let total: number

    // If there's a search query, use search function
    if (query) {
      calls = await searchCalls(query, limit)
      total = calls.length // For search, we just return the results count
    } else {
      // Use filtered retrieval
      const filters: CallHistoryFilters = {
        page,
        limit,
        status: status as any,
        assistantId,
        phoneNumber,
        dateFrom,
        dateTo,
      }

      const result = await getCalls(filters)
      calls = result.calls
      total = result.total
    }

    const totalPages = Math.ceil(total / limit)

    const paginatedResponse: PaginatedResponse<Call> = {
      data: calls,
      page,
      limit,
      total,
      totalPages,
    }

    const response: ApiResponse<PaginatedResponse<Call>> = {
      success: true,
      data: paginatedResponse,
      message: 'Call history retrieved successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error retrieving calls:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve calls' },
      { status: 500 }
    )
  }
}

// POST /api/calls - Create a new outbound call
export async function POST(request: NextRequest) {
  try {
    const body: CallFormData = await request.json()

    // Validate required fields
    if (!body.phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!body.customPrompt && !body.assistantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either a custom prompt or assistant ID is required',
        },
        { status: 400 }
      )
    }

    // Create the call using the library function
    const call = await createOutboundCall({
      phoneNumber: body.phoneNumber,
      assistantId: body.assistantId,
      customPrompt: body.customPrompt,
    })

    const response: ApiResponse<Call> = {
      success: true,
      data: call,
      message: 'Call created successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create call' },
      { status: 500 }
    )
  }
}
