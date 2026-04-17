import type { Metadata } from 'next'
import Link from 'next/link'

import { getServerDashboardData } from 'app/lib/server-dashboard'

export const metadata: Metadata = {
  title: 'Home Server',
  description:
    'A quick look at my home server setup, including the media pipeline, monitoring, and some fun stats.',
}

export const revalidate = 300

const accentMap = {
  red: 'var(--accent-red)',
  blue: 'var(--accent-blue)',
  yellow: 'var(--accent-yellow)',
} as const

function SectionHeading({
  eyebrow,
  title,
  description,
}: Readonly<{ eyebrow: string; title: string; description: string }>) {
  return (
    <div className="max-w-3xl">
      <p className="retro-label mb-2">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)] md:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-[var(--ink-soft)] md:text-lg">{description}</p>
    </div>
  )
}

function ArrowConnector() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12H20M20 12L14.5 6.5M20 12L14.5 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function activityColor(level: number) {
  switch (level) {
    case 4:
      return 'rgba(45, 94, 157, 0.9)'
    case 3:
      return 'rgba(45, 94, 157, 0.7)'
    case 2:
      return 'rgba(216, 166, 43, 0.68)'
    case 1:
      return 'rgba(198, 59, 50, 0.58)'
    default:
      return 'rgba(18, 18, 18, 0.08)'
  }
}

type FlowAccent = keyof typeof accentMap

type FlowNode = {
  id: string
  badge: string
  title: string
  subtitle: string
  readout: string
  accent: FlowAccent
  x: number
  y: number
  width: number
  height: number
}

type FlowConnection = {
  id: string
  d: string
  accent: FlowAccent
  dashed?: boolean
  markerEnd?: string
}

const stackFlowNodes: readonly FlowNode[] = [
  {
    id: 'request',
    badge: 'Trigger',
    title: 'Request arrives',
    subtitle: 'Requests UI / Overseerr',
    readout: 'pending + approvals',
    accent: 'blue',
    x: 52,
    y: 72,
    width: 176,
    height: 138,
  },
  {
    id: 'indexers',
    badge: 'Lookup',
    title: 'Indexers fan out',
    subtitle: 'Prowlarr / Flaresolverr',
    readout: 'health + hit rate',
    accent: 'red',
    x: 252,
    y: 72,
    width: 176,
    height: 138,
  },
  {
    id: 'managers',
    badge: 'Routing',
    title: 'Managers decide',
    subtitle: 'Radarr / Sonarr',
    readout: 'queue + grabs',
    accent: 'yellow',
    x: 452,
    y: 72,
    width: 176,
    height: 138,
  },
  {
    id: 'downloads',
    badge: 'Transfer',
    title: 'Downloads land',
    subtitle: 'qBittorrent / Unmanic',
    readout: 'speed + cleanup',
    accent: 'blue',
    x: 652,
    y: 72,
    width: 176,
    height: 138,
  },
  {
    id: 'playback',
    badge: 'Library',
    title: 'Library goes live',
    subtitle: 'Plex / Jellyfin / Tautulli',
    readout: 'streams + watch time',
    accent: 'red',
    x: 852,
    y: 72,
    width: 176,
    height: 138,
  },
  {
    id: 'observability',
    badge: 'Private lane',
    title: 'Observability feeds the dashboard',
    subtitle: 'Prometheus / Grafana / Dozzle / Tautulli',
    readout: 'cpu + disk + uptime + playback',
    accent: 'yellow',
    x: 120,
    y: 322,
    width: 840,
    height: 166,
  },
] as const

const stackFlowConnections: readonly FlowConnection[] = [
  {
    id: 'request-indexers',
    d: 'M228 141 C236 141 244 141 252 141',
    accent: 'blue',
    markerEnd: 'url(#flow-arrow-blue)',
  },
  {
    id: 'indexers-managers',
    d: 'M428 141 C436 141 444 141 452 141',
    accent: 'red',
    markerEnd: 'url(#flow-arrow-red)',
  },
  {
    id: 'managers-downloads',
    d: 'M628 141 C636 141 644 141 652 141',
    accent: 'yellow',
    markerEnd: 'url(#flow-arrow-yellow)',
  },
  {
    id: 'downloads-playback',
    d: 'M828 141 C836 141 844 141 852 141',
    accent: 'blue',
    markerEnd: 'url(#flow-arrow-blue)',
  },
  {
    id: 'request-tap',
    d: 'M140 210 V272',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'indexers-tap',
    d: 'M340 210 V272',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'managers-tap',
    d: 'M540 210 V272',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'downloads-tap',
    d: 'M740 210 V272',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'playback-tap',
    d: 'M940 210 V272',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'monitoring-bus',
    d: 'M140 272 H940',
    accent: 'yellow',
    dashed: true,
  },
  {
    id: 'dashboard-feed',
    d: 'M540 272 V322',
    accent: 'yellow',
    markerEnd: 'url(#flow-arrow-yellow)',
  },
] as const

function StackFlowNode({ node }: Readonly<{ node: FlowNode }>) {
  const chipWidth = node.width > 320 ? 292 : node.width - 36
  const chipX = (node.width - chipWidth) / 2

  return (
    <g transform={`translate(${node.x} ${node.y})`}>
      <rect
        width={node.width}
        height={node.height}
        rx="24"
        style={{
          fill: 'var(--surface-2)',
          stroke: `color-mix(in srgb, ${accentMap[node.accent]} 42%, var(--line))`,
          strokeWidth: 1.5,
        }}
      />
      <rect
        x="18"
        y="18"
        width="116"
        height="24"
        rx="999"
        style={{
          fill: `color-mix(in srgb, ${accentMap[node.accent]} 16%, transparent)`,
          stroke: `color-mix(in srgb, ${accentMap[node.accent]} 40%, var(--line))`,
          strokeWidth: 1,
        }}
      />
      <text
        x="76"
        y="34"
        textAnchor="middle"
        style={{
          fill: accentMap[node.accent],
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {node.badge}
      </text>
      <text x="18" y="68" style={{ fill: 'var(--ink-strong)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em' }}>
        {node.title}
      </text>
      <text x="18" y="92" style={{ fill: 'var(--ink-soft)', fontSize: 12.5, fontWeight: 500 }}>
        {node.subtitle}
      </text>
      <rect
        x={chipX}
        y={node.height - 38}
        width={chipWidth}
        height="22"
        rx="999"
        style={{
          fill: `color-mix(in srgb, ${accentMap[node.accent]} 12%, transparent)`,
          stroke: `color-mix(in srgb, ${accentMap[node.accent]} 34%, var(--line))`,
          strokeWidth: 1,
        }}
      />
      <text
        x={node.width / 2}
        y={node.height - 23}
        textAnchor="middle"
        style={{ fill: 'var(--ink)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {node.readout}
      </text>
    </g>
  )
}

function StackFlowDiagram() {
  return (
    <div className="mt-8 overflow-x-auto pb-3">
      <div
        className="min-w-[1080px] rounded-[32px] border border-[var(--line)] p-3 md:p-4"
        style={{
          background:
            'radial-gradient(circle at top left, color-mix(in srgb, var(--accent-blue) 12%, transparent), transparent 26%), radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--accent-red) 10%, transparent), transparent 20%), linear-gradient(180deg, color-mix(in srgb, var(--surface-1) 92%, white), var(--surface-0))',
        }}
      >
        <svg
          viewBox="0 0 1080 520"
          className="block h-auto w-full"
          aria-labelledby="stack-flow-diagram-title"
        >
          <title id="stack-flow-diagram-title">
            Diagram showing how a media request moves through the server stack into the library and how monitoring feeds the dashboard
          </title>
          <defs>
            <marker id="flow-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" style={{ fill: accentMap.blue }} />
            </marker>
            <marker id="flow-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" style={{ fill: accentMap.red }} />
            </marker>
            <marker id="flow-arrow-yellow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" style={{ fill: accentMap.yellow }} />
            </marker>
          </defs>

          <rect x="8" y="8" width="1064" height="504" rx="28" style={{ fill: 'transparent', stroke: 'var(--line)', strokeWidth: 1 }} />

          <g style={{ opacity: 0.18 }}>
            <path d="M24 258 H1056" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
            <path d="M24 298 H1056" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
            <path d="M240 24 V496" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
            <path d="M440 24 V496" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
            <path d="M640 24 V496" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
            <path d="M840 24 V496" style={{ stroke: 'var(--line)', strokeWidth: 1 }} />
          </g>

          {stackFlowConnections.map((connection) => (
            <path
              key={connection.id}
              d={connection.d}
              markerEnd={connection.markerEnd}
              style={{
                fill: 'none',
                stroke: accentMap[connection.accent],
                strokeOpacity: connection.dashed ? 0.48 : 0.92,
                strokeWidth: connection.dashed ? 2 : 2.5,
                strokeDasharray: connection.dashed ? '8 10' : undefined,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            />
          ))}

          <text
            x="540"
            y="260"
            textAnchor="middle"
            style={{ fill: 'var(--ink-soft)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            metrics tapped here before they hit the page
          </text>

          {stackFlowNodes.map((node) => (
            <StackFlowNode key={node.id} node={node} />
          ))}
        </svg>
      </div>
      <p className="retro-label mt-3 md:hidden">Swipe to read the full diagram.</p>
    </div>
  )
}

export default async function Page() {
  const { dashboard, source } = await getServerDashboardData()
  const activityWeekOccurrences = new Map<string, number>()

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
          <p className="retro-label mb-4">{dashboard.intro.eyebrow}</p>
          <h1 className="title max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--ink-strong)] md:text-7xl">
            {dashboard.intro.title}
          </h1>
          <div className="accent-rule my-6"></div>
          <p className="max-w-2xl text-base leading-7 text-[var(--ink)] md:text-lg">{dashboard.intro.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://watch.codebymic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-red) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-red) 22%, transparent)',
              }}
            >
              Open Jellyfin
            </a>
            <a
              href="https://requests.codebymic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-blue) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-blue) 22%, transparent)',
              }}
            >
              Open requests
            </a>
            <Link
              href="/projects"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-yellow) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-yellow) 22%, transparent)',
              }}
            >
              Back to projects
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: source === 'live' ? 'var(--accent-blue)' : 'var(--accent-yellow)' }}>
              Data source
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
              {source === 'live' ? 'Live dashboard snapshot' : 'Curated fallback snapshot'}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {source === 'live'
                ? 'These numbers are coming from a private endpoint wired into the server, so what you are seeing is a live snapshot.'
                : 'The page is ready for live telemetry, but until that private endpoint is hooked up I use a hand-written snapshot so the page still tells the story.'}
            </p>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: 'var(--accent-red)' }}>
              Current snapshot
            </p>
            <p className="text-lg font-medium text-[var(--ink-strong)]">{dashboard.updatedAt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.intro.tags.map((tag, index) => {
                const accents = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
                const accent = accents[index % accents.length]

                return (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-strong)]"
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `color-mix(in srgb, ${accent} 42%, var(--line))`,
                      background: `color-mix(in srgb, ${accent} 22%, transparent)`,
                    }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Highlights"
          title="The quick version."
          description="If you only want the short tour, these are the numbers and details that give you the shape of the setup right away."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.highlights.map((item) => (
            <div key={item.label} className="surface-card rounded-[28px] p-6">
              <p className="retro-label mb-3" style={{ color: accentMap[item.accent] }}>
                {item.label}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Services"
          title="What is actually running on it."
          description="This is the real stack behind it: the media apps up front, the request and download chain in the middle, and the networking and monitoring pieces that keep it sane."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.services.map((service) => (
            <div key={service.name} className="surface-card rounded-[28px] p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="retro-label mb-2" style={{ color: accentMap[service.accent] }}>
                    {service.status}
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">{service.name}</h3>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-strong)]"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `color-mix(in srgb, ${accentMap[service.accent]} 42%, var(--line))`,
                    background: `color-mix(in srgb, ${accentMap[service.accent]} 22%, transparent)`,
                  }}
                >
                  {service.role}
                </span>
              </div>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">{service.detail}</p>
              {service.href && (
                <a
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `color-mix(in srgb, ${accentMap[service.accent]} 42%, var(--line))`,
                    background: `color-mix(in srgb, ${accentMap[service.accent]} 18%, transparent)`,
                  }}
                >
                  Visit service
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Media telemetry"
            title="The fun media stats."
            description="This is the kind of stuff I want from Plex, Jellyfin, and Tautulli because it makes the server feel less like a pile of containers and more like something people are genuinely using."
          />
          <div className="grid gap-4">
            {dashboard.media.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeading
            eyebrow="System health"
            title="The boring stats that matter."
            description="The media side is the fun part, but these are the numbers that tell me whether Docker, the host, and the monitoring stack are all behaving themselves."
          />
          <div className="grid gap-4">
            {dashboard.systems.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel rounded-[36px] p-6 md:p-8">
          <SectionHeading
            eyebrow="Architecture"
            title="How it is put together."
            description="This is the simple version of the setup: Caddy and Tailscale handle access, the media apps and request UI sit up front, the *arr pipeline and download stack do the work, and the host keeps the data, metrics, and backups in order."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {dashboard.architecture.map((column, index) => (
              <div key={column.title} className="contents">
                <div className="surface-card rounded-[26px] p-5">
                  <p className="retro-label mb-3" style={{ color: accentMap[column.accent] }}>
                    {column.title}
                  </p>
                  <ul className="space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {column.items.map((item) => (
                      <li key={item} className="rounded-2xl border border-[var(--line)] px-3 py-2 text-[var(--ink)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {index < dashboard.architecture.length - 1 && <ArrowConnector />}
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-[36px] p-6 md:p-8">
          <SectionHeading
            eyebrow="Activity"
            title="A little activity pulse."
            description="I like this view because it gives the page some energy at a glance, whether that activity is playback, requests, or background jobs doing their thing."
          />
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {dashboard.activity.map((week) => {
              const weekSignature = week.join('-')
              const weekOccurrence = (activityWeekOccurrences.get(weekSignature) ?? 0) + 1
              activityWeekOccurrences.set(weekSignature, weekOccurrence)

              const levelOccurrences = new Map<number, number>()

              return (
                <div key={`${weekSignature}-${weekOccurrence}`} className="grid gap-2">
                  {week.map((level) => {
                    const levelOccurrence = (levelOccurrences.get(level) ?? 0) + 1
                    levelOccurrences.set(level, levelOccurrence)

                    return (
                      <div
                        key={`${weekSignature}-${weekOccurrence}-${level}-${levelOccurrence}`}
                        className="h-4 w-4 rounded-[6px] border border-[rgba(18,18,18,0.08)]"
                        style={{ backgroundColor: activityColor(level) }}
                        aria-label={`Activity level ${level}`}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            <span>Low</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-3.5 w-3.5 rounded-[4px] border border-[rgba(18,18,18,0.08)]"
                style={{ backgroundColor: activityColor(level) }}
              />
            ))}
            <span>High</span>
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-[36px] p-6 md:p-8">
        <SectionHeading
          eyebrow="Flow map"
          title="One request, six moving parts."
          description="The architecture grid shows the pieces. This is the diagram version that shows how a request actually travels through the stack before it becomes something you can watch."
        />
        <StackFlowDiagram />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Requests"
            title="How requests turn into watchable stuff."
            description="This is one of my favorite parts to show because a simple request kicks off a very real chain: approvals, indexers, downloads, imports, and then the item finally shows up in the library."
          />
          <div className="grid gap-4">
            {dashboard.requests.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeading
            eyebrow="Containers"
            title="What is running under Docker."
            description="I also wanted to show the runtime side of the setup, because the interesting bit is not just the UI. It is that the whole thing is actually running under Docker Compose, with scheduled services, logs, and maintenance tools behind it."
          />
          <div className="grid gap-4">
            {dashboard.containers.map((container) => (
              <div key={container.name} className="surface-card rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="retro-label mb-2" style={{ color: accentMap[container.accent] }}>
                      Container
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{container.name}</h3>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-strong)]"
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `color-mix(in srgb, ${accentMap[container.accent]} 42%, var(--line))`,
                      background: `color-mix(in srgb, ${accentMap[container.accent]} 22%, transparent)`,
                    }}
                  >
                    {container.purpose}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{container.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-[36px] p-6 md:p-8">
        <SectionHeading
          eyebrow="Integration plan"
          title="Where I want to take this next."
          description="Right now this page can fall back to a curated snapshot, but the next step is wiring in more live data from Tautulli, Jellyfin, Prometheus, qBittorrent, and the request stack so it feels like a real dashboard instead of just a static case study."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.integrations.map((step, index) => {
            const accents = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)', 'var(--accent-red)']
            const accent = accents[index % accents.length]

            return (
              <div key={step.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-3" style={{ color: accent }}>
                  Step {index + 1}
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
