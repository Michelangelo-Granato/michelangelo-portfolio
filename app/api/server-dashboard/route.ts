import { NextResponse } from 'next/server'

import { getServerDashboardData } from 'app/lib/server-dashboard'

export const revalidate = 300

export async function GET() {
  const { dashboard, source } = await getServerDashboardData()

  return NextResponse.json({
    source,
    dashboard,
  })
}
