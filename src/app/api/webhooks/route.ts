import { updateCallStatus } from '@/lib/calls'
import { createTranscript } from '@/lib/database'
import { CreateTranscriptData, VapiWebhookPayload, WebhookEventType } from '@/types'
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

  await updateCallStatus(message.call.id, 'in-progress', {
    startedAt: message.call.startedAt,
  })
}

async function handleCallEnded(message: VapiWebhookPayload['message']) {
  if (!message.call?.id) {
    throw new Error('Missing call ID in webhook payload')
  }

  await updateCallStatus(message.call.id, 'completed', {
    endedAt: message.call.endedAt,
    cost: message.call.cost,
  })
}

async function handleCallFailed(message: VapiWebhookPayload['message']) {
  if (!message.call?.id) {
    throw new Error('Missing call ID in webhook payload')
  }

  await updateCallStatus(message.call.id, 'failed', {
    endedAt: message.call.endedAt,
  })
}

async function handleTranscriptReady(message: VapiWebhookPayload['message']) {
  if (!message.call?.id || !message.call.transcript) {
    throw new Error('Missing call ID or transcript in webhook payload')
  }

  // Create transcript record
  const transcriptData: CreateTranscriptData = {
    callId: message.call.id,
    content: message.call.transcript,
  }

  await createTranscript(transcriptData)
}
