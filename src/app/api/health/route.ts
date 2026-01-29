import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/server'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  latencyMs?: number
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()

  if (!isSupabaseConfigured()) {
    return {
      name: 'database',
      status: 'degraded',
      message: 'Running in demo mode without database',
      latencyMs: Date.now() - start,
    }
  }

  try {
    // Import dynamically to avoid issues when not configured
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    if (!supabase) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: 'Failed to create database client',
        latencyMs: Date.now() - start,
      }
    }

    // Simple health check query
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error.message,
        latencyMs: Date.now() - start,
      }
    }

    return {
      name: 'database',
      status: 'healthy',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - start,
    }
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now()

  if (!isSupabaseConfigured()) {
    return {
      name: 'storage',
      status: 'degraded',
      message: 'Running in demo mode without storage',
      latencyMs: Date.now() - start,
    }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    if (!supabase) {
      return {
        name: 'storage',
        status: 'unhealthy',
        message: 'Failed to create storage client',
        latencyMs: Date.now() - start,
      }
    }

    // List buckets to verify storage is accessible
    const { error } = await supabase.storage.listBuckets()

    if (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        message: error.message,
        latencyMs: Date.now() - start,
      }
    }

    return {
      name: 'storage',
      status: 'healthy',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    return {
      name: 'storage',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - start,
    }
  }
}

function checkEnvironment(): HealthCheck {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )

  if (missingVars.length > 0) {
    return {
      name: 'environment',
      status: 'degraded',
      message: `Missing: ${missingVars.join(', ')}`,
    }
  }

  return {
    name: 'environment',
    status: 'healthy',
  }
}

export async function GET() {
  const start = Date.now()

  // Run all health checks in parallel
  const [database, storage] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ])

  const environment = checkEnvironment()
  const checks = [database, storage, environment]

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy')
  const hasDegraded = checks.some((c) => c.status === 'degraded')

  const overallStatus = hasUnhealthy
    ? 'unhealthy'
    : hasDegraded
    ? 'degraded'
    : 'healthy'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    totalLatencyMs: Date.now() - start,
    checks: checks.reduce(
      (acc, check) => ({
        ...acc,
        [check.name]: {
          status: check.status,
          ...(check.message && { message: check.message }),
          ...(check.latencyMs !== undefined && { latencyMs: check.latencyMs }),
        },
      }),
      {}
    ),
  }

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
