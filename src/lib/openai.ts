// OpenAI client for generating call summaries and analysis
// Comprehensive implementation with robust error handling and retry logic

import { env } from './env'
import { openaiErrorHandler, type ApiError } from './error-handling'

export interface OpenAIError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export interface OpenAIRequestOptions {
  temperature?: number
  maxTokens?: number
  timeout?: number
  retries?: number
}

export interface CallSummaryResult {
  summary: string
  keyPoints: string[]
  outcome: 'successful' | 'failed' | 'partial' | 'unknown'
  confidence: number
}

export interface CallAnalysisResult {
  analysis: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentConfidence: number
  actionItems: string[]
  followUpNeeded: boolean
  callQuality: 'excellent' | 'good' | 'fair' | 'poor'
  reasoning: string
}

export class OpenAIClient {
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'
  private defaultModel: string = 'gpt-4'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.OPENAI_API_KEY || ''
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.')
    }
  }

  /**
   * Generates a comprehensive summary of the call transcript
   */
  async generateCallSummary(
    transcript: string,
    options?: OpenAIRequestOptions
  ): Promise<CallSummaryResult> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript content is required for summary generation')
      }

      const prompt = this.buildSummaryPrompt(transcript)
      
      const response = await openaiErrorHandler.executeWithRetry(
        () => this.makeRequest({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional call analysis assistant. Generate concise, accurate summaries of phone call transcripts. Focus on key outcomes, decisions made, and important information exchanged.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 500,
        }),
        'openai',
        'generateCallSummary',
        {
          timeoutMs: options?.timeout,
          maxRetries: options?.retries,
        }
      )

      return this.parseSummaryResponse(response.choices[0].message.content)
    } catch (error) {
      console.error('Failed to generate call summary:', error)
      throw this.handleError(error, 'Failed to generate call summary')
    }
  }

  /**
   * Generates detailed analysis of the call including sentiment and action items
   */
  async analyzeCall(
    transcript: string,
    options?: OpenAIRequestOptions
  ): Promise<CallAnalysisResult> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript content is required for call analysis')
      }

      const prompt = this.buildAnalysisPrompt(transcript)
      
      const response = await openaiErrorHandler.executeWithRetry(
        () => this.makeRequest({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert call analysis specialist. Analyze phone call transcripts for sentiment, quality, action items, and provide strategic insights. Be objective and thorough in your analysis.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 800,
        }),
        'openai',
        'analyzeCall',
        {
          timeoutMs: options?.timeout,
          maxRetries: options?.retries,
        }
      )

      return this.parseAnalysisResponse(response.choices[0].message.content)
    } catch (error) {
      console.error('Failed to analyze call:', error)
      throw this.handleError(error, 'Failed to analyze call')
    }
  }

  /**
   * Generates both summary and analysis in a single request for efficiency
   */
  async generateComprehensiveAnalysis(
    transcript: string,
    options?: OpenAIRequestOptions
  ): Promise<{
    summary: CallSummaryResult
    analysis: CallAnalysisResult
  }> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript content is required for analysis')
      }

      const prompt = this.buildComprehensivePrompt(transcript)
      
      const response = await openaiErrorHandler.executeWithRetry(
        () => this.makeRequest({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional call analysis expert. Analyze phone call transcripts and provide both a summary and detailed analysis. Return your response in a structured JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 1200,
        }),
        'openai',
        'generateComprehensiveAnalysis',
        {
          timeoutMs: options?.timeout,
          maxRetries: options?.retries,
        }
      )

      return this.parseComprehensiveResponse(response.choices[0].message.content)
    } catch (error) {
      console.error('Failed to generate comprehensive analysis:', error)
      throw this.handleError(error, 'Failed to generate comprehensive analysis')
    }
  }

  /**
   * Extracts key points from the transcript
   */
  async extractKeyPoints(
    transcript: string,
    options?: OpenAIRequestOptions
  ): Promise<string[]> {
    try {
      const prompt = `Extract the 5 most important key points from this call transcript. Return only the key points as a bulleted list:

${transcript}`

      const response = await openaiErrorHandler.executeWithRetry(
        () => this.makeRequest({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You extract key points from call transcripts. Return only the most important points in a clear, bulleted format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 300,
        }),
        'openai',
        'extractKeyPoints',
        {
          timeoutMs: options?.timeout,
          maxRetries: options?.retries,
        }
      )

      const content = response.choices[0].message.content
      return this.parseKeyPoints(content)
    } catch (error) {
      console.error('Failed to extract key points:', error)
      throw this.handleError(error, 'Failed to extract key points')
    }
  }

  // Private helper methods

  private buildSummaryPrompt(transcript: string): string {
    return `Please analyze this call transcript and provide a structured summary. Return your response in JSON format with the following structure:

{
  "summary": "A concise 2-3 sentence summary of what happened in the call",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "outcome": "successful|failed|partial|unknown",
  "confidence": 0.95
}

Call transcript:
${transcript}`
  }

  private buildAnalysisPrompt(transcript: string): string {
    return `Please analyze this call transcript in detail. Return your response in JSON format with the following structure:

{
  "analysis": "Detailed analysis of the call including what worked well, areas for improvement, and overall assessment",
  "sentiment": "positive|negative|neutral",
  "sentimentConfidence": 0.85,
  "actionItems": ["action 1", "action 2"],
  "followUpNeeded": true,
  "callQuality": "excellent|good|fair|poor",
  "reasoning": "Explanation of the quality assessment and sentiment analysis"
}

Call transcript:
${transcript}`
  }

  private buildComprehensivePrompt(transcript: string): string {
    return `Please analyze this call transcript and provide both a summary and detailed analysis. Return your response in JSON format:

{
  "summary": {
    "summary": "Concise summary",
    "keyPoints": ["point 1", "point 2"],
    "outcome": "successful|failed|partial|unknown",
    "confidence": 0.95
  },
  "analysis": {
    "analysis": "Detailed analysis",
    "sentiment": "positive|negative|neutral",
    "sentimentConfidence": 0.85,
    "actionItems": ["action 1", "action 2"],
    "followUpNeeded": true,
    "callQuality": "excellent|good|fair|poor",
    "reasoning": "Reasoning for assessment"
  }
}

Call transcript:
${transcript}`
  }

  private parseSummaryResponse(content: string): CallSummaryResult {
    try {
      const parsed = JSON.parse(content)
      return {
        summary: parsed.summary || 'Summary not available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        outcome: this.validateOutcome(parsed.outcome),
        confidence: this.validateConfidence(parsed.confidence),
      }
    } catch (error) {
      // Fallback parsing if JSON fails
      return {
        summary: content.substring(0, 500),
        keyPoints: this.extractKeyPointsFromText(content),
        outcome: 'unknown',
        confidence: 0.5,
      }
    }
  }

  private parseAnalysisResponse(content: string): CallAnalysisResult {
    try {
      const parsed = JSON.parse(content)
      return {
        analysis: parsed.analysis || 'Analysis not available',
        sentiment: this.validateSentiment(parsed.sentiment),
        sentimentConfidence: this.validateConfidence(parsed.sentimentConfidence),
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        followUpNeeded: Boolean(parsed.followUpNeeded),
        callQuality: this.validateCallQuality(parsed.callQuality),
        reasoning: parsed.reasoning || 'No reasoning provided',
      }
    } catch (error) {
      // Fallback parsing if JSON fails
      return {
        analysis: content,
        sentiment: 'neutral',
        sentimentConfidence: 0.5,
        actionItems: [],
        followUpNeeded: false,
        callQuality: 'fair',
        reasoning: 'Unable to parse structured response',
      }
    }
  }

  private parseComprehensiveResponse(content: string): {
    summary: CallSummaryResult
    analysis: CallAnalysisResult
  } {
    try {
      const parsed = JSON.parse(content)
      return {
        summary: this.parseSummaryResponse(JSON.stringify(parsed.summary)),
        analysis: this.parseAnalysisResponse(JSON.stringify(parsed.analysis)),
      }
    } catch (error) {
      // Fallback: split content and parse separately
      const midpoint = Math.floor(content.length / 2)
      return {
        summary: this.parseSummaryResponse(content.substring(0, midpoint)),
        analysis: this.parseAnalysisResponse(content.substring(midpoint)),
      }
    }
  }

  private parseKeyPoints(content: string): string[] {
    // Extract bullet points from text
    const lines = content.split('\n')
    const keyPoints: string[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        keyPoints.push(trimmed.substring(1).trim())
      } else if (trimmed.match(/^\d+\./)) {
        keyPoints.push(trimmed.replace(/^\d+\./, '').trim())
      }
    }
    
    return keyPoints.slice(0, 5) // Limit to 5 key points
  }

  private extractKeyPointsFromText(content: string): string[] {
    // Simple extraction of sentences as fallback
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  private validateOutcome(outcome: string): 'successful' | 'failed' | 'partial' | 'unknown' {
    const validOutcomes = ['successful', 'failed', 'partial', 'unknown']
    return validOutcomes.includes(outcome) ? outcome as any : 'unknown'
  }

  private validateSentiment(sentiment: string): 'positive' | 'negative' | 'neutral' {
    const validSentiments = ['positive', 'negative', 'neutral']
    return validSentiments.includes(sentiment) ? sentiment as any : 'neutral'
  }

  private validateCallQuality(quality: string): 'excellent' | 'good' | 'fair' | 'poor' {
    const validQualities = ['excellent', 'good', 'fair', 'poor']
    return validQualities.includes(quality) ? quality as any : 'fair'
  }

  private validateConfidence(confidence: number): number {
    if (typeof confidence !== 'number' || isNaN(confidence)) return 0.5
    return Math.max(0, Math.min(1, confidence))
  }

  private async makeRequest(
    data: Record<string, unknown>
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      ) as ApiError
      error.status = response.status
      error.details = errorData
      error.service = 'openai'
      throw error
    }

    return await response.json()
  }

  private handleError(error: unknown, message: string): OpenAIError {
    if (error instanceof Error) {
      const openaiError = error as OpenAIError
      return {
        message: `${message}: ${openaiError.message}`,
        status: openaiError.status,
        code: openaiError.code,
        details: openaiError.details,
      }
    }
    
    return {
      message: `${message}: Unknown error`,
      details: error,
    }
  }
}

// Export a default instance
export const openai = new OpenAIClient()
