import type { Transcript } from '../types'
import {
  createTranscript,
  getCall,
  getPendingTranscripts,
  getTranscriptByCallId,
  updateTranscriptProcessing,
} from './database'
import {
  openai,
  type CallAnalysisResult,
  type CallSummaryResult,
} from './openai'
import { vapi } from './vapi'

/**
 * Retrieves and processes call transcript from Vapi API with AI analysis
 */
export async function retrieveCallTranscript(
  callId: string,
  includeAiAnalysis: boolean = true
): Promise<Transcript | null> {
  try {
    // 1. Check if we already have a transcript for this call
    const existingTranscript = await getTranscriptByCallId(callId)
    if (
      existingTranscript &&
      existingTranscript.processingStatus === 'completed'
    ) {
      return existingTranscript
    }

    // 2. Get the call details to find the Vapi call ID
    const call = await getCall(callId)
    if (!call || !call.vapiCallId) {
      throw new Error('Call not found or missing Vapi call ID')
    }

    // 3. Retrieve transcript from Vapi API (embedded in call object)
    const transcriptContent = await vapi.getCallTranscript(call.vapiCallId)

    if (!transcriptContent) {
      // Return null instead of throwing an error - transcript may not be ready yet
      console.log('Transcript not yet available for call:', callId)
      return null
    }

    // 4. Create or update transcript in our database
    if (existingTranscript) {
      // Update existing transcript
      const updatedTranscript = await updateTranscriptWithAiAnalysis(
        existingTranscript.id,
        transcriptContent,
        includeAiAnalysis
      )
      return updatedTranscript
    } else {
      // Create new transcript
      const newTranscript = await createTranscript({
        callId,
        content: transcriptContent,
      })

      // Update with AI analysis
      const processedTranscript = await updateTranscriptWithAiAnalysis(
        newTranscript.id,
        transcriptContent,
        includeAiAnalysis
      )

      return processedTranscript
    }
  } catch (error) {
    console.error('Failed to retrieve call transcript:', error)
    // Return null instead of throwing - let the caller handle this gracefully
    return null
  }
}

/**
 * Updates a transcript with AI-generated summary and analysis
 */
async function updateTranscriptWithAiAnalysis(
  transcriptId: string,
  content: string,
  includeAiAnalysis: boolean = true
): Promise<Transcript> {
  try {
    // Mark as processing
    await updateTranscriptProcessing(transcriptId, {
      processingStatus: 'processing',
    })

    let summary: string | undefined
    let analysis: string | undefined
    let aiMetadata: Record<string, unknown> = {}

    if (includeAiAnalysis) {
      try {
        // Generate comprehensive AI analysis
        const aiResults = await openai.generateComprehensiveAnalysis(content)

        summary = aiResults.summary.summary
        analysis = formatAnalysisText(aiResults.analysis)

        aiMetadata = {
          aiGenerated: true,
          summaryConfidence: aiResults.summary.confidence,
          outcome: aiResults.summary.outcome,
          keyPoints: aiResults.summary.keyPoints,
          sentiment: aiResults.analysis.sentiment,
          sentimentConfidence: aiResults.analysis.sentimentConfidence,
          actionItems: aiResults.analysis.actionItems,
          followUpNeeded: aiResults.analysis.followUpNeeded,
          callQuality: aiResults.analysis.callQuality,
          generatedAt: new Date().toISOString(),
        }
      } catch (aiError) {
        console.warn('Failed to generate AI analysis:', aiError)
        // Continue with basic processing if AI fails
        summary = generateBasicSummary(content)
        analysis = 'AI analysis unavailable due to processing error'
        aiMetadata = {
          aiGenerated: false,
          error: 'AI processing failed',
          fallbackGenerated: true,
        }
      }
    }

    // Update transcript with all data
    const updatedTranscript = await updateTranscriptProcessing(transcriptId, {
      summary,
      analysis,
      processingStatus: 'completed',
      confidence: calculateTranscriptConfidence(content),
      language: detectLanguage(content),
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: 'vapi-api',
        wordCount: content.split(' ').length,
        contentLength: content.length,
        speakerCount: countSpeakers(content),
        averageWordsPerTurn: calculateAverageWordsPerTurn(content),
        ...aiMetadata,
      },
    })

    return updatedTranscript
  } catch (error) {
    // Mark as failed
    await updateTranscriptProcessing(transcriptId, {
      processingStatus: 'failed',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date().toISOString(),
      },
    })

    throw error
  }
}

/**
 * Generates AI summary and analysis for an existing transcript
 */
export async function generateAiAnalysisForTranscript(
  transcriptId: string
): Promise<Transcript> {
  try {
    const transcript = await getTranscriptByCallId(transcriptId)
    if (!transcript) {
      throw new Error('Transcript not found')
    }

    if (!transcript.content) {
      throw new Error('Transcript has no content to analyze')
    }

    return await updateTranscriptWithAiAnalysis(
      transcript.id,
      transcript.content,
      true
    )
  } catch (error) {
    console.error('Failed to generate AI analysis for transcript:', error)
    throw new Error('Failed to generate AI analysis for transcript')
  }
}

/**
 * Processes all pending transcripts in the system with AI analysis
 */
export async function processPendingTranscripts(): Promise<{
  processed: number
  failed: number
  errors: string[]
}> {
  try {
    const pendingTranscripts = await getPendingTranscripts()
    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const transcript of pendingTranscripts) {
      try {
        await processTranscriptWithAi(transcript)
        processed++
      } catch (error) {
        failed++
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Transcript ${transcript.id}: ${errorMessage}`)
      }
    }

    return { processed, failed, errors }
  } catch (error) {
    console.error('Failed to process pending transcripts:', error)
    throw new Error('Failed to process pending transcripts')
  }
}

/**
 * Processes a single transcript with enhanced metadata and AI analysis
 */
export async function processTranscript(
  transcript: Transcript
): Promise<Transcript> {
  return await processTranscriptWithAi(transcript)
}

/**
 * Processes a single transcript with AI analysis
 */
async function processTranscriptWithAi(
  transcript: Transcript
): Promise<Transcript> {
  try {
    // Update processing status to 'processing'
    await updateTranscriptProcessing(transcript.id, {
      processingStatus: 'processing',
    })

    let summary: string | undefined
    let analysis: string | undefined
    let aiMetadata: Record<string, unknown> = {}

    try {
      // Generate AI analysis
      const aiResults = await openai.generateComprehensiveAnalysis(
        transcript.content
      )

      summary = aiResults.summary.summary
      analysis = formatAnalysisText(aiResults.analysis)

      aiMetadata = {
        aiGenerated: true,
        summaryConfidence: aiResults.summary.confidence,
        outcome: aiResults.summary.outcome,
        keyPoints: aiResults.summary.keyPoints,
        sentiment: aiResults.analysis.sentiment,
        sentimentConfidence: aiResults.analysis.sentimentConfidence,
        actionItems: aiResults.analysis.actionItems,
        followUpNeeded: aiResults.analysis.followUpNeeded,
        callQuality: aiResults.analysis.callQuality,
        generatedAt: new Date().toISOString(),
      }
    } catch (aiError) {
      console.warn('Failed to generate AI analysis:', aiError)
      // Fallback to basic processing
      summary = generateBasicSummary(transcript.content)
      analysis = 'AI analysis unavailable due to processing error'
      aiMetadata = {
        aiGenerated: false,
        error: 'AI processing failed',
        fallbackGenerated: true,
      }
    }

    // Process the transcript content
    const processedData = {
      summary,
      analysis,
      confidence: calculateTranscriptConfidence(transcript.content),
      language: detectLanguage(transcript.content),
      metadata: {
        processedAt: new Date().toISOString(),
        contentLength: transcript.content.length,
        speakerCount: countSpeakers(transcript.content),
        averageWordsPerTurn: calculateAverageWordsPerTurn(transcript.content),
        ...aiMetadata,
      },
    }

    // Update transcript with processed data
    const updatedTranscript = await updateTranscriptProcessing(transcript.id, {
      ...processedData,
      processingStatus: 'completed',
    })

    return updatedTranscript
  } catch (error) {
    // Mark as failed
    await updateTranscriptProcessing(transcript.id, {
      processingStatus: 'failed',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date().toISOString(),
      },
    })

    console.error('Failed to process transcript:', error)
    throw new Error('Failed to process transcript')
  }
}

/**
 * Generates summary for a specific transcript using OpenAI
 */
export async function generateSummaryForTranscript(
  transcriptId: string
): Promise<CallSummaryResult> {
  try {
    const transcript = await getTranscriptByCallId(transcriptId)
    if (!transcript) {
      throw new Error('Transcript not found')
    }

    if (!transcript.content) {
      throw new Error('Transcript has no content to summarize')
    }

    return await openai.generateCallSummary(transcript.content)
  } catch (error) {
    console.error('Failed to generate summary for transcript:', error)
    throw new Error('Failed to generate summary for transcript')
  }
}

/**
 * Generates analysis for a specific transcript using OpenAI
 */
export async function generateAnalysisForTranscript(
  transcriptId: string
): Promise<CallAnalysisResult> {
  try {
    const transcript = await getTranscriptByCallId(transcriptId)
    if (!transcript) {
      throw new Error('Transcript not found')
    }

    if (!transcript.content) {
      throw new Error('Transcript has no content to analyze')
    }

    return await openai.analyzeCall(transcript.content)
  } catch (error) {
    console.error('Failed to generate analysis for transcript:', error)
    throw new Error('Failed to generate analysis for transcript')
  }
}

// Helper functions

function formatAnalysisText(analysis: CallAnalysisResult): string {
  let text = analysis.analysis

  if (analysis.actionItems.length > 0) {
    text += '\n\nAction Items:\n'
    analysis.actionItems.forEach((item, index) => {
      text += `${index + 1}. ${item}\n`
    })
  }

  text += `\n\nCall Quality: ${analysis.callQuality.charAt(0).toUpperCase() + analysis.callQuality.slice(1)}`
  text += `\nSentiment: ${analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}`

  if (analysis.followUpNeeded) {
    text += '\n\n⚠️ Follow-up needed based on call analysis.'
  }

  if (analysis.reasoning) {
    text += `\n\nReasoning: ${analysis.reasoning}`
  }

  return text
}

function generateBasicSummary(content: string): string {
  // Generate a basic summary when AI is not available
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  if (sentences.length === 0) return 'No summary available'

  const wordCount = content.split(' ').length
  const duration = Math.ceil(wordCount / 150) // Rough estimate: 150 words per minute

  return `Call transcript with ${wordCount} words (approx. ${duration} minute${duration !== 1 ? 's' : ''}). ${sentences[0].trim()}.`
}

/**
 * Validates transcript content for quality and completeness
 */
export function validateTranscriptContent(content: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation
  if (!content || content.trim().length === 0) {
    errors.push('Transcript content is empty')
  }

  if (content.length < 10) {
    warnings.push('Transcript content is very short')
  }

  // Check for common transcript markers
  const hasTimestamps = /\d{2}:\d{2}:\d{2}/.test(content)
  const hasSpeakerLabels = /(Speaker|User|Assistant|Agent):/i.test(content)

  if (!hasTimestamps && !hasSpeakerLabels) {
    warnings.push('Transcript may be missing speaker labels or timestamps')
  }

  // Check for incomplete content indicators
  const incompleteMarkers = ['[inaudible]', '[unclear]', '...', '[cut off]']
  const hasIncomplete = incompleteMarkers.some(marker =>
    content.toLowerCase().includes(marker.toLowerCase())
  )

  if (hasIncomplete) {
    warnings.push(
      'Transcript contains markers indicating incomplete or unclear audio'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Extracts key metrics from transcript content
 */
export function extractTranscriptMetrics(content: string): {
  wordCount: number
  sentenceCount: number
  speakerCount: number
  averageWordsPerTurn: number
  duration: number | null
} {
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
  const sentenceCount = content
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0).length
  const speakerCount = countSpeakers(content)
  const averageWordsPerTurn = calculateAverageWordsPerTurn(content)
  const duration = extractCallDuration(content)

  return {
    wordCount,
    sentenceCount,
    speakerCount,
    averageWordsPerTurn,
    duration,
  }
}

// Helper functions for transcript processing

function calculateTranscriptConfidence(content: string): number {
  // Simple confidence calculation based on content quality indicators
  let confidence = 1.0

  // Reduce confidence for incomplete markers
  const incompleteMarkers = ['[inaudible]', '[unclear]', '...', '[cut off]']
  const incompleteCount = incompleteMarkers.reduce((count, marker) => {
    return (
      count +
      (content.toLowerCase().match(new RegExp(marker.toLowerCase(), 'g'))
        ?.length || 0)
    )
  }, 0)

  confidence -= incompleteCount * 0.1

  // Reduce confidence for very short transcripts
  if (content.length < 50) {
    confidence -= 0.3
  }

  // Ensure confidence stays within bounds
  return Math.max(0.0, Math.min(1.0, confidence))
}

function detectLanguage(content: string): string {
  // Simple language detection (could be enhanced with proper language detection library)
  const englishWords = [
    'the',
    'and',
    'to',
    'of',
    'a',
    'in',
    'is',
    'it',
    'you',
    'that',
  ]
  const englishCount = englishWords.reduce((count, word) => {
    return (
      count +
      (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'))?.length ||
        0)
    )
  }, 0)

  // If we find common English words, assume English
  if (englishCount > 5) {
    return 'en'
  }

  // Default to English if we can't detect
  return 'en'
}

function countSpeakers(content: string): number {
  // Count unique speaker labels
  const speakerMatches =
    content.match(/(Speaker|User|Assistant|Agent)\s*\d*/gi) || []
  const uniqueSpeakers = new Set(
    speakerMatches.map(match => match.toLowerCase().trim())
  )

  // If no explicit speaker labels, assume at least 2 speakers for a conversation
  return Math.max(uniqueSpeakers.size, 2)
}

function calculateAverageWordsPerTurn(content: string): number {
  // Split by speaker changes or line breaks
  const turns = content
    .split(/\n|Speaker|User|Assistant|Agent/gi)
    .filter(turn => turn.trim().length > 0)

  if (turns.length === 0) return 0

  const totalWords = turns.reduce((sum, turn) => {
    return sum + turn.split(/\s+/).filter(word => word.length > 0).length
  }, 0)

  return Math.round(totalWords / turns.length)
}

function extractCallDuration(content: string): number | null {
  // Try to extract duration from timestamp patterns
  const timestamps = content.match(/\d{2}:\d{2}:\d{2}/g)

  if (timestamps && timestamps.length >= 2) {
    const firstTime = parseTimestamp(timestamps[0])
    const lastTime = parseTimestamp(timestamps[timestamps.length - 1])

    if (firstTime !== null && lastTime !== null) {
      return lastTime - firstTime
    }
  }

  return null
}

function parseTimestamp(timestamp: string): number | null {
  const parts = timestamp.split(':').map(Number)

  if (parts.length === 3 && parts.every(part => !isNaN(part))) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  return null
}
