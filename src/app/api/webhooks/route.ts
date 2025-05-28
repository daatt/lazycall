import { VapiCallEvent } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks - Handle Vapi webhook events
export async function POST(request: NextRequest) {
  try {
    const event: VapiCallEvent = await request.json()

    // TODO: Implement webhook event processing
    // This will be implemented in task 3.4

    console.warn('Received Vapi webhook event:', event)

    // Process different event types
    switch (event.type) {
      case 'call-started':
        // TODO: Update call status to 'in-progress'
        break
      case 'call-ended':
        // TODO: Update call status to 'completed' and fetch transcript
        break
      case 'call-failed':
        // TODO: Update call status to 'failed'
        break
      default:
        console.warn('Unhandled event type:', event.type)
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
