import type { Call, CallFormData } from '../types'
import {
  createCall as createDbCall,
  getAssistant,
  getCall,
  updateCall,
} from './database'
import { retrieveCallTranscript } from './transcripts'
import { vapi } from './vapi'

/**
 * Gets the first available phone number from the Vapi account
 */
async function getFirstAvailablePhoneNumber(): Promise<string | undefined> {
  try {
    const phoneNumbers = await vapi.listPhoneNumbers()
    if (phoneNumbers && phoneNumbers.length > 0) {
      return phoneNumbers[0].id
    }
    return undefined
  } catch (error) {
    console.error('Failed to list phone numbers:', error)
    return undefined
  }
}

/**
 * Creates a new outbound call with customer details
 */
export async function createOutboundCall(
  data: CallFormData & { phoneNumberId?: string }
): Promise<Call> {
  try {
    // 1. Get assistant details if specified
    let vapiAssistantId: string | undefined

    if (data.assistantId) {
      const assistant = await getAssistant(data.assistantId)
      if (!assistant) {
        throw new Error('Assistant not found')
      }
      vapiAssistantId = assistant.vapiAssistantId
    }

    // 2. Get phone number ID if not provided
    let phoneNumberId = data.phoneNumberId
    if (!phoneNumberId) {
      // Try to get the first available phone number
      phoneNumberId = await getFirstAvailablePhoneNumber()
      if (!phoneNumberId) {
        throw new Error(
          'No phone number available. Please configure a phone number in your Vapi account.'
        )
      }
      console.log(`Using phone number ID: ${phoneNumberId}`)
    }

    // 3. Create the call in Vapi API
    const vapiCall = await vapi.createCall({
      customer: {
        number: data.phoneNumber,
      },
      phoneNumberId,
      assistantId: vapiAssistantId,
      name: `Call to ${data.phoneNumber}`,
      metadata: {
        customPrompt: data.customPrompt,
      },
    })

    // 4. Create the call in our database
    const call = await createDbCall({
      phoneNumber: data.phoneNumber,
      status: 'creating',
      assistantId: data.assistantId,
      vapiCallId: vapiCall.id,
      metadata: {
        customPrompt: data.customPrompt,
        vapiCallId: vapiCall.id,
        phoneNumberId,
      },
    })

    return call
  } catch (error) {
    console.error('Failed to create outbound call:', error)
    throw new Error('Failed to create outbound call')
  }
}

/**
 * Gets a call by ID
 */
export async function getCallById(callId: string): Promise<Call> {
  try {
    const call = await getCall(callId)
    if (!call) {
      throw new Error('Call not found')
    }
    return call
  } catch (error) {
    console.error('Failed to get call:', error)
    throw new Error('Failed to get call')
  }
}

/**
 * Updates a call's status and automatically processes transcripts for completed calls
 */
export async function updateCallStatus(
  callId: string,
  status: Call['status'],
  metadata?: Record<string, unknown>
): Promise<Call> {
  try {
    const call = await getCallById(callId)
    if (!call.vapiCallId) {
      throw new Error('Call not found in Vapi')
    }

    // Update the call in our database
    const updatedCall = await updateCall(callId, {
      status,
      ...(metadata && { metadata }),
    })

    // Automatically retrieve transcript for completed calls
    if (status === 'completed') {
      try {
        await retrieveCallTranscript(callId)
        console.log(`Transcript processing initiated for call ${callId}`)
      } catch (error) {
        // Don't fail the status update if transcript retrieval fails
        console.warn(`Failed to retrieve transcript for call ${callId}:`, error)
      }
    }

    return updatedCall
  } catch (error) {
    console.error('Failed to update call status:', error)
    throw new Error('Failed to update call status')
  }
}

/**
 * Gets a call with its transcript if available
 */
export async function getCallWithTranscript(
  callId: string
): Promise<Call & { hasTranscript: boolean }> {
  try {
    const call = await getCall(callId)
    if (!call) {
      throw new Error('Call not found')
    }

    // Check if transcript is available and try to retrieve it if the call is completed
    let hasTranscript = false
    if (
      call.status === 'completed' &&
      call.transcripts &&
      call.transcripts.length > 0
    ) {
      hasTranscript = true
    } else if (call.status === 'completed') {
      // Try to retrieve transcript if not already available
      try {
        const transcript = await retrieveCallTranscript(callId)
        hasTranscript = !!transcript
      } catch (error) {
        console.warn(`Failed to retrieve transcript for call ${callId}:`, error)
      }
    }

    return {
      ...call,
      hasTranscript,
    }
  } catch (error) {
    console.error('Failed to get call with transcript:', error)
    throw new Error('Failed to get call with transcript')
  }
}
