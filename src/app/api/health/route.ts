import { databaseErrorHandler, openaiErrorHandler, vapiErrorHandler } from '@/lib/error-handling'
import type { ApiResponse } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/health - Get system health status and metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')
    const detailed = searchParams.get('detailed') === 'true'

    // Get health status from all error handlers
    const vapiHealth = vapiErrorHandler.getHealthStatus()
    const openaiHealth = openaiErrorHandler.getHealthStatus()
    const databaseHealth = databaseErrorHandler.getHealthStatus()

    const allHealth = {
      ...vapiHealth,
      ...openaiHealth,
      ...databaseHealth,
    }

    // If specific service requested
    if (service && allHealth[service]) {
      const serviceHealth = allHealth[service]
      let serviceMetrics = undefined

      if (detailed) {
        if (service.startsWith('vapi')) {
          serviceMetrics = vapiErrorHandler.getMetrics(service)
        } else if (service.startsWith('openai')) {
          serviceMetrics = openaiErrorHandler.getMetrics(service)
        } else if (service.startsWith('database')) {
          serviceMetrics = databaseErrorHandler.getMetrics(service)
        }
      }

      const response: ApiResponse<{
        service: string
        health: typeof serviceHealth
        metrics?: typeof serviceMetrics
      }> = {
        success: true,
        data: {
          service,
          health: serviceHealth,
          ...(serviceMetrics && { metrics: serviceMetrics }),
        },
      }

      return NextResponse.json(response)
    }

    // Return overall system health
    const overallStatus = determineOverallStatus(allHealth)
    
    let systemMetrics = undefined
    if (detailed) {
      systemMetrics = {
        vapi: vapiErrorHandler.getAllMetrics(),
        openai: openaiErrorHandler.getAllMetrics(),
        database: databaseErrorHandler.getAllMetrics(),
      }
    }

    const response: ApiResponse<{
      status: 'healthy' | 'degraded' | 'unhealthy'
      services: typeof allHealth
      timestamp: string
      metrics?: typeof systemMetrics
    }> = {
      success: true,
      data: {
        status: overallStatus,
        services: allHealth,
        timestamp: new Date().toISOString(),
        ...(systemMetrics && { metrics: systemMetrics }),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting system health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}

// POST /api/health - Reset metrics or manage error handlers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, service } = body

    switch (action) {
      case 'reset-metrics':
        if (service) {
          // Reset metrics for specific service
          if (service.startsWith('vapi')) {
            vapiErrorHandler.resetMetrics(service)
          } else if (service.startsWith('openai')) {
            openaiErrorHandler.resetMetrics(service)
          } else if (service.startsWith('database')) {
            databaseErrorHandler.resetMetrics(service)
          } else {
            return NextResponse.json(
              { success: false, error: 'Invalid service name' },
              { status: 400 }
            )
          }

          return NextResponse.json({
            success: true,
            message: `Metrics reset for service: ${service}`,
          })
        } else {
          // Reset all metrics
          vapiErrorHandler.getAllMetrics()
          Object.keys(vapiErrorHandler.getAllMetrics()).forEach(key => 
            vapiErrorHandler.resetMetrics(key)
          )
          
          Object.keys(openaiErrorHandler.getAllMetrics()).forEach(key => 
            openaiErrorHandler.resetMetrics(key)
          )
          
          Object.keys(databaseErrorHandler.getAllMetrics()).forEach(key => 
            databaseErrorHandler.resetMetrics(key)
          )

          return NextResponse.json({
            success: true,
            message: 'All metrics reset successfully',
          })
        }

      case 'get-metrics':
        const allMetrics = {
          vapi: vapiErrorHandler.getAllMetrics(),
          openai: openaiErrorHandler.getAllMetrics(),
          database: databaseErrorHandler.getAllMetrics(),
        }

        return NextResponse.json({
          success: true,
          data: allMetrics,
        })

      case 'health-check':
        // Perform active health checks
        const healthChecks = await performActiveHealthChecks()
        
        return NextResponse.json({
          success: true,
          data: healthChecks,
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in health management:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process health management request' },
      { status: 500 }
    )
  }
}

// Helper functions

function determineOverallStatus(health: Record<string, any>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(health).map((h: any) => h.status)
  
  if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy'
  }
  
  if (statuses.some(status => status === 'degraded')) {
    return 'degraded'
  }
  
  return 'healthy'
}

async function performActiveHealthChecks(): Promise<{
  vapi: { available: boolean; responseTime?: number; error?: string }
  openai: { available: boolean; responseTime?: number; error?: string }
  database: { available: boolean; responseTime?: number; error?: string }
}> {
  const results: {
    vapi: { available: boolean; responseTime?: number; error?: string }
    openai: { available: boolean; responseTime?: number; error?: string }
    database: { available: boolean; responseTime?: number; error?: string }
  } = {
    vapi: { available: false },
    openai: { available: false },
    database: { available: false },
  }

  // Test Vapi API connectivity
  try {
    const startTime = Date.now()
    await vapiErrorHandler.executeWithTimeout(
      async () => {
        const response = await fetch('https://api.vapi.ai/assistant', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          },
        })
        if (!response.ok && response.status !== 401) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response
      },
      5000,
      'vapi-health-check'
    )
    results.vapi.available = true
    results.vapi.responseTime = Date.now() - startTime
  } catch (error) {
    results.vapi.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Test OpenAI API connectivity
  try {
    const startTime = Date.now()
    await openaiErrorHandler.executeWithTimeout(
      async () => {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        })
        if (!response.ok && response.status !== 401) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response
      },
      5000,
      'openai-health-check'
    )
    results.openai.available = true
    results.openai.responseTime = Date.now() - startTime
  } catch (error) {
    results.openai.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Test database connectivity
  try {
    const startTime = Date.now()
    await databaseErrorHandler.executeWithTimeout(
      async () => {
        // Simple database query to test connectivity
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        await prisma.$queryRaw`SELECT 1`
        await prisma.$disconnect()
        return true
      },
      5000,
      'database-health-check'
    )
    results.database.available = true
    results.database.responseTime = Date.now() - startTime
  } catch (error) {
    results.database.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return results
} 