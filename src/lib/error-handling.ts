// Comprehensive error handling and retry logic for API failures
// Centralized system with circuit breaker, rate limiting, and monitoring

export interface ApiError extends Error {
  status?: number
  code?: string
  service?: string
  operation?: string
  retryable?: boolean
  details?: unknown
  timestamp?: Date
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterEnabled: boolean
  timeoutMs: number
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeoutMs: number
  monitoringWindowMs: number
}

export interface RateLimitConfig {
  requestsPerSecond: number
  burstLimit: number
}

export interface ErrorHandlerConfig {
  retry: RetryConfig
  circuitBreaker: CircuitBreakerConfig
  rateLimit: RateLimitConfig
  logErrors: boolean
  enableMetrics: boolean
}

export interface ApiMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  retryAttempts: number
  circuitBreakerTrips: number
  averageResponseTime: number
  lastError?: ApiError
  lastSuccess?: Date
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export class CircuitBreaker {
  private state = CircuitBreakerState.CLOSED
  private failureCount = 0
  private lastFailureTime?: Date
  private successCount = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private shouldAttemptReset(): boolean {
    return !!(
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() > this.config.recoveryTimeoutMs
    )
  }

  private onSuccess(): void {
    this.failureCount = 0
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= 2) {
        this.state = CircuitBreakerState.CLOSED
        this.successCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()
    this.successCount = 0

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
    }
  }

  getState(): CircuitBreakerState {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

export class RateLimiter {
  private requests: number[] = []

  constructor(private config: RateLimitConfig) {}

  async checkLimit(): Promise<void> {
    const now = Date.now()
    const windowStart = now - 1000 // 1 second window

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart)

    // Check burst limit first (immediate rejection)
    if (this.requests.length >= this.config.burstLimit) {
      throw new Error('Rate limit exceeded - burst limit reached')
    }

    // Record this request before checking rate limits
    this.requests.push(now)

    // Check if we've exceeded the requests per second rate limit
    if (this.requests.length > this.config.requestsPerSecond) {
      const oldestRequest = this.requests[0]
      const waitTime = 1000 - (now - oldestRequest)
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        // Re-check after waiting
        const newNow = Date.now()
        const newWindowStart = newNow - 1000
        this.requests = this.requests.filter(timestamp => timestamp > newWindowStart)
      }
    }
  }
}

export class ApiErrorHandler {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private metrics: Map<string, ApiMetrics> = new Map()

  constructor(private config: ErrorHandlerConfig) {}

  /**
   * Execute an API operation with comprehensive error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    serviceKey: string,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const finalConfig = { ...this.config.retry, ...customConfig }
    const circuitBreaker = this.getCircuitBreaker(serviceKey)
    const rateLimiter = this.getRateLimiter(serviceKey)
    
    let lastError: ApiError = this.createApiError('Unknown error', serviceKey, operationName)
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Check rate limiting
        await rateLimiter.checkLimit()

        // Execute with circuit breaker
        const startTime = Date.now()
        const result = await circuitBreaker.execute(operation)
        const responseTime = Date.now() - startTime

        // Update metrics
        this.updateMetrics(serviceKey, true, responseTime)
        
        if (this.config.logErrors && attempt > 0) {
          console.log(`✅ ${serviceKey}.${operationName} succeeded after ${attempt} retries`)
        }

        return result
      } catch (error) {
        const apiError = this.enhanceError(error, serviceKey, operationName, attempt)
        lastError = apiError

        // Update metrics
        this.updateMetrics(serviceKey, false, 0, apiError)

        // Log error
        if (this.config.logErrors) {
          console.warn(`❌ ${serviceKey}.${operationName} failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}):`, apiError.message)
        }

        // Don't retry if not retryable or on last attempt
        if (!this.isRetryable(apiError) || attempt >= finalConfig.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, finalConfig)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * Execute operation with timeout protection
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation'
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // Add abort signal to operation if it supports it
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`${operationName} timed out after ${timeoutMs}ms`))
          })
        })
      ])

      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Batch operation with individual error handling
   */
  async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    serviceKey: string,
    operationName: string,
    options: {
      concurrency?: number
      failFast?: boolean
      collectErrors?: boolean
    } = {}
  ): Promise<{
    results: T[]
    errors: ApiError[]
    successCount: number
    failureCount: number
  }> {
    const { concurrency = 5, failFast = false, collectErrors = true } = options
    const results: T[] = []
    const errors: ApiError[] = []
    
    // Execute operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (operation, index) => {
        try {
          const result = await this.executeWithRetry(
            operation,
            serviceKey,
            `${operationName}[${i + index}]`
          )
          return { success: true, result, error: null }
        } catch (error) {
          const apiError = this.enhanceError(error, serviceKey, operationName)
          if (failFast) throw apiError
          return { success: false, result: null, error: apiError }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      for (const batchResult of batchResults) {
        if (batchResult.success) {
          results.push(batchResult.result!)
        } else if (collectErrors) {
          errors.push(batchResult.error!)
        }
      }
    }

    return {
      results,
      errors,
      successCount: results.length,
      failureCount: errors.length,
    }
  }

  /**
   * Get metrics for a service
   */
  getMetrics(serviceKey: string): ApiMetrics | undefined {
    return this.metrics.get(serviceKey)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, ApiMetrics> {
    const allMetrics: Record<string, ApiMetrics> = {}
    this.metrics.forEach((metrics, key) => {
      allMetrics[key] = metrics
    })
    return allMetrics
  }

  /**
   * Reset metrics for a service
   */
  resetMetrics(serviceKey: string): void {
    this.metrics.delete(serviceKey)
  }

  /**
   * Health check for all services
   */
  getHealthStatus(): Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy'
    circuitBreakerState: CircuitBreakerState
    successRate: number
    lastError?: string
  }> {
    const health: Record<string, any> = {}
    
    this.metrics.forEach((metrics, serviceKey) => {
      const circuitBreaker = this.circuitBreakers.get(serviceKey)
      const successRate = metrics.totalRequests > 0 
        ? metrics.successfulRequests / metrics.totalRequests 
        : 1

      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (circuitBreaker?.getState() === CircuitBreakerState.OPEN) {
        status = 'unhealthy'
      } else if (successRate < 0.8) {
        status = 'degraded'
      } else {
        status = 'healthy'
      }

      health[serviceKey] = {
        status,
        circuitBreakerState: circuitBreaker?.getState() || CircuitBreakerState.CLOSED,
        successRate,
        lastError: metrics.lastError?.message,
      }
    })

    return health
  }

  // Private helper methods

  private getCircuitBreaker(serviceKey: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceKey)) {
      this.circuitBreakers.set(serviceKey, new CircuitBreaker(this.config.circuitBreaker))
    }
    return this.circuitBreakers.get(serviceKey)!
  }

  private getRateLimiter(serviceKey: string): RateLimiter {
    if (!this.rateLimiters.has(serviceKey)) {
      this.rateLimiters.set(serviceKey, new RateLimiter(this.config.rateLimit))
    }
    return this.rateLimiters.get(serviceKey)!
  }

  private updateMetrics(
    serviceKey: string,
    success: boolean,
    responseTime: number,
    error?: ApiError
  ): void {
    if (!this.config.enableMetrics) return

    if (!this.metrics.has(serviceKey)) {
      this.metrics.set(serviceKey, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        retryAttempts: 0,
        circuitBreakerTrips: 0,
        averageResponseTime: 0,
      })
    }

    const metrics = this.metrics.get(serviceKey)!
    metrics.totalRequests++

    if (success) {
      metrics.successfulRequests++
      metrics.lastSuccess = new Date()
      
      // Update average response time
      const totalResponseTime = metrics.averageResponseTime * (metrics.successfulRequests - 1) + responseTime
      metrics.averageResponseTime = totalResponseTime / metrics.successfulRequests
    } else {
      metrics.failedRequests++
      if (error) {
        metrics.lastError = error
      }
    }
  }

  private enhanceError(
    error: unknown,
    service: string,
    operation: string,
    attempt?: number
  ): ApiError {
    const apiError = error instanceof Error ? error as ApiError : new Error(String(error)) as ApiError
    
    apiError.service = service
    apiError.operation = operation
    apiError.timestamp = new Date()
    
    if (attempt !== undefined) {
      apiError.message = `${apiError.message} (attempt ${attempt + 1})`
    }

    // Determine if error is retryable
    apiError.retryable = this.isRetryable(apiError)

    return apiError
  }

  private createApiError(message: string, service: string, operation: string): ApiError {
    const error = new Error(message) as ApiError
    error.service = service
    error.operation = operation
    error.timestamp = new Date()
    error.retryable = false
    return error
  }

  private isRetryable(error: ApiError): boolean {
    // Don't retry client errors (4xx) except rate limiting (429)
    if (error.status && error.status >= 400 && error.status < 500) {
      return error.status === 429 || error.status === 408 // Rate limit or timeout
    }

    // Retry server errors (5xx)
    if (error.status && error.status >= 500) {
      return true
    }

    // Retry network errors
    const message = error.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('enotfound')
    ) {
      return true
    }

    // Don't retry authentication or authorization errors
    if (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('invalid api key')
    ) {
      return false
    }

    // Default to retryable for unknown errors
    return true
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = Math.min(
      config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelayMs
    )

    if (config.jitterEnabled) {
      // Add ±25% jitter to prevent thundering herd
      const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
      return Math.max(0, exponentialDelay + jitter)
    }

    return exponentialDelay
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Default configurations for different service types
export const DEFAULT_CONFIGS = {
  vapi: {
    retry: {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      timeoutMs: 30000,
    },
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeoutMs: 60000,
      monitoringWindowMs: 300000,
    },
    rateLimit: {
      requestsPerSecond: 10,
      burstLimit: 20,
    },
    logErrors: true,
    enableMetrics: true,
  } as ErrorHandlerConfig,

  openai: {
    retry: {
      maxRetries: 2,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      timeoutMs: 60000,
    },
    circuitBreaker: {
      failureThreshold: 3,
      recoveryTimeoutMs: 120000,
      monitoringWindowMs: 600000,
    },
    rateLimit: {
      requestsPerSecond: 3,
      burstLimit: 5,
    },
    logErrors: true,
    enableMetrics: true,
  } as ErrorHandlerConfig,

  database: {
    retry: {
      maxRetries: 5,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 1.5,
      jitterEnabled: true,
      timeoutMs: 10000,
    },
    circuitBreaker: {
      failureThreshold: 10,
      recoveryTimeoutMs: 30000,
      monitoringWindowMs: 180000,
    },
    rateLimit: {
      requestsPerSecond: 50,
      burstLimit: 100,
    },
    logErrors: true,
    enableMetrics: true,
  } as ErrorHandlerConfig,
}

// Global error handler instances
export const vapiErrorHandler = new ApiErrorHandler(DEFAULT_CONFIGS.vapi)
export const openaiErrorHandler = new ApiErrorHandler(DEFAULT_CONFIGS.openai)
export const databaseErrorHandler = new ApiErrorHandler(DEFAULT_CONFIGS.database) 