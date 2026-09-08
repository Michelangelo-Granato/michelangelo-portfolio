import type { Metadata } from 'next'
import Link from 'next/link'

import { fallbackInfrastructureMetrics, fallbackLibraryMetrics } from 'app/data/server'
import { getServerDashboardData } from 'app/lib/server-dashboard'
import type { DashboardSnapshot } from 'app/lib/server-dashboard-snapshot'

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

type HistoryPoint = DashboardSnapshot['history'][number]

type TimeSeriesValue = {
  label: string
  value: number | null
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
    subtitle: 'Jellyfin',
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
    subtitle: 'Prometheus / Grafana / Dozzle',
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

function formatCompactNumber(value: number | null, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value)
}

function formatBytesPerSecond(value: number | null, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(size)} ${units[unitIndex]}`
}

function formatHistoryLabel(timestamp: string) {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function takeRecentHistory(snapshot: DashboardSnapshot | null, count = 24) {
  return snapshot?.history.slice(-count) ?? []
}

function buildSeries(history: HistoryPoint[], selectValue: (point: HistoryPoint) => number | null): TimeSeriesValue[] {
  return history.map((point) => ({
    label: formatHistoryLabel(point.timestamp),
    value: selectValue(point),
  }))
}

function buildLinePath(series: TimeSeriesValue[], width: number, height: number, inset = 18) {
  const numericValues = series
    .map((point) => point.value)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (numericValues.length === 0) {
    return ''
  }

  const minValue = Math.min(...numericValues)
  const maxValue = Math.max(...numericValues)
  const range = maxValue - minValue || 1
  const chartWidth = width - inset * 2
  const chartHeight = height - inset * 2

  let path = ''

  series.forEach((point, index) => {
    if (point.value === null || !Number.isFinite(point.value)) {
      return
    }

    const x = inset + (chartWidth * index) / Math.max(series.length - 1, 1)
    const y = inset + chartHeight - ((point.value - minValue) / range) * chartHeight
    path += `${path ? ' L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`
  })

  return path
}

function buildAreaPath(series: TimeSeriesValue[], width: number, height: number, inset = 18) {
  const linePath = buildLinePath(series, width, height, inset)

  if (!linePath) {
    return ''
  }

  const numericIndices = series
    .map((point, index) => (point.value === null || !Number.isFinite(point.value) ? null : index))
    .filter((index): index is number => index !== null)

  if (numericIndices.length === 0) {
    return ''
  }

  const chartWidth = width - inset * 2
  const baseline = height - inset
  const firstX = inset + (chartWidth * numericIndices[0]) / Math.max(series.length - 1, 1)
  const lastIndex = numericIndices.at(-1) ?? numericIndices[0]
  const lastX = inset + (chartWidth * lastIndex) / Math.max(series.length - 1, 1)

  return `${linePath} L${lastX.toFixed(2)} ${baseline.toFixed(2)} L${firstX.toFixed(2)} ${baseline.toFixed(2)} Z`
}

function HistoryAxisLabels({ series }: Readonly<{ series: TimeSeriesValue[] }>) {
  if (series.length === 0) {
    return null
  }

  const picks = [0, Math.floor((series.length - 1) / 2), series.length - 1]
  const uniquePicks = Array.from(new Set(picks))

  return (
    <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
      {uniquePicks.map((index) => (
        <span key={`${series[index]?.label}-${index}`}>{series[index]?.label || '--'}</span>
      ))}
    </div>
  )
}

function HistoryChart({
  primary,
  secondary,
  primaryAccent,
  secondaryAccent,
  height = 192,
}: Readonly<{
  primary: TimeSeriesValue[]
  secondary?: TimeSeriesValue[]
  primaryAccent: FlowAccent
  secondaryAccent?: FlowAccent
  height?: number
}>) {
  const width = 760
  const primaryAreaPath = buildAreaPath(primary, width, height)
  const primaryLinePath = buildLinePath(primary, width, height)
  const secondaryLinePath = secondary ? buildLinePath(secondary, width, height) : ''

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--line)] p-3" style={{ background: 'var(--surface-2)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="telemetry-area-blue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="telemetry-area-red" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-red)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="telemetry-area-yellow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-yellow)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-yellow)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.2, 0.5, 0.8].map((ratio) => (
          <path
            key={ratio}
            d={`M18 ${(height - 36) * ratio + 18} H${width - 18}`}
            style={{ stroke: 'var(--line)', strokeWidth: 1, opacity: 0.5 }}
          />
        ))}

        {primaryAreaPath && (
          <path
            d={primaryAreaPath}
            style={{ fill: `url(#telemetry-area-${primaryAccent})` }}
          />
        )}
        {primaryLinePath && (
          <path
            d={primaryLinePath}
            style={{ fill: 'none', stroke: accentMap[primaryAccent], strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
        )}
        {secondaryLinePath && secondaryAccent && (
          <path
            d={secondaryLinePath}
            style={{
              fill: 'none',
              stroke: accentMap[secondaryAccent],
              strokeWidth: 2.2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeDasharray: '7 8',
              opacity: 0.92,
            }}
          />
        )}
      </svg>
      <HistoryAxisLabels series={primary} />
    </div>
  )
}

function HistoryLegend({
  items,
}: Readonly<{
  items: Array<{ label: string; accent: FlowAccent; dashed?: boolean }>
}>) {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--ink-soft)]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5">
          <span
            className="h-[2px] w-5"
            style={{
              background: item.dashed ? 'transparent' : accentMap[item.accent],
              borderTop: item.dashed ? `2px dashed ${accentMap[item.accent]}` : undefined,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function TimeSeriesSection({ snapshot }: Readonly<{ snapshot: DashboardSnapshot | null }>) {
  const history = takeRecentHistory(snapshot, 24)

  if (history.length < 2) {
    return null
  }

  const hostPrimary = buildSeries(history, (point) => point.cpuPercent)
  const hostSecondary = buildSeries(history, (point) => point.memoryPercent)
  const requestPrimary = buildSeries(history, (point) => point.pendingRequests)
  const requestSecondary = buildSeries(history, (point) => point.availableRequests)
  const transferPrimary = buildSeries(history, (point) => point.downloadRateBytes)
  const transferSecondary = buildSeries(history, (point) => point.uploadRateBytes)
  const streamPrimary = buildSeries(history, (point) => point.activeStreams)
  const streamSecondary = buildSeries(history, (point) => point.rootDiskPercent)
  const latestPoint = history.at(-1)

  if (!latestPoint) {
    return null
  }

  return (
    <section className="surface-panel rounded-[36px] p-6 md:p-8">
      <SectionHeading
        eyebrow="Telemetry"
        title="The server has a pulse now."
        description="These charts come from the rolling snapshot history the homelab is publishing, so the page can show how the box has been behaving instead of only what it looks like right this second."
      />

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card rounded-[32px] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="retro-label mb-3" style={{ color: accentMap.blue }}>
                Host load over time
              </p>
              <h3 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
                CPU {formatCompactNumber(latestPoint.cpuPercent, 'n/a')}% · RAM {formatCompactNumber(latestPoint.memoryPercent, 'n/a')}%
              </h3>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[var(--ink-soft)]">
              A cleaner way to see whether the box is actually cruising or getting leaned on while the media stack is busy.
            </p>
          </div>
          <div className="mt-6">
            <HistoryChart primary={hostPrimary} secondary={hostSecondary} primaryAccent="blue" secondaryAccent="red" />
            <HistoryLegend items={[{ label: 'CPU load', accent: 'blue' }, { label: 'Memory pressure', accent: 'red', dashed: true }]} />
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: accentMap.red }}>
              Streams vs disk pressure
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
              {formatCompactNumber(latestPoint.activeStreams, '0')} active · {formatCompactNumber(latestPoint.rootDiskPercent, 'n/a')}% root used
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              This pairs the fun signal with the practical one so I can see whether activity lines up with the host starting to feel squeezed.
            </p>
            <div className="mt-5">
              <HistoryChart primary={streamPrimary} secondary={streamSecondary} primaryAccent="red" secondaryAccent="yellow" height={156} />
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: accentMap.yellow }}>
              Transfer rate
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
              {formatBytesPerSecond(latestPoint.downloadRateBytes, 'n/a')} down · {formatBytesPerSecond(latestPoint.uploadRateBytes, 'n/a')} up
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              A quick look at whether the pipeline is just idling, actively pulling, or chewing through a busier download window.
            </p>
            <div className="mt-5">
              <HistoryChart primary={transferPrimary} secondary={transferSecondary} primaryAccent="yellow" secondaryAccent="blue" height={156} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-card rounded-[32px] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="retro-label mb-3" style={{ color: accentMap.blue }}>
                Request pressure
              </p>
              <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
                {formatCompactNumber(latestPoint.pendingRequests, '0')} pending · {formatCompactNumber(latestPoint.availableRequests, '0')} available
              </p>
            </div>
            <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              rolling history
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            This is a nicer way to tell whether requests are stacking up or flowing through the pipeline cleanly over time.
          </p>
          <div className="mt-5">
            <HistoryChart primary={requestPrimary} secondary={requestSecondary} primaryAccent="blue" secondaryAccent="yellow" height={176} />
            <HistoryLegend items={[{ label: 'Pending', accent: 'blue' }, { label: 'Available', accent: 'yellow', dashed: true }]} />
          </div>
        </div>

        <div className="surface-card rounded-[32px] p-6">
          <p className="retro-label mb-3" style={{ color: accentMap.red }}>
            Readout
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'History points',
                value: formatCompactNumber(history.length, '0'),
                detail: 'Each point is one published snapshot from the server.',
                accent: 'blue' as const,
              },
              {
                label: 'Latest stream count',
                value: formatCompactNumber(latestPoint.activeStreams, '0'),
                detail: 'What Jellyfin most recently saw as active.',
                accent: 'red' as const,
              },
              {
                label: 'Peak download sample',
                value: formatBytesPerSecond(
                  Math.max(...transferPrimary.map((point) => point.value ?? 0)),
                  'n/a',
                ),
                detail: 'The highest sampled download rate in the current chart window.',
                accent: 'yellow' as const,
              },
              {
                label: 'Current root usage',
                value: `${formatCompactNumber(latestPoint.rootDiskPercent, 'n/a')}%`,
                detail: 'A quick host pressure check alongside the graphs.',
                accent: 'blue' as const,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-0)] p-4">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.label}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function formatTerabytes(value: number | null, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: value >= 1e12 ? 2 : 1 }).format(
    value / 1e12,
  )} TB`
}

/** Reported in GiB, which is how a 16 GB stick of RAM actually reads. */
function formatGigabytes(value: number | null, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value / 1024 ** 3)} GB`
}

/** Counts stay exact -- "7,115 episodes" is more interesting than "7K". */
function formatExactNumber(value: number | null, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

/**
 * Prefer the published snapshot, but fall back to the last set of numbers
 * measured off the exporters so the section never renders empty.
 */
function pick(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function MetricRow({
  label,
  value,
  accent,
}: Readonly<{ label: string; value: string; accent: FlowAccent }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 last:border-b-0">
      <span className="text-sm text-[var(--ink-soft)]">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[var(--ink-strong)]" style={{ color: accentMap[accent] }}>
        {value}
      </span>
    </div>
  )
}

function ProgressMeter({
  ratio,
  accent,
}: Readonly<{ ratio: number; accent: FlowAccent }>) {
  const clamped = Math.min(Math.max(ratio, 0), 1)

  return (
    <div
      className="mt-4 h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}
      role="img"
      aria-label={`${Math.round(clamped * 100)} percent used`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped * 100}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${accentMap[accent]} 70%, transparent), ${accentMap[accent]})`,
        }}
      />
    </div>
  )
}

function ExporterMetricsSection({ snapshot }: Readonly<{ snapshot: DashboardSnapshot | null }>) {
  const library = snapshot?.library
  const infra = snapshot?.infrastructure

  const movies = pick(library?.movies, fallbackLibraryMetrics.movies)
  const moviesDownloaded = pick(library?.moviesDownloaded, fallbackLibraryMetrics.moviesDownloaded)
  const moviesMissing = pick(library?.moviesMissing, fallbackLibraryMetrics.moviesMissing)
  const movieBytes = pick(library?.movieBytes, fallbackLibraryMetrics.movieBytes)
  const series = pick(library?.series, fallbackLibraryMetrics.series)
  const seasons = pick(library?.seasons, fallbackLibraryMetrics.seasons)
  const episodes = pick(library?.episodes, fallbackLibraryMetrics.episodes)
  const episodesDownloaded = pick(library?.episodesDownloaded, fallbackLibraryMetrics.episodesDownloaded)
  const episodesMissing = pick(library?.episodesMissing, fallbackLibraryMetrics.episodesMissing)
  const seriesBytes = pick(library?.seriesBytes, fallbackLibraryMetrics.seriesBytes)

  const cpuCores = pick(infra?.cpuCores, fallbackInfrastructureMetrics.cpuCores)
  const memoryTotalBytes = pick(infra?.memoryTotalBytes, fallbackInfrastructureMetrics.memoryTotalBytes)
  const containersRunning = pick(infra?.containersRunning, fallbackInfrastructureMetrics.containersRunning)
  const mediaTotalBytes = pick(infra?.mediaTotalBytes, fallbackInfrastructureMetrics.mediaTotalBytes)
  const mediaFreeBytes = pick(infra?.mediaFreeBytes, fallbackInfrastructureMetrics.mediaFreeBytes)
  const probesUp = pick(infra?.probesUp, fallbackInfrastructureMetrics.probesUp)
  const probesTotal = pick(infra?.probesTotal, fallbackInfrastructureMetrics.probesTotal)
  const indexersEnabled = pick(infra?.indexersEnabled, fallbackInfrastructureMetrics.indexersEnabled)
  const indexerResponseMs = pick(infra?.indexerResponseMs, fallbackInfrastructureMetrics.indexerResponseMs)

  const totalLibraryBytes = movieBytes + seriesBytes
  const usedRatio = mediaTotalBytes > 0 ? (mediaTotalBytes - mediaFreeBytes) / mediaTotalBytes : 0
  const episodeCompletion = episodes > 0 ? episodesDownloaded / episodes : 0

  return (
    <section className="surface-panel rounded-[36px] p-6 md:p-8">
      <SectionHeading
        eyebrow="Exporters"
        title="The numbers Grafana already sees."
        description="Prometheus scrapes the Radarr, Sonarr, and Prowlarr exporters alongside node-exporter and blackbox probes. These are the same series the Grafana dashboards are built on, pulled straight through to this page."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Movie library',
            value: formatCompactNumber(movies, 'n/a'),
            detail: `${formatCompactNumber(moviesDownloaded, '0')} downloaded, ${formatCompactNumber(moviesMissing, '0')} still missing.`,
            accent: 'red' as const,
          },
          {
            label: 'Series library',
            value: formatCompactNumber(series, 'n/a'),
            detail: `${formatExactNumber(seasons, '0')} seasons across ${formatExactNumber(episodes, '0')} tracked episodes.`,
            accent: 'blue' as const,
          },
          {
            label: 'On disk',
            value: formatTerabytes(totalLibraryBytes, 'n/a'),
            detail: `${formatTerabytes(movieBytes, 'n/a')} of movies and ${formatTerabytes(seriesBytes, 'n/a')} of television.`,
            accent: 'yellow' as const,
          },
          {
            label: 'Host',
            value: `${formatCompactNumber(cpuCores, 'n/a')} cores`,
            detail: `${formatGigabytes(memoryTotalBytes, 'n/a')} of RAM with ${formatCompactNumber(containersRunning, 'n/a')} containers running.`,
            accent: 'red' as const,
          },
        ].map((item) => (
          <div key={item.label} className="surface-card rounded-[28px] p-6">
            <p className="retro-label mb-3" style={{ color: accentMap[item.accent] }}>
              {item.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface-card rounded-[32px] p-6">
          <p className="retro-label mb-3" style={{ color: accentMap.yellow }}>
            Media pool
          </p>
          <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
            {formatTerabytes(mediaTotalBytes - mediaFreeBytes, 'n/a')} used of {formatTerabytes(mediaTotalBytes, 'n/a')}
          </p>
          <ProgressMeter ratio={usedRatio} accent="yellow" />
          <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
            Two media drives back the library. node-exporter reports the sizes, so this bar moves on its own as things get
            added or cleaned up.
          </p>
          <div className="mt-4">
            <MetricRow label="Free space" value={formatTerabytes(mediaFreeBytes, 'n/a')} accent="yellow" />
            <MetricRow label="Pool used" value={`${Math.round(usedRatio * 100)}%`} accent="yellow" />
          </div>
        </div>

        <div className="surface-card rounded-[32px] p-6">
          <p className="retro-label mb-3" style={{ color: accentMap.blue }}>
            Pipeline health
          </p>
          <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
            {formatCompactNumber(probesUp, '0')}/{formatCompactNumber(probesTotal, '0')} probes up
          </p>
          <ProgressMeter ratio={probesTotal > 0 ? probesUp / probesTotal : 0} accent="blue" />
          <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
            Blackbox probes the front-end services on a loop while the Prowlarr exporter reports how the indexer pool is
            behaving.
          </p>
          <div className="mt-4">
            <MetricRow label="Indexers enabled" value={formatCompactNumber(indexersEnabled, 'n/a')} accent="blue" />
            <MetricRow
              label="Avg indexer response"
              value={`${formatCompactNumber(indexerResponseMs, 'n/a')} ms`}
              accent="blue"
            />
            <MetricRow
              label="Episode completion"
              value={`${Math.round(episodeCompletion * 100)}%`}
              accent="blue"
            />
            <MetricRow label="Episodes missing" value={formatExactNumber(episodesMissing, '0')} accent="blue" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function Page() {
  const { dashboard, source, snapshot } = await getServerDashboardData()
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
            description="This is the kind of stuff I want from Jellyfin because it makes the server feel less like a pile of containers and more like something people are genuinely using."
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

      <ExporterMetricsSection snapshot={snapshot} />

      <TimeSeriesSection snapshot={snapshot} />

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
          description="The page already runs on live data from Prometheus, the *arr exporters, qBittorrent, and the request stack. Jellyfin playback stats are the last piece still waiting on an API key."
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
