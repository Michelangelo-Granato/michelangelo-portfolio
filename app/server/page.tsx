import type { Metadata } from 'next'
import Link from 'next/link'

import { ContainerOrbitPanel } from 'app/components/container-orbit-panel'
import { TelemetrySection } from 'app/components/telemetry'
import { Trace, type TracePoint } from 'app/components/trace'
import { getServerSnapshot } from 'app/lib/server-dashboard'
import type { ServiceUptime } from 'app/lib/server-dashboard-snapshot'
import {
  buildMetricsView,
  formatClock,
  formatBytes,
  formatCount,
  formatGiB,
  formatRate,
  formatTB,
  formatUptime,
  type Drive,
} from 'app/lib/server-metrics'

export const metadata: Metadata = {
  title: 'Home Server',
  description: 'Live status board for my home server: library size, host load, storage headroom, and service health.',
}

export const revalidate = 60

/** Meter fills carry severity, so a nearly-full disk reads as full before you
 *  get to the number. */
function severity(ratio: number) {
  if (ratio >= 0.85) return 'var(--status-down)'
  if (ratio >= 0.7) return 'var(--series-third)'
  return 'var(--series-cpu)'
}

/** Availability reads the other way round from a fill: 7/7 is the only good
 *  answer, so anything short of every probe passing has to show as a problem. */
function availabilitySeverity(ratio: number) {
  if (ratio >= 0.999) return 'var(--status-up)'
  if (ratio >= 0.9) return 'var(--series-third)'
  return 'var(--status-down)'
}

function Panel({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <section className={`surface-card rounded-2xl p-5 md:p-6 ${className}`}>{children}</section>
}

function ModuleLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <h2 className="mb-4 text-sm font-medium text-[var(--ink-soft)]">{children}</h2>
}

/** `stale` means the collector returned null and a last-known figure is
 *  standing in, so the value is dimmed and labelled rather than shown as live. */
function StatTile({
  label,
  value,
  foot,
  stale = false,
}: Readonly<{ label: string; value: string; foot?: string; stale?: boolean }>) {
  return (
    <div className="surface-card rounded-xl px-4 py-3.5">
      <div
        className="text-2xl font-semibold tracking-tight"
        style={{ color: stale ? 'var(--ink-soft)' : 'var(--ink-strong)' }}
        title={stale ? 'Last known value: the collector could not read this.' : undefined}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{label}</div>
      {stale ? (
        <div className="mt-1.5 text-[11px] italic text-[var(--ink-soft)]">last known</div>
      ) : (
        foot && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{foot}</div>
      )}
    </div>
  )
}

function Meter({
  label,
  value,
  detail,
  ratio,
  color,
  stale = false,
}: Readonly<{ label: string; value: string; detail?: string; ratio: number; color?: string; stale?: boolean }>) {
  const clamped = Math.min(Math.max(ratio, 0), 1)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[var(--ink-soft)]">
          {label}
          {stale && <span className="ml-1.5 text-[11px] italic">last known</span>}
        </span>
        <span
          className="text-sm font-semibold [font-variant-numeric:tabular-nums]"
          style={{ color: stale ? 'var(--ink-soft)' : 'var(--ink-strong)' }}
        >
          {value}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--chart-track)' }}
        role="img"
        aria-label={`${label}: ${Math.round(clamped * 100)} percent`}
      >
        <div className="h-full rounded-full" style={{ width: `${clamped * 100}%`, background: color ?? severity(clamped) }} />
      </div>
      {detail && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{detail}</div>}
    </div>
  )
}

type Segment = { label: string; value: number; color: string }

/** Part-to-whole across a handful of states. Zero-width slices are dropped from
 *  the bar but stay in the legend, so "0 missing" is still legible. */
function SegmentBar({
  title,
  total,
  totalLabel,
  segments,
}: Readonly<{ title: string; total: number; totalLabel: string; segments: Segment[] }>) {
  const drawn = segments.filter((segment) => segment.value > 0)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[var(--ink-soft)]">{title}</span>
        <span className="text-sm font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
          {totalLabel}
        </span>
      </div>
      <div className="mt-2 flex h-3 w-full gap-[2px]">
        {drawn.map((segment, index) => (
          <div
            key={segment.label}
            className={`h-full ${index === 0 ? 'rounded-l-full' : ''} ${index === drawn.length - 1 ? 'rounded-r-full' : ''}`}
            style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
            {segment.label}
            <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {formatCount(segment.value)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function DriveBar({ drive }: Readonly<{ drive: Drive }>) {
  const used = drive.totalBytes - drive.freeBytes
  const ratio = drive.totalBytes > 0 ? used / drive.totalBytes : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--ink)]">{drive.label}</span>
        <span className="text-sm font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
          {Math.round(ratio * 100)}%
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--chart-track)' }}
        role="img"
        aria-label={`${drive.label}: ${Math.round(ratio * 100)} percent full`}
      >
        <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: severity(ratio) }} />
      </div>
      <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">
        {formatTB(used)} used of {formatTB(drive.totalBytes)}
        {drive.freeBytes > 0 ? `, ${formatTB(drive.freeBytes)} free` : ' — full'}
      </div>
      {drive.daysUntilFull !== null ? (
        <div
          className="mt-1 text-[11px] font-medium"
          style={{ color: drive.daysUntilFull <= 30 ? 'var(--status-down)' : 'var(--ink-soft)' }}
        >
          {formatHorizon(drive.daysUntilFull)}
        </div>
      ) : (
        drive.trendBytesPerDay !== null && (
          <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{formatTrend(drive.trendBytesPerDay)}</div>
        )
      )}
    </div>
  )
}

/** With no horizon to report, the direction of travel still is worth saying -
 *  a drive recovering space is as much news as one running out. */
function formatTrend(bytesPerDay: number) {
  if (Math.abs(bytesPerDay) < 1e9) return 'Holding steady over the last few days'
  const size = formatBytes(Math.abs(bytesPerDay))
  return bytesPerDay > 0 ? `Freeing ${size} a day` : `Filling ${size} a day`
}

/** A projection is only as good as its window, so it is phrased as one. */
function formatHorizon(days: number) {
  if (days < 1) return 'Full within a day at the current rate'
  if (days < 60) return `Full in about ${Math.round(days)} days at the current rate`
  if (days < 730) return `Full in about ${Math.round(days / 30)} months at the current rate`
  return 'Filling slowly; more than two years of headroom'
}

/**
 * One bar per day of blackbox probe results, oldest first. A day with no
 * samples is drawn in the track colour rather than skipped, so gaps in the
 * monitoring are visible instead of silently compressing the timeline.
 */
function UptimeStrip({ daily }: Readonly<{ daily: Array<number | null> }>) {
  return (
    <div className="flex h-6 items-stretch gap-[2px]" aria-hidden>
      {daily.map((day, index) => (
        <div
          key={index}
          className="min-w-0 flex-1 rounded-[1px]"
          style={{ background: day === null ? 'var(--chart-track)' : availabilitySeverity(day) }}
          title={day === null ? 'no samples' : `${(day * 100).toFixed(1)}% up`}
        />
      ))}
    </div>
  )
}

function UptimeRow({
  name,
  up,
  uptime,
}: Readonly<{ name: string; up: boolean; uptime: ServiceUptime | undefined }>) {
  return (
    <div className="border-b border-[var(--line)] py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              background: up ? 'var(--status-up)' : 'var(--status-down)',
              boxShadow: up ? '0 0 0 3px color-mix(in srgb, var(--status-up) 18%, transparent)' : undefined,
            }}
          />
          <span className="truncate text-sm text-[var(--ink)]">{name}</span>
        </span>
        <span className="flex shrink-0 items-baseline gap-3 text-xs [font-variant-numeric:tabular-nums]">
          {uptime?.latencyMs !== null && uptime?.latencyMs !== undefined && (
            <span className="text-[var(--ink-soft)]">{Math.round(uptime.latencyMs)} ms</span>
          )}
          {uptime?.ratio !== null && uptime?.ratio !== undefined ? (
            <span className="font-semibold" style={{ color: availabilitySeverity(uptime.ratio) }}>
              {(uptime.ratio * 100).toFixed(uptime.ratio >= 0.9995 ? 0 : 2)}%
            </span>
          ) : (
            <span className="text-[var(--ink-soft)]">{up ? 'up' : 'down'}</span>
          )}
        </span>
      </div>
      {uptime && uptime.daily.length > 0 && (
        <div className="mt-2">
          <UptimeStrip daily={uptime.daily} />
        </div>
      )}
    </div>
  )
}

/** Magnitude comparison across many labels, so one hue rather than eight. */
function QualityBars({ buckets }: Readonly<{ buckets: ReadonlyArray<{ label: string; count: number }> }>) {
  const peak = Math.max(...buckets.map((bucket) => bucket.count), 1)

  return (
    <div className="space-y-2.5">
      {buckets.map((bucket) => (
        <div key={bucket.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-[var(--ink)]">
              {bucket.label}
            </span>
            <span className="text-xs font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {formatCount(bucket.count)}
            </span>
          </div>
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--chart-track)' }}
            role="img"
            aria-label={`${bucket.label}: ${bucket.count} films`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${(bucket.count / peak) * 100}%`, background: 'var(--series-cpu)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricRow({
  label,
  value,
  stale = false,
}: Readonly<{ label: string; value: string; stale?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2 last:border-b-0">
      <span className="text-sm text-[var(--ink-soft)]">
        {label}
        {stale && <span className="ml-1.5 text-[11px] italic">last known</span>}
      </span>
      <span
        className="text-sm font-semibold [font-variant-numeric:tabular-nums]"
        style={{ color: stale ? 'var(--ink-soft)' : 'var(--ink-strong)' }}
      >
        {value}
      </span>
    </div>
  )
}

function Lamp({ name, up }: Readonly<{ name: string; up: boolean }>) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] px-3 py-2">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          background: up ? 'var(--status-up)' : 'var(--status-down)',
          boxShadow: up ? '0 0 0 3px color-mix(in srgb, var(--status-up) 18%, transparent)' : undefined,
        }}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{name}</span>
      <span className="text-[11px] text-[var(--ink-soft)]">{up ? 'up' : 'down'}</span>
    </div>
  )
}

/**
 * A funnel stage. Width tracks the count relative to the first stage, so the
 * drop-off is visible before you read a number. The floor keeps a nearly-empty
 * stage legible instead of collapsing it to a sliver.
 */
function PipelineStage({
  stage,
  value,
  label,
  share,
}: Readonly<{ stage: string; value: string; label: string; share: number }>) {
  return (
    <div
      className="surface-card min-w-0 rounded-xl px-4 py-3 md:min-w-[9rem]"
      style={{ flexGrow: Math.max(share, 0.25), flexBasis: 0 }}
    >
      <div className="text-[11px] text-[var(--ink-soft)]">{stage}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{value}</div>
      <div className="text-[11px] text-[var(--ink-soft)]">{label}</div>
    </div>
  )
}

/** Points down while the stages are stacked, right once they sit in a row. */
function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 rotate-90 self-center text-[var(--ink-soft)] md:rotate-0"
    >
      <path d="M4 12H20M20 12L14.5 6.5M20 12L14.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default async function Page() {
  const { snapshot } = await getServerSnapshot()
  const view = buildMetricsView(snapshot)
  const {
    library,
    infra,
    requests,
    downloads,
    system,
    services,
    drives,
    media,
    recentlyAdded,
    hostIo,
    quality,
    blocked,
    stale,
    uptime,
    growth,
    containers,
  } = view

  const libraryBytes = library.movieBytes + library.seriesBytes
  const mediaUsed = infra.mediaTotalBytes - infra.mediaFreeBytes
  const mediaRatio = infra.mediaTotalBytes > 0 ? mediaUsed / infra.mediaTotalBytes : 0
  const movieShare = libraryBytes > 0 ? library.movieBytes / libraryBytes : 0
  const loadPerCore = infra.cpuCores > 0 ? infra.load1 / infra.cpuCores : 0
  const probeRatio = infra.probesTotal > 0 ? infra.probesUp / infra.probesTotal : 0
  const probesDown = Math.max(infra.probesTotal - infra.probesUp, 0)
  const stamp = formatClock(view.generatedAt)

  // Whatever Radarr and Sonarr track but have not got yet, and that is not
  // flagged missing, is still unreleased or unaired.
  const moviesPending = Math.max(library.movies - library.moviesDownloaded - library.moviesMissing, 0)
  const ultraHd = quality.filter((bucket) => bucket.label.includes('2160')).reduce((sum, b) => sum + b.count, 0)
  const percentOfRequests = (value: number) =>
    requests.total > 0 ? Math.round((value / requests.total) * 100) : 0
  const approvedShare = percentOfRequests(requests.approved)
  const availableShare = percentOfRequests(requests.available)

  const uptimeByKey = new Map(uptime.map((entry) => [entry.key, entry]))
  const uptimeDays = uptime.reduce((max, entry) => Math.max(max, entry.daily.length), 0)

  const growthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const growthFirst = growth.find((point) => typeof point.libraryBytes === 'number')?.libraryBytes ?? null
  const growthLast = [...growth].reverse().find((point) => typeof point.libraryBytes === 'number')?.libraryBytes ?? null
  const growthAdded = growthFirst !== null && growthLast !== null ? growthLast - growthFirst : null
  // Plotted as bytes added since the window opened, not absolute size: a week
  // of growth against a multi-terabyte baseline is a flat line, and the change
  // is the whole point of the panel.
  const growthPoints: TracePoint[] =
    growthFirst === null
      ? []
      : growth.map((point) => ({
          label: growthFormatter.format(new Date(point.t * 1000)),
          values: { bytes: point.libraryBytes === null ? null : point.libraryBytes - growthFirst },
        }))
  const growthStart = growth.length > 0 ? growthFormatter.format(new Date(growth[0].t * 1000)) : ''
  // Releases carrying .exe/.scr payloads are the reason most imports stall.
  const unsafeBlocked = blocked.filter((item) => /executable|dangerous/i.test(item.reason)).length
  const oldestBlockedDays = blocked.reduce((max, item) => Math.max(max, item.ageDays ?? 0), 0)

  // Seeds the first paint from the rolling history so the charts are never
  // empty; the client immediately refetches the selected range from Prometheus.
  const seedSeries = view.history
    .map((point) => ({
      t: Math.floor(new Date(point.timestamp).getTime() / 1000),
      cpu: point.cpuPercent,
      ram: point.memoryPercent,
      netRx: point.netRxBytes ?? null,
      netTx: point.netTxBytes ?? null,
    }))
    .filter((point) => Number.isFinite(point.t))
  const episodesPending = Math.max(library.episodes - library.episodesDownloaded - library.episodesMissing, 0)

  return (
    <div className="space-y-4">
      <header className="surface-panel rounded-2xl p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: 'var(--status-up)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-up) 18%, transparent)' }}
              />
              <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--ink)]">mic-server</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--ink-soft)]">
              An Ubuntu box in my apartment running the media library, the request pipeline, and its own monitoring
              stack. It serves its own metrics, and this page reads them about once a minute.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="https://watch.codebymic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Open Jellyfin
              </a>
              <a
                href="https://requests.codebymic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Request something
              </a>
              <Link
                href="/projects"
                className="rounded-lg border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Projects
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-6xl font-semibold leading-none tracking-tight text-[var(--ink-strong)] md:text-7xl">
              {formatTB(libraryBytes)}
            </div>
            <div className="mt-2 text-sm text-[var(--ink-soft)]">of movies and television on disk</div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-[var(--ink-soft)]">
                Up{' '}
                <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                  {formatUptime(system.uptimeHours)}
                </span>
              </span>
              <span className="text-[var(--ink-soft)]">
                <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                  {view.servicesUp}/{services.length}
                </span>{' '}
                services up
              </span>
              <span className="text-[var(--ink-soft)]">
                {view.live && stamp ? `Updated ${stamp}` : 'Last known snapshot'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Movies"
          value={formatCount(library.movies)}
          foot={`${formatCount(library.moviesMissing)} missing`}
          stale={stale.library.has('movies')}
        />
        <StatTile
          label="Series"
          value={formatCount(library.series)}
          foot={`${formatCount(library.seasons)} seasons`}
          stale={stale.library.has('series')}
        />
        <StatTile
          label="Episodes"
          value={formatCount(library.episodes)}
          foot={`${formatCount(library.episodesMissing)} missing`}
          stale={stale.library.has('episodes')}
        />
        <StatTile
          label="Requests"
          value={formatCount(requests.total)}
          foot={`${formatCount(requests.pending)} pending`}
          stale={stale.requests.has('total')}
        />
        <StatTile
          label="Storage free"
          value={formatTB(infra.mediaFreeBytes)}
          foot={`of ${formatTB(infra.mediaTotalBytes)} pool`}
          stale={stale.infra.has('mediaFreeBytes')}
        />
        <StatTile
          label="Indexers"
          value={formatCount(infra.indexersEnabled)}
          foot={`${formatCount(infra.indexerResponseMs)} ms average`}
          stale={stale.infra.has('indexersEnabled')}
        />
      </div>

      <TelemetrySection initialPoints={seedSeries} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <ModuleLabel>Host</ModuleLabel>
          <div className="space-y-5">
            <Meter
              label="Root disk"
              value={`${Math.round(system.rootDiskPercent)}%`}
              ratio={system.rootDiskPercent / 100}
              detail="Operating system and container configuration"
              stale={stale.system.has('rootDiskPercent')}
            />
            <Meter
              label="Memory"
              value={`${Math.round(system.memoryPercent)}%`}
              ratio={system.memoryPercent / 100}
              detail={`${formatGiB(infra.memoryTotalBytes)} installed`}
              stale={stale.system.has('memoryPercent')}
            />
            <Meter
              label="Load average"
              value={infra.load1.toFixed(2)}
              ratio={loadPerCore}
              detail={`${Math.round(loadPerCore * 100)}% of ${formatCount(infra.cpuCores)} cores over one minute`}
              stale={stale.infra.has('load1')}
            />
            <Meter
              label="Uptime checks"
              value={`${formatCount(infra.probesUp)}/${formatCount(infra.probesTotal)}`}
              ratio={probeRatio}
              detail={
                probesDown === 0
                  ? 'Every HTTP probe against the front-end services is passing'
                  : `${formatCount(probesDown)} of ${formatCount(infra.probesTotal)} HTTP probes failing`
              }
              color={availabilitySeverity(probeRatio)}
              stale={stale.infra.has('probesUp')}
            />
          </div>
          <div className="mt-5">
            <MetricRow
              label="Disk read"
              value={formatRate(hostIo.diskReadBytes)}
              stale={stale.hostIo.has('diskReadBytes')}
            />
            <MetricRow
              label="Disk write"
              value={formatRate(hostIo.diskWriteBytes)}
              stale={stale.hostIo.has('diskWriteBytes')}
            />
            <MetricRow
              label="CPU temperature"
              value={`${Math.round(hostIo.cpuTempC)}°C`}
              stale={stale.hostIo.has('cpuTempC')}
            />
            <MetricRow label="CPU cores" value={formatCount(infra.cpuCores)} stale={stale.infra.has('cpuCores')} />
            <MetricRow
              label="Torrent queue"
              value={`${formatCount(downloads.queueCount)} queued · ${formatCount(downloads.seedingCount)} seeding`}
              stale={stale.downloads.has('queueCount')}
            />
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Drives</h2>
            <span className="text-xs text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
              {Math.round(mediaRatio * 100)}% of {formatTB(infra.mediaTotalBytes)}
            </span>
          </div>
          <div className="space-y-5">
            {drives.map((drive) => (
              <DriveBar key={drive.mount} drive={drive} />
            ))}
          </div>
          <p className="mt-5 text-[11px] leading-5 text-[var(--ink-soft)]">
            {formatTB(infra.mediaFreeBytes)} free across the pool.
          </p>
        </Panel>
      </div>

      <Panel>
        <ModuleLabel>How a request becomes something to watch</ModuleLabel>
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-3">
          <PipelineStage stage="Asked for" value={formatCount(requests.total)} label="requests all time" share={1} />
          <Arrow />
          <PipelineStage
            stage="Approved"
            value={formatCount(requests.approved)}
            label={`${approvedShare}% of what was asked`}
            share={requests.total > 0 ? requests.approved / requests.total : 1}
          />
          <Arrow />
          <PipelineStage
            stage="Watchable"
            value={formatCount(requests.available)}
            label={`${availableShare}% fulfilled and in the library`}
            share={requests.total > 0 ? requests.available / requests.total : 1}
          />
        </div>
        {/* The queue is a momentary reading, not a cumulative stage, so it sits
            beside the funnel rather than inside it. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--line)] pt-3.5 text-[11px] text-[var(--ink-soft)]">
          <span>
            Moving through the queue right now:{' '}
            <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {formatCount(downloads.queueCount)}
            </span>{' '}
            queued
          </span>
          <span>
            <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {formatCount(downloads.downloadingCount)}
            </span>{' '}
            downloading at {formatRate(downloads.downloadRateBytes)}
          </span>
          <span>
            <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {formatCount(downloads.seedingCount)}
            </span>{' '}
            seeding at {formatRate(downloads.uploadRateBytes)}
          </span>
          <span>
            {formatCount(requests.pending)} awaiting a decision · {formatCount(infra.indexersEnabled)} indexers searched
          </span>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.55fr]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Playing now</h2>
            <span className="text-xs text-[var(--ink-soft)]">via Jellyfin</span>
          </div>
          <div className="text-5xl font-semibold leading-none tracking-tight text-[var(--ink-strong)]">
            {formatCount(media.activeStreams)}
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {media.activeStreams === 1 ? 'active stream' : 'active streams'}
          </p>
          <div className="mt-5">
            <MetricRow label="Direct play" value={formatCount(media.directPlays)} />
            <MetricRow label="Transcoding" value={formatCount(media.transcodes)} />
            <MetricRow
              label="Playable in Jellyfin"
              value={`${formatCount(media.movies)} films · ${formatCount(media.series)} shows`}
            />
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[var(--ink-soft)]">
            Jellyfin counts what is on disk and playable. The library numbers above count everything Radarr and Sonarr
            track, including what has not arrived yet.
          </p>
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Recently added</h2>
            <span className="text-xs text-[var(--ink-soft)]">newest first</span>
          </div>
          {recentlyAdded.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Nothing new since the last snapshot.</p>
          ) : (
            <ol className="space-y-2">
              {recentlyAdded.map((title, index) => (
                <li
                  key={title}
                  className="flex items-baseline gap-3 border-b border-[var(--line)] pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-[11px] tabular-nums text-[var(--ink-soft)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-[var(--ink)]">{title}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Film quality</h2>
            <span className="text-xs text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
              {formatCount(ultraHd)} in 4K
            </span>
          </div>
          <QualityBars buckets={quality} />
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Stuck downloads</h2>
            <span className="text-xs text-[var(--ink-soft)]">finished but never imported</span>
          </div>
          {blocked.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] px-3 py-2.5">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: 'var(--status-up)',
                  boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-up) 18%, transparent)',
                }}
              />
              <span className="text-sm text-[var(--ink)]">Everything that finished made it into the library.</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold leading-none tracking-tight text-[var(--status-down)]">
                  {formatCount(blocked.length)}
                </span>
                <span className="text-sm text-[var(--ink-soft)]">
                  waiting on a decision{unsafeBlocked > 0 && `, ${formatCount(unsafeBlocked)} carrying executables`}
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {blocked.slice(0, 5).map((item, index) => (
                  <li key={`${item.source}-${item.title}-${index}`} className="border-b border-[var(--line)] pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]" title={item.title}>
                        {item.title}
                      </span>
                      {item.ageDays !== null && (
                        <span className="shrink-0 text-xs text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
                          {formatCount(item.ageDays)}d
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--ink-soft)]" title={item.reason}>
                      {item.reason}
                    </div>
                  </li>
                ))}
              </ul>
              {blocked.length > 5 && (
                <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
                  and {formatCount(blocked.length - 5)} more, oldest waiting {formatCount(oldestBlockedDays)} days.
                </p>
              )}
            </>
          )}
        </Panel>
      </div>

      {growthPoints.length >= 2 && (
        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Library growth</h2>
            <span className="text-xs text-[var(--ink-soft)]">
              {growthAdded !== null
                ? `${formatBytes(growthAdded)} added since ${growthStart} · ${formatTB(growthLast ?? 0)} on disk`
                : 'daily samples'}
            </span>
          </div>
          <Trace
            points={growthPoints}
            series={[{ key: 'bytes', name: `Added since ${growthStart}`, color: 'var(--series-cpu)' }]}
            format="bytes"
            height={200}
            emptyLabel="Collecting daily samples. The curve appears once the server has a few days of history."
          />
        </Panel>
      )}

      {containers.length > 0 && (
        <ContainerOrbitPanel containers={containers} hostCpuPercent={system.cpuPercent} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <ModuleLabel>What the library is made of</ModuleLabel>
          <div className="flex h-3 w-full gap-[2px]">
            <div className="h-full rounded-l-full" style={{ width: `${movieShare * 100}%`, background: 'var(--series-cpu)' }} />
            <div className="h-full rounded-r-full" style={{ width: `${(1 - movieShare) * 100}%`, background: 'var(--series-ram)' }} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--series-cpu)' }} />
              Movies
              <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                {formatTB(library.movieBytes)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--series-ram)' }} />
              Television
              <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                {formatTB(library.seriesBytes)}
              </span>
            </span>
          </div>

          <div className="mt-7 space-y-6">
            <SegmentBar
              title="Movies"
              total={library.movies}
              totalLabel={`${formatCount(library.movies)} tracked`}
              segments={[
                { label: 'Downloaded', value: library.moviesDownloaded, color: 'var(--series-cpu)' },
                { label: 'Missing', value: library.moviesMissing, color: 'var(--series-ram)' },
                { label: 'Unreleased', value: moviesPending, color: 'var(--series-muted)' },
              ]}
            />
            <SegmentBar
              title="Episodes"
              total={library.episodes}
              totalLabel={`${formatCount(library.episodes)} tracked`}
              segments={[
                { label: 'Downloaded', value: library.episodesDownloaded, color: 'var(--series-cpu)' },
                { label: 'Missing', value: library.episodesMissing, color: 'var(--series-ram)' },
                { label: 'Not yet aired', value: episodesPending, color: 'var(--series-muted)' },
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Services</h2>
            <span className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              {infra.healthIssues > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: 'var(--series-third)',
                    border: '1px solid color-mix(in srgb, var(--series-third) 45%, var(--line))',
                  }}
                >
                  {formatCount(infra.healthIssues)} health {infra.healthIssues === 1 ? 'warning' : 'warnings'}
                </span>
              )}
              {view.servicesUp} of {services.length} responding
            </span>
          </div>
          {uptime.length > 0 ? (
            <>
              <div>
                {services.map((service) => (
                  <UptimeRow
                    key={service.key}
                    name={service.name}
                    up={service.up}
                    uptime={uptimeByKey.get(service.key)}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[var(--ink-soft)]">
                <span>{uptimeDays} days ago</span>
                <span>today</span>
              </div>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <Lamp key={service.key} name={service.name} up={service.up} />
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">
            Prometheus scrapes the Radarr, Sonarr and Prowlarr exporters alongside node-exporter and blackbox probes.
            The same series feed the Grafana dashboards on the private side.
            {uptime.length > 0 && ' A service without a strip has no HTTP probe pointed at it.'}
          </p>
        </Panel>
      </div>
    </div>
  )
}
