import type { Request, Response, NextFunction } from 'express'

interface SupabaseUsageResponse {
  storage_size_bytes?: number
  db_size_bytes?: number
  monthly_active_users?: number
}

interface OpenAICostResponse {
  data?: Array<{
    aggregation_timestamp?: number
    n_context_tokens_total?: number
    n_generated_tokens_total?: number
    operation?: string
    snapshot_id?: string
    cost?: number
  }>
  object?: string
}

function getProjectRef(): string {
  const env = process.env['SUPABASE_PROJECT_REF']
  if (env) return env
  // Parse from SUPABASE_URL: https://<ref>.supabase.co
  const url = process.env['SUPABASE_URL'] ?? ''
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] ?? ''
}

async function fetchSupabaseStats(): Promise<{
  storageSizeBytes: number | null
  dbSizeBytes: number | null
  configured: boolean
}> {
  const token = process.env['SUPABASE_ACCESS_TOKEN']
  const ref = getProjectRef()

  if (!token || !ref) {
    return { storageSizeBytes: null, dbSizeBytes: null, configured: false }
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    return { storageSizeBytes: null, dbSizeBytes: null, configured: true }
  }

  const body = (await res.json()) as SupabaseUsageResponse
  return {
    storageSizeBytes: body.storage_size_bytes ?? null,
    dbSizeBytes: body.db_size_bytes ?? null,
    configured: true,
  }
}

async function fetchOpenAIStats(): Promise<{
  currentMonthCostUsd: number | null
  configured: boolean
}> {
  const key = process.env['OPENAI_API_KEY']
  if (!key) return { currentMonthCostUsd: null, configured: false }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startTime = Math.floor(startOfMonth.getTime() / 1000)

  const res = await fetch(
    `https://api.openai.com/v1/organization/costs?start_time=${startTime}&limit=180`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!res.ok) return { currentMonthCostUsd: null, configured: true }

  const body = (await res.json()) as OpenAICostResponse
  const total = (body.data ?? []).reduce((sum, d) => sum + (d.cost ?? 0), 0)
  return { currentMonthCostUsd: Math.round(total * 100) / 100, configured: true }
}

export async function getSystemStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const [supabase, openai] = await Promise.all([fetchSupabaseStats(), fetchOpenAIStats()])
    res.json({ success: true, data: { supabase, openai } })
  } catch (err) {
    next(err)
  }
}
