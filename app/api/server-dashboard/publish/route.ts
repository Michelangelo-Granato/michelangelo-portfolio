import { put } from '@vercel/blob'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { DASHBOARD_SNAPSHOT_BLOB_PATH, isDashboardSnapshot } from 'app/lib/server-dashboard-snapshot'

const PUBLISH_SECRET_ENV = 'HOMELAB_DASHBOARD_PUBLISH_SECRET'
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000

export const runtime = 'nodejs'

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const receivedBuffer = Buffer.from(received, 'utf8')

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function POST(request: Request) {
  const publishSecret = process.env[PUBLISH_SECRET_ENV]

  if (!publishSecret) {
    return NextResponse.json({ error: 'Missing publish secret on the portfolio deployment.' }, { status: 500 })
  }

  const timestampHeader = request.headers.get('x-dashboard-timestamp')
  const signatureHeader = request.headers.get('x-dashboard-signature')

  if (!timestampHeader || !signatureHeader) {
    return NextResponse.json({ error: 'Missing dashboard signature headers.' }, { status: 401 })
  }

  const timestamp = Number(timestampHeader)

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_TIMESTAMP_SKEW_MS) {
    return NextResponse.json({ error: 'Dashboard publish timestamp is invalid or expired.' }, { status: 401 })
  }

  const body = await request.text()
  const expectedSignature = createHmac('sha256', publishSecret).update(`${timestampHeader}.${body}`).digest('hex')

  if (!signaturesMatch(expectedSignature, signatureHeader)) {
    return NextResponse.json({ error: 'Dashboard publish signature is invalid.' }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = JSON.parse(body) as unknown
  } catch {
    return NextResponse.json({ error: 'Dashboard publish body must be valid JSON.' }, { status: 400 })
  }

  if (!isDashboardSnapshot(payload)) {
    return NextResponse.json({ error: 'Dashboard publish body does not match the expected snapshot shape.' }, { status: 400 })
  }

  // The blob store is configured for private access, so the snapshot is written
  // privately and read back server-side with the store token.
  const blob = await put(DASHBOARD_SNAPSHOT_BLOB_PATH, body, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  })

  return NextResponse.json({
    ok: true,
    path: DASHBOARD_SNAPSHOT_BLOB_PATH,
    url: blob.url,
    generatedAt: payload.generatedAt,
  })
}