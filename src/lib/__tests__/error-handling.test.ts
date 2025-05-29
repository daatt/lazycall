import {
  ApiErrorHandler,
  CircuitBreaker,
  CircuitBreakerState,
  DEFAULT_CONFIGS,
  RateLimiter,
  type ApiError,
} from '../error-handling'

describe('Error Handling System', () => {
  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeoutMs: 1000,
        monitoringWindowMs: 5000,
      })
    })

    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED)
      expect(circuitBreaker.getFailureCount()).toBe(0)
    })

    it('should execute successful operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      const result = await circuitBreaker.execute(mockOperation)

      expect(result).toBe('success')
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED)
      expect(circuitBreaker.getFailureCount()).toBe(0)
    })

    it('should open circuit after failure threshold', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))

      // Execute enough failures to trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation)
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN)
      expect(circuitBreaker.getFailureCount()).toBe(3)
    })

    it('should reject operations when circuit is open', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation)
        } catch (error) {
          // Expected to fail
        }
      }

      // Now circuit should be open and reject new operations
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
        'Circuit breaker is OPEN - operation not allowed'
      )
    })

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValue('success')

      // Trip the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockOperation)
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN)

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Next operation should transition to HALF_OPEN and succeed
      const result = await circuitBreaker.execute(mockOperation)
      expect(result).toBe('success')
    })
  })

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        requestsPerSecond: 2,
        burstLimit: 3,
      })
    })

    it('should allow requests within rate limit', async () => {
      await expect(rateLimiter.checkLimit()).resolves.not.toThrow()
      await expect(rateLimiter.checkLimit()).resolves.not.toThrow()
    })

    it('should enforce burst limit', async () => {
      // Create a rate limiter with a clear burst limit
      const testRateLimiter = new RateLimiter({
        requestsPerSecond: 10, // High enough that rate limiting won't interfere
        burstLimit: 3,
      })

      // Make requests up to burst limit (3 requests)
      await testRateLimiter.checkLimit() // Request 1
      await testRateLimiter.checkLimit() // Request 2
      await testRateLimiter.checkLimit() // Request 3 (at burst limit)

      // Fourth request should be rejected because we've hit the burst limit of 3
      await expect(testRateLimiter.checkLimit()).rejects.toThrow(
        'Rate limit exceeded - burst limit reached'
      )
    })

    it('should allow requests after time window passes', async () => {
      // Fill up the rate limit
      await rateLimiter.checkLimit()
      await rateLimiter.checkLimit()

      // Wait for time window to pass
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be able to make new requests
      await expect(rateLimiter.checkLimit()).resolves.not.toThrow()
    })
  })

  describe('ApiErrorHandler', () => {
    let errorHandler: ApiErrorHandler

    beforeEach(() => {
      errorHandler = new ApiErrorHandler({
        retry: {
          maxRetries: 2,
          baseDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          jitterEnabled: false,
          timeoutMs: 5000,
        },
        circuitBreaker: {
          failureThreshold: 3,
          recoveryTimeoutMs: 1000,
          monitoringWindowMs: 5000,
        },
        rateLimit: {
          requestsPerSecond: 10,
          burstLimit: 15,
        },
        logErrors: false,
        enableMetrics: true,
      })
    })

    it('should execute successful operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test-service',
        'test-operation'
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)

      const metrics = errorHandler.getMetrics('test-service')
      expect(metrics?.successfulRequests).toBe(1)
      expect(metrics?.totalRequests).toBe(1)
    })

    it('should retry failed operations', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test-service',
        'test-operation'
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)

      const metrics = errorHandler.getMetrics('test-service')
      expect(metrics?.successfulRequests).toBe(1)
      expect(metrics?.failedRequests).toBe(1)
    })

    it('should not retry non-retryable errors', async () => {
      const error = new Error('Unauthorized') as ApiError
      error.status = 401
      const mockOperation = jest.fn().mockRejectedValue(error)

      await expect(
        errorHandler.executeWithRetry(
          mockOperation,
          'test-service',
          'test-operation'
        )
      ).rejects.toThrow('Unauthorized')

      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle timeout operations', async () => {
      const mockOperation = jest
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 1000))
        )

      await expect(
        errorHandler.executeWithTimeout(mockOperation, 500, 'test-operation')
      ).rejects.toThrow('test-operation timed out after 500ms')
    })

    it('should execute batch operations', async () => {
      const operations = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.reject(new Error('error1')),
        () => Promise.resolve('result3'),
      ]

      const result = await errorHandler.executeBatch(
        operations,
        'test-service',
        'batch-operation',
        { concurrency: 2, collectErrors: true }
      )

      expect(result.results).toEqual(['result1', 'result2', 'result3'])
      expect(result.errors).toHaveLength(1)
      expect(result.successCount).toBe(3)
      expect(result.failureCount).toBe(1)
    })

    it('should provide health status', async () => {
      // Use a fresh error handler to avoid circuit breaker state from other tests
      const freshErrorHandler = new ApiErrorHandler({
        retry: {
          maxRetries: 2,
          baseDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          jitterEnabled: false,
          timeoutMs: 5000,
        },
        circuitBreaker: {
          failureThreshold: 5, // Higher threshold to avoid opening during test
          recoveryTimeoutMs: 1000,
          monitoringWindowMs: 5000,
        },
        rateLimit: {
          requestsPerSecond: 10,
          burstLimit: 15,
        },
        logErrors: false,
        enableMetrics: true,
      })

      // Execute some operations to generate metrics
      const successOp = jest.fn().mockResolvedValue('success')
      const failOp = jest.fn().mockRejectedValue(new Error('test error'))

      await freshErrorHandler.executeWithRetry(
        successOp,
        'healthy-service',
        'test'
      )
      await freshErrorHandler.executeWithRetry(
        successOp,
        'healthy-service',
        'test'
      )

      try {
        await freshErrorHandler.executeWithRetry(
          failOp,
          'degraded-service',
          'test'
        )
      } catch (error) {
        // Expected to fail
      }
      await freshErrorHandler.executeWithRetry(
        successOp,
        'degraded-service',
        'test'
      )

      const health = freshErrorHandler.getHealthStatus()

      expect(health['healthy-service'].status).toBe('healthy')
      expect(health['healthy-service'].successRate).toBe(1)

      expect(health['degraded-service'].status).toBe('degraded')
      expect(health['degraded-service'].successRate).toBe(0.25) // 1 success out of 4 total attempts (1 fail + 2 retries + 1 success)
    })

    it('should track metrics correctly', async () => {
      const successOp = jest.fn().mockResolvedValue('success')
      const failOp = jest.fn().mockRejectedValue(new Error('test error'))

      await errorHandler.executeWithRetry(
        successOp,
        'metrics-test',
        'success-op'
      )

      try {
        await errorHandler.executeWithRetry(failOp, 'metrics-test', 'fail-op')
      } catch (error) {
        // Expected to fail
      }

      const metrics = errorHandler.getMetrics('metrics-test')

      expect(metrics?.totalRequests).toBe(2 + 2) // 2 operations + 2 retries for failed op
      expect(metrics?.successfulRequests).toBe(1)
      expect(metrics?.failedRequests).toBe(3) // 1 initial failure + 2 retries
      expect(metrics?.lastError?.message).toContain('test error')
      expect(metrics?.lastSuccess).toBeInstanceOf(Date)
    })

    it('should reset metrics', async () => {
      const successOp = jest.fn().mockResolvedValue('success')
      await errorHandler.executeWithRetry(successOp, 'reset-test', 'test')

      expect(errorHandler.getMetrics('reset-test')).toBeDefined()

      errorHandler.resetMetrics('reset-test')

      expect(errorHandler.getMetrics('reset-test')).toBeUndefined()
    })

    it('should get all metrics', async () => {
      const successOp = jest.fn().mockResolvedValue('success')

      await errorHandler.executeWithRetry(successOp, 'service1', 'test')
      await errorHandler.executeWithRetry(successOp, 'service2', 'test')

      const allMetrics = errorHandler.getAllMetrics()

      expect(Object.keys(allMetrics)).toContain('service1')
      expect(Object.keys(allMetrics)).toContain('service2')
      expect(allMetrics.service1.successfulRequests).toBe(1)
      expect(allMetrics.service2.successfulRequests).toBe(1)
    })

    it('should classify retryable server errors', async () => {
      const serverError = new Error('Internal Server Error') as ApiError
      serverError.status = 500
      const mockOperation = jest.fn().mockRejectedValue(serverError)

      await expect(
        errorHandler.executeWithRetry(mockOperation, 'test', 'test')
      ).rejects.toThrow()

      // Should have retried (called multiple times)
      // errorHandler has maxRetries: 2, so total calls = 1 initial + 2 retries = 3
      expect(mockOperation).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })
  })

  describe('Default Configurations', () => {
    it('should have valid configurations for all services', () => {
      expect(DEFAULT_CONFIGS.vapi).toBeDefined()
      expect(DEFAULT_CONFIGS.openai).toBeDefined()
      expect(DEFAULT_CONFIGS.database).toBeDefined()

      // Verify structure of configs
      const vapiConfig = DEFAULT_CONFIGS.vapi
      expect(vapiConfig.retry.maxRetries).toBeGreaterThan(0)
      expect(vapiConfig.circuitBreaker.failureThreshold).toBeGreaterThan(0)
      expect(vapiConfig.rateLimit.requestsPerSecond).toBeGreaterThan(0)
      expect(vapiConfig.logErrors).toBe(true)
      expect(vapiConfig.enableMetrics).toBe(true)
    })

    it('should create error handlers with default configs', () => {
      const vapiHandler = new ApiErrorHandler(DEFAULT_CONFIGS.vapi)
      const openaiHandler = new ApiErrorHandler(DEFAULT_CONFIGS.openai)
      const dbHandler = new ApiErrorHandler(DEFAULT_CONFIGS.database)

      expect(vapiHandler).toBeInstanceOf(ApiErrorHandler)
      expect(openaiHandler).toBeInstanceOf(ApiErrorHandler)
      expect(dbHandler).toBeInstanceOf(ApiErrorHandler)
    })
  })

  describe('Error Classification', () => {
    let errorHandler: ApiErrorHandler

    beforeEach(() => {
      // Use the actual vapi configuration to match real behavior
      errorHandler = new ApiErrorHandler(DEFAULT_CONFIGS.vapi)
    })

    it('should classify retryable server errors', async () => {
      const serverError = new Error('Internal Server Error') as ApiError
      serverError.status = 500
      const mockOperation = jest.fn().mockRejectedValue(serverError)

      await expect(
        errorHandler.executeWithRetry(mockOperation, 'test', 'test')
      ).rejects.toThrow()

      // Should have retried (called multiple times)
      // DEFAULT_CONFIGS.vapi has maxRetries: 3, so total calls = 1 initial + 3 retries = 4
      expect(mockOperation).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('should not retry client authentication errors', async () => {
      const authError = new Error('Unauthorized') as ApiError
      authError.status = 401
      const mockOperation = jest.fn().mockRejectedValue(authError)

      await expect(
        errorHandler.executeWithRetry(mockOperation, 'test', 'test')
      ).rejects.toThrow()

      // Should not have retried
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry rate limit errors', async () => {
      const rateLimitError = new Error('Rate Limit Exceeded') as ApiError
      rateLimitError.status = 429
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success')

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test',
        'test'
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    it('should retry network errors', async () => {
      const networkError = new Error('Network connection failed')
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success')

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test',
        'test'
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })
})
