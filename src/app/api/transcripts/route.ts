import { getTranscript, getTranscripts } from '@/lib/database'
import {
    extractTranscriptMetrics,
    generateAiAnalysisForTranscript,
    generateAnalysisForTranscript,
    generateSummaryForTranscript,
    processPendingTranscripts,
    retrieveCallTranscript,
    validateTranscriptContent,
} from '@/lib/transcripts'
import type { ApiResponse, Transcript, TranscriptFilters } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/transcripts - Get transcripts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: TranscriptFilters = {
      callId: searchParams.get('callId') || undefined,
      processingStatus: searchParams.get('processingStatus') as any || undefined,
      language: searchParams.get('language') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    }

    const result = await getTranscripts(filters)

    const response: ApiResponse<{
      transcripts: Transcript[]
      total: number
      page: number
      limit: number
    }> = {
      success: true,
      data: {
        transcripts: result.transcripts,
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 10,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting transcripts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get transcripts' },
      { status: 500 }
    )
  }
}

// POST /api/transcripts - Process transcript operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, callId, transcriptId, includeAiAnalysis } = body

    switch (action) {
      case 'retrieve':
        if (!callId) {
          return NextResponse.json(
            { success: false, error: 'Call ID is required for retrieve action' },
            { status: 400 }
          )
        }

        const transcript = await retrieveCallTranscript(callId, includeAiAnalysis !== false)
        
        const response: ApiResponse<Transcript> = {
          success: true,
          data: transcript || undefined,
          message: transcript 
            ? 'Transcript retrieved successfully' 
            : 'No transcript available for this call',
        }

        return NextResponse.json(response)

      case 'process-pending':
        const processingResult = await processPendingTranscripts()
        
        const processResponse: ApiResponse<typeof processingResult> = {
          success: true,
          data: processingResult,
          message: `Processed ${processingResult.processed} transcripts, ${processingResult.failed} failed`,
        }

        return NextResponse.json(processResponse)

      case 'validate':
        if (!transcriptId) {
          return NextResponse.json(
            { success: false, error: 'Transcript ID is required for validate action' },
            { status: 400 }
          )
        }

        const transcriptToValidate = await getTranscript(transcriptId)
        if (!transcriptToValidate) {
          return NextResponse.json(
            { success: false, error: 'Transcript not found' },
            { status: 404 }
          )
        }

        const validation = validateTranscriptContent(transcriptToValidate.content)
        const metrics = extractTranscriptMetrics(transcriptToValidate.content)

        const validationResponse: ApiResponse<{
          validation: typeof validation
          metrics: typeof metrics
        }> = {
          success: true,
          data: {
            validation,
            metrics,
          },
        }

        return NextResponse.json(validationResponse)

      case 'generate-summary':
        if (!transcriptId) {
          return NextResponse.json(
            { success: false, error: 'Transcript ID is required for summary generation' },
            { status: 400 }
          )
        }

        const summaryResult = await generateSummaryForTranscript(transcriptId)
        
        const summaryResponse: ApiResponse<typeof summaryResult> = {
          success: true,
          data: summaryResult,
          message: 'Summary generated successfully',
        }

        return NextResponse.json(summaryResponse)

      case 'generate-analysis':
        if (!transcriptId) {
          return NextResponse.json(
            { success: false, error: 'Transcript ID is required for analysis generation' },
            { status: 400 }
          )
        }

        const analysisResult = await generateAnalysisForTranscript(transcriptId)
        
        const analysisResponse: ApiResponse<typeof analysisResult> = {
          success: true,
          data: analysisResult,
          message: 'Analysis generated successfully',
        }

        return NextResponse.json(analysisResponse)

      case 'generate-ai-analysis':
        if (!transcriptId) {
          return NextResponse.json(
            { success: false, error: 'Transcript ID is required for AI analysis generation' },
            { status: 400 }
          )
        }

        const aiAnalysisResult = await generateAiAnalysisForTranscript(transcriptId)
        
        const aiAnalysisResponse: ApiResponse<Transcript> = {
          success: true,
          data: aiAnalysisResult,
          message: 'AI analysis generated and transcript updated successfully',
        }

        return NextResponse.json(aiAnalysisResponse)

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing transcript operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process transcript operation' },
      { status: 500 }
    )
  }
} 