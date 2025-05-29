import { getCall, updateCall } from '@/lib/database'
import { vapi } from '@/lib/vapi'
import { CallStatus } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

type Context = {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const { id } = context.params

    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid call ID provided',
        },
        { status: 400 }
      )
    }

    // Get call from database
    const call = await getCall(id)

    if (!call) {
      return NextResponse.json(
        {
          success: false,
          error: 'Call not found',
        },
        { status: 404 }
      )
    }

    // If call is active and has a Vapi call ID, fetch live status
    const isActiveCall = [
      'creating',
      'dialing',
      'ringing',
      'in-progress',
    ].includes(call.status)

    if (isActiveCall && call.vapiCallId) {
      try {
        const vapiCall = await vapi.getCall(call.vapiCallId)

        if (vapiCall) {
          // Map Vapi status to our CallStatus enum
          const statusMapping: Record<string, CallStatus> = {
            queued: 'creating',
            ringing: 'ringing',
            'in-progress': 'in-progress',
            forwarding: 'in-progress',
            ended: 'completed',
            busy: 'failed',
            'no-answer': 'failed',
            failed: 'failed',
            cancelled: 'cancelled',
          }

          const mappedStatus = statusMapping[vapiCall.status] || call.status

          // Update local database if status changed
          if (mappedStatus !== call.status) {
            const updateData: Partial<typeof call> = {
              status: mappedStatus,
            }

            // Update timestamps based on status
            if (mappedStatus === 'in-progress' && !call.startedAt) {
              updateData.startedAt = vapiCall.startedAt
                ? new Date(vapiCall.startedAt)
                : new Date()
            } else if (
              ['completed', 'failed', 'cancelled'].includes(mappedStatus) &&
              !call.endedAt
            ) {
              updateData.endedAt = vapiCall.endedAt
                ? new Date(vapiCall.endedAt)
                : new Date()

              // Calculate duration from timestamps
              if (vapiCall.startedAt && vapiCall.endedAt) {
                const startTime = new Date(vapiCall.startedAt).getTime()
                const endTime = new Date(vapiCall.endedAt).getTime()
                updateData.duration = Math.floor((endTime - startTime) / 1000) // Duration in seconds
              }

              updateData.cost = vapiCall.cost || 0
            }

            const updatedCall = await updateCall(id, updateData)

            return NextResponse.json({
              success: true,
              data: updatedCall,
              source: 'vapi-sync',
            })
          }
        }
      } catch (vapiError) {
        console.warn('Failed to fetch Vapi call status:', vapiError)
        // Continue with local call data
      }
    }

    return NextResponse.json({
      success: true,
      data: call,
      source: 'database',
    })
  } catch (error) {
    console.error('Error fetching call:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch call',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  try {
    const { id } = context.params

    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid call ID provided',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      )
    }

    // Check if call exists
    const existingCall = await getCall(id)
    if (!existingCall) {
      return NextResponse.json(
        {
          success: false,
          error: 'Call not found',
        },
        { status: 404 }
      )
    }

    // Filter allowed update fields for security
    const allowedFields = ['status', 'duration', 'cost', 'endedAt', 'startedAt']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Validate status if provided
    if (updateData.status) {
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
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid call status',
          },
          { status: 400 }
        )
      }
    }

    // Convert date strings to Date objects
    if (updateData.startedAt && typeof updateData.startedAt === 'string') {
      updateData.startedAt = new Date(updateData.startedAt)
    }
    if (updateData.endedAt && typeof updateData.endedAt === 'string') {
      updateData.endedAt = new Date(updateData.endedAt)
    }

    // Update the call
    const updatedCall = await updateCall(id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedCall,
      message: 'Call updated successfully',
    })
  } catch (error) {
    console.error('Error updating call:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update call',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
