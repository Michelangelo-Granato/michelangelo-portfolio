import { ImageResponse } from 'next/og'

// Satori has no CSS variable support, so the palette is repeated literally
// from global.css here.
const GROUND = '#ecebe6'
const INK = '#121212'
const INK_SOFT = '#555951'
const RED = '#c63b32'
const YELLOW = '#d8a62b'
const BLUE = '#2d5e9d'

export function GET(request: Request) {
  let url = new URL(request.url)
  let title = url.searchParams.get('title') || 'Michelangelo Granato'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: GROUND,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              border: '1px solid rgba(24,24,24,0.16)',
              background: '#e3e2db',
              color: INK,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            MG
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: INK }}>Michelangelo Granato</div>
            <div style={{ fontSize: 16, color: INK_SOFT, letterSpacing: 2 }}>TORONTO · FULL-STACK DEVELOPER</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: title.length > 48 ? 60 : 76,
              fontWeight: 600,
              color: INK,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', marginTop: 36, height: 6, width: 220 }}>
            <div style={{ flex: 1, background: RED }} />
            <div style={{ flex: 1, background: YELLOW }} />
            <div style={{ flex: 1, background: BLUE }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
