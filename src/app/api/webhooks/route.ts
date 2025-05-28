import { updateCallStatus } from '@/lib/calls'
import { createTranscript, getCallByVapiId } from '@/lib/database'
import { Call, CreateTranscriptData, VapiWebhookPayload, WebhookEventType } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks - Handle Vapi webhook events
export async function POST(request: NextRequest) {
  try {
    const payload: VapiWebhookPayload = await request.json()
    const { message } = payload

    // Validate webhook payload
    if (!message || !message.type || !message.timestamp) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Process different event types
    switch (message.type as WebhookEventType) {
      case 'call.started':
        await handleCallStarted(message)
        break
      case 'call.ended':
        await handleCallEnded(message)
        break
      case 'call.failed':
        await handleCallFailed(message)
        break
      case 'transcript.ready':
        await handleTranscriptReady(message)
        break
      default:
        console.warn('Unhandled event type:', message.type)
        
        // Handle call status updates that might come as different event types
        if (message.call?.id && message.call?.status) {
          await handleCallStatusUpdate(message)
        }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
  })
}

// Helper functions for handling different event types
async function handleCallStarted(message: VapiWebhookPayload['message']) {
  if (!message.call?.id) {
    throw new Error('Missing call ID in webhook payload')
  }

  // Find our database call by Vapi call ID
  const call = await getCallByVapiId(message.call.id)
  if (!call) {
    console.warn(`Call not found in database for Vapi ID: ${message.call.id}`)
    return
  }

  await updateCallStatus(call.id, 'in-progress', {
    startedAt: message.call.startedAt,
  })
}

async function handleCallEnded(message: VapiWebhookPayload['message']) {
  if (!message.call?.id) {
    throw new Error('Missing call ID in webhook payload')
  }

  // Find our database call by Vapi call ID
  const call = await getCallByVapiId(message.call.id)
  if (!call) {
    console.warn(`Call not found in database for Vapi ID: ${message.call.id}`)
    return
  }

  await updateCallStatus(call.id, 'completed', {
    endedAt: message.call.endedAt,
    cost: message.call.cost,
  })
}

async function handleCallFailed(message: VapiWebhookPayload['message']) {
  if (!message.call?.id) {
    throw new Error('Missing call ID in webhook payload')
  }

  // Find our database call by Vapi call ID
  const call = await getCallByVapiId(message.call.id)
  if (!call) {
    console.warn(`Call not found in database for Vapi ID: ${message.call.id}`)
    return
  }

  await updateCallStatus(call.id, 'failed', {
    endedAt: message.call.endedAt,
  })
}

async function handleTranscriptReady(message: VapiWebhookPayload['message']) {
  if (!message.call?.id || !message.call.transcript) {
    throw new Error('Missing call ID or transcript in webhook payload')
  }

  // Find our database call by Vapi call ID
  const call = await getCallByVapiId(message.call.id)
  if (!call) {
    console.warn(`Call not found in database for Vapi ID: ${message.call.id}`)
    return
  }

  // Create transcript record
  const transcriptData: CreateTranscriptData = {
    callId: call.id, // Use our database call ID
    content: message.call.transcript,
  }

  await createTranscript(transcriptData)
}

async function handleCallStatusUpdate(message: VapiWebhookPayload['message']) {
  if (!message.call?.id || !message.call.status) {
    console.warn('Missing call ID or status in webhook payload')
    return
  }

  // Find our database call by Vapi call ID
  const call = await getCallByVapiId(message.call.id)
  if (!call) {
    console.warn(`Call not found in database for Vapi ID: ${message.call.id}`)
    return
  }

  // Map Vapi status to our database status
  let dbStatus: Call['status']
  switch (message.call.status.toLowerCase()) {
    case 'completed':
    case 'ended':
      dbStatus = 'completed'
      break
    case 'failed':
      dbStatus = 'failed'
      break
    case 'in-progress':
    case 'ongoing':
      dbStatus = 'in-progress'
      break
    case 'ringing':
      dbStatus = 'ringing'
      break
    case 'dialing':
      dbStatus = 'dialing'
      break
    default:
      console.warn(`Unknown call status from Vapi: ${message.call.status}`)
      return
  }

  // Update call status with any additional metadata
  const metadata: Record<string, unknown> = {}
  if (message.call.startedAt) metadata.startedAt = message.call.startedAt
  if (message.call.endedAt) metadata.endedAt = message.call.endedAt
  if (message.call.cost) metadata.cost = message.call.cost

  await updateCallStatus(call.id, dbStatus, metadata)
}
