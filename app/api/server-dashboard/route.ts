import { NextResponse } from 'next/server'

import { getServerSnapshot } from 'app/lib/server-dashboard'
import { buildMetricsView } from 'app/lib/server-metrics'

export const revalidate = 60

/**
 * Serves the same measured numbers the page renders. Everything here comes
 * from the homelab's exporters; there is no hand-written content in the
 * response.
 */
export async function GET() {
  const { snapshot, live } = await getServerSnapshot()
  const view = buildMetricsView(snapshot)

  return NextResponse.json({
    source: live ? 'live' : 'fallback',
    generatedAt: view.generatedAt,
    services: view.services,
    library: view.library,
    infrastructure: view.infra,
    requests: view.requests,
    downloads: view.downloads,
    system: view.system,
    media: view.media,
    recentlyAdded: view.recentlyAdded,
    drives: view.drives,
    history: view.history,
  })
}
