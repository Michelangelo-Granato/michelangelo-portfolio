import { fetchDashboardSnapshot, type DashboardSnapshot } from 'app/lib/server-dashboard-snapshot'

/**
 * The homelab exposes its own token-gated metrics endpoint and the site pulls
 * from it. When it is unreachable — home internet, a reboot, a slow response —
 * callers fall back to the last measured figures in `app/data/server`, so the
 * page still shows the real shape of the machine.
 */
export async function getServerSnapshot(): Promise<{
  snapshot: DashboardSnapshot | null
  live: boolean
}> {
  const snapshot = await fetchDashboardSnapshot()
  return { snapshot, live: snapshot !== null }
}
