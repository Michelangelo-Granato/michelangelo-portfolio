import { getStoredDashboardSnapshot, type DashboardSnapshot } from 'app/lib/server-dashboard-snapshot'

/**
 * The homelab publishes a signed snapshot every few minutes. When it has not
 * (or the blob read fails) callers fall back to the last measured figures in
 * `app/data/server`, so the page still shows the real shape of the machine.
 */
export async function getServerSnapshot(): Promise<{
  snapshot: DashboardSnapshot | null
  live: boolean
}> {
  const snapshot = await getStoredDashboardSnapshot()
  return { snapshot, live: snapshot !== null }
}
