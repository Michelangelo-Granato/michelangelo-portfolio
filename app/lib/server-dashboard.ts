import { fallbackServerDashboard, type ServerDashboardData } from 'app/data/server'
import { buildDashboardFromSnapshot, getStoredDashboardSnapshot, type DashboardSnapshot } from 'app/lib/server-dashboard-snapshot'

const DASHBOARD_URL_ENV = 'HOMELAB_DASHBOARD_URL'
const DASHBOARD_TOKEN_ENV = 'HOMELAB_DASHBOARD_TOKEN'

function isDashboardData(value: unknown): value is ServerDashboardData {
  if (!value || typeof value !== 'object') {
    return false
  }

  const dashboard = value as Partial<ServerDashboardData>

  return (
    typeof dashboard.updatedAt === 'string' &&
    typeof dashboard.intro?.title === 'string' &&
    Array.isArray(dashboard.highlights) &&
    Array.isArray(dashboard.services) &&
    Array.isArray(dashboard.media) &&
    Array.isArray(dashboard.systems) &&
    Array.isArray(dashboard.requests) &&
    Array.isArray(dashboard.architecture) &&
    Array.isArray(dashboard.containers) &&
    Array.isArray(dashboard.integrations) &&
    Array.isArray(dashboard.activity)
  )
}

export async function getServerDashboardData(): Promise<{
  dashboard: ServerDashboardData
  source: 'fallback' | 'live'
  snapshot: DashboardSnapshot | null
}> {
  const storedSnapshot = await getStoredDashboardSnapshot()

  if (storedSnapshot) {
    return {
      dashboard: buildDashboardFromSnapshot(storedSnapshot),
      source: 'live',
      snapshot: storedSnapshot,
    }
  }

  const endpoint = process.env[DASHBOARD_URL_ENV]

  if (!endpoint) {
    return {
      dashboard: fallbackServerDashboard,
      source: 'fallback',
      snapshot: null,
    }
  }

  try {
    const token = process.env[DASHBOARD_TOKEN_ENV]
    const response = await fetch(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Dashboard endpoint failed with ${response.status}`)
    }

    const json = (await response.json()) as unknown

    if (!isDashboardData(json)) {
      throw new Error('Dashboard endpoint returned an unexpected shape')
    }

    return {
      dashboard: json,
      source: 'live',
      snapshot: null,
    }
  } catch {
    return {
      dashboard: fallbackServerDashboard,
      source: 'fallback',
      snapshot: null,
    }
  }
}
