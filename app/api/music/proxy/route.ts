import { NextRequest } from 'next/server'

const NAV_URL = process.env.NAVIDROME_URL
const NAV_TOKEN = process.env.NAVIDROME_TOKEN

export async function GET(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action') || ''

  if (action === 'stream') {
    // Support either a full `url` parameter or a `path` appended to NAV_URL.
    const fullUrl = url.searchParams.get('url')
    const path = url.searchParams.get('path')
    let target: string | null = null
    if (fullUrl) target = fullUrl
    else if (NAV_URL && path) target = `${NAV_URL}${path}`

    if (!target) {
      return new Response(JSON.stringify({ error: 'missing target url; provide `url` or set NAVIDROME_URL with `path`' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const headers: Record<string, string> = {}
    // Preserve range requests for seeking
    const range = request.headers.get('range')
    if (range) headers['Range'] = range
    // Forward common accept headers
    const accept = request.headers.get('accept')
    if (accept) headers['Accept'] = accept
    if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`

    const resp = await fetch(target, { headers, method: 'GET' })
    const respHeaders = new Headers(resp.headers)
    // Return proxied body with original status and headers
    return new Response(resp.body, { status: resp.status, headers: respHeaders })
  }
  // Support some Subsonic-compatible Navidrome endpoints via `action` param
  if (NAV_URL) {
    try {
      if (action === 'getShares') {
        const target = `${NAV_URL}/rest/getShares.view?f=json`
        const headers: Record<string, string> = {}
        if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
        const resp = await fetch(target, { headers })
        if (resp.ok) {
          const data = await resp.json()
          return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
        }
      }

      if (action === 'getPlaylist') {
        const id = new URL(request.url).searchParams.get('id')
        if (id) {
          const target = `${NAV_URL}/rest/getPlaylist.view?id=${encodeURIComponent(id)}&f=json`
          const headers: Record<string, string> = {}
          if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
          const resp = await fetch(target, { headers })
          if (resp.ok) {
            const data = await resp.json()
            return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
          }
        }
        // Add getArtists and getArtist support (Subsonic-compatible)
          try {
            if (action === 'getArtists') {
              const target = `${NAV_URL}/rest/getArtists.view?f=json`
              const headers: Record<string, string> = {}
              if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
              const resp = await fetch(target, { headers })
              if (resp.ok) {
                const data = await resp.json()
                return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
              }
            }

            if (action === 'getArtist') {
              const id = new URL(request.url).searchParams.get('id')
              if (id) {
                const target = `${NAV_URL}/rest/getArtist.view?id=${encodeURIComponent(id)}&f=json`
                const headers: Record<string, string> = {}
                if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
                const resp = await fetch(target, { headers })
                if (resp.ok) {
                  const data = await resp.json()
                  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
                }
              }
            }
          } catch (e) {
            // ignore and fall through
          }
      }

      if (action === 'streamById') {
        const id = new URL(request.url).searchParams.get('id')
        if (id) {
          const target = `${NAV_URL}/rest/stream.view?id=${encodeURIComponent(id)}`
          const headers: Record<string, string> = {}
          const range = request.headers.get('range')
          if (range) headers['Range'] = range
          if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
          const resp = await fetch(target, { headers })
          const respHeaders = new Headers(resp.headers)
          return new Response(resp.body, { status: resp.status, headers: respHeaders })
        }
      }

      if (action === 'getCoverArt') {
        const id = new URL(request.url).searchParams.get('id')
        if (id) {
          const target = `${NAV_URL}/rest/getCoverArt.view?id=${encodeURIComponent(id)}`
          const headers: Record<string, string> = {}
          if (NAV_TOKEN) headers['Authorization'] = `Bearer ${NAV_TOKEN}`
          const resp = await fetch(target, { headers })
          const respHeaders = new Headers(resp.headers)
          return new Response(resp.body, { status: resp.status, headers: respHeaders })
        }
      }
    } catch (e) {
      // fallthrough to sample list
    }
  }

  // Provide a sample demo list; include the user-provided share URL proxied through this route
  const shareUrl = 'http://mic-server:4533/share/nRcKZaiQvl'
  const proxiedShare = `/api/music/proxy?action=stream&url=${encodeURIComponent(shareUrl)}`
  const sample = [
    { id: 'demo-1', title: 'Demo One', artist: 'You', src: proxiedShare },
    { id: 'demo-2', title: 'Demo Two', artist: 'You', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
  ]

  return new Response(JSON.stringify(sample), { headers: { 'content-type': 'application/json' } })
}

export async function HEAD(request: NextRequest) {
  return new Response(null, { status: 200 })
}
