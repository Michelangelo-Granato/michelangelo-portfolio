import { NextResponse } from 'next/server'

/** Kept in step with the homelab's own range table. */
const SUPPORTED_RANGES = ['5m', '1h', '4h', '24h', '7d'] as const

export const dynamic = 'force-dynamic'

/**
 * Proxies the homelab's time-series endpoint so the browser can switch ranges
 * without ever seeing the bearer token.
 */
export async function GET(request: Request) {
  const metricsUrl = process.env.HOMELAB_METRICS_URL
  const token = process.env.HOMELAB_METRICS_TOKEN

  if (!metricsUrl || !token) {
    return NextResponse.json({ error: 'Metrics endpoint is not configured.' }, { status: 503 })
  }

  const range = new URL(request.url).searchParams.get('range') ?? '24h'

  if (!SUPPORTED_RANGES.includes(range as (typeof SUPPORTED_RANGES)[number])) {
    return NextResponse.json({ error: 'Unknown range.', supported: SUPPORTED_RANGES }, { status: 400 })
  }

  // HOMELAB_METRICS_URL points at /snapshot; the series lives beside it.
  const upstream = new URL(metricsUrl)
  upstream.pathname = upstream.pathname.replace(/\/snapshot\/?$/, '/series')
  upstream.searchParams.set('range', range)

  try {
    const response = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Metrics endpoint rejected the request.' }, { status: 502 })
    }

    return NextResponse.json(await response.json(), {
      headers: { 'cache-control': 'public, max-age=15, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json({ error: 'Metrics endpoint is unreachable.' }, { status: 504 })
  }
}
