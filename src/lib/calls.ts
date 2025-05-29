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
 * Formats a phone number to E.164 format (e.g., +1234567890)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')

  // If it doesn't start with +, add + prefix
  if (!phoneNumber.startsWith('+')) {
    // For US numbers, add +1 if it's 10 digits
    if (digits.length === 10) {
      return `+1${digits}`
    }
    // For other numbers, just add +
    return `+${digits}`
  }

  return phoneNumber
}

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
    // Format phone number to E.164 format
    const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber)
    console.log(
      `Formatted phone number: ${data.phoneNumber} -> ${formattedPhoneNumber}`
    )

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

    // 3. Prepare call configuration
    const callConfig: any = {
      customer: {
        number: formattedPhoneNumber,
      },
      phoneNumberId,
      name: `Call to ${formattedPhoneNumber}`,
      metadata: {
        customPrompt: data.customPrompt,
      },
    }

    // If we have an assistant ID, use it
    if (vapiAssistantId) {
      callConfig.assistantId = vapiAssistantId
    } else if (data.customPrompt) {
      // If we have a custom prompt but no assistant, create an inline assistant
      callConfig.assistant = {
        name: `Custom Assistant for ${formattedPhoneNumber}`,
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: data.customPrompt,
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
        firstMessage: 'Hello! How can I help you today?',
      }
    } else {
      throw new Error('Either an assistant ID or custom prompt is required')
    }

    console.log(
      'Creating call with config:',
      JSON.stringify(callConfig, null, 2)
    )

    // 4. Create the call in Vapi API
    const vapiCall = await vapi.createCall(callConfig)

    // 5. Create the call in our database
    const call = await createDbCall({
      phoneNumber: formattedPhoneNumber,
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
    // Log more details about the error
    if (error instanceof Error && 'details' in error) {
      console.error('Error details:', (error as any).details)
    }
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
