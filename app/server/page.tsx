import type { Metadata } from 'next'
import Link from 'next/link'

import { Trace, type TracePoint } from 'app/components/trace'
import { getServerSnapshot } from 'app/lib/server-dashboard'
import {
  buildMetricsView,
  formatClock,
  formatCount,
  formatGiB,
  formatRate,
  formatTB,
  formatUptime,
  type Drive,
  type MetricsView,
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

function Panel({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <section className={`surface-card rounded-2xl p-5 md:p-6 ${className}`}>{children}</section>
}

function ModuleLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <h2 className="mb-4 text-sm font-medium text-[var(--ink-soft)]">{children}</h2>
}

function StatTile({ label, value, foot }: Readonly<{ label: string; value: string; foot?: string }>) {
  return (
    <div className="surface-card rounded-xl px-4 py-3.5">
      <div className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{label}</div>
      {foot && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{foot}</div>}
    </div>
  )
}

function Meter({
  label,
  value,
  detail,
  ratio,
  color,
}: Readonly<{ label: string; value: string; detail?: string; ratio: number; color?: string }>) {
  const clamped = Math.min(Math.max(ratio, 0), 1)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[var(--ink-soft)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
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

function formatIdle(minutes: number) {
  if (minutes < 90) {
    return `${Math.round(minutes)}m idle`
  }
  if (minutes < 60 * 48) {
    return `${Math.round(minutes / 60)}h idle`
  }
  return `${Math.round(minutes / 1440)}d idle`
}

function MetricRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2 last:border-b-0">
      <span className="text-sm text-[var(--ink-soft)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
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

function PipelineStage({ stage, value, label }: Readonly<{ stage: string; value: string; label: string }>) {
  return (
    <div className="surface-card min-w-0 flex-1 rounded-xl px-4 py-3">
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

function clockLabel(timestamp: string) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

function tracePoints(view: MetricsView, map: (point: MetricsView['history'][number]) => Record<string, number | null>): TracePoint[] {
  return view.history.slice(-48).map((point) => ({ label: clockLabel(point.timestamp), values: map(point) }))
}

export default async function Page() {
  const { snapshot } = await getServerSnapshot()
  const view = buildMetricsView(snapshot)
  const { library, infra, requests, downloads, system, services, drives, media, recentlyAdded, hostIo, quality, stalled } =
    view

  const libraryBytes = library.movieBytes + library.seriesBytes
  const mediaUsed = infra.mediaTotalBytes - infra.mediaFreeBytes
  const mediaRatio = infra.mediaTotalBytes > 0 ? mediaUsed / infra.mediaTotalBytes : 0
  const movieShare = libraryBytes > 0 ? library.movieBytes / libraryBytes : 0
  const loadPerCore = infra.cpuCores > 0 ? infra.load1 / infra.cpuCores : 0
  const stamp = formatClock(view.generatedAt)

  // Whatever Radarr and Sonarr track but have not got yet, and that is not
  // flagged missing, is still unreleased or unaired.
  const moviesPending = Math.max(library.movies - library.moviesDownloaded - library.moviesMissing, 0)
  const ultraHd = quality.filter((bucket) => bucket.label.includes('2160')).reduce((sum, b) => sum + b.count, 0)
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
        <StatTile label="Movies" value={formatCount(library.movies)} foot={`${formatCount(library.moviesMissing)} missing`} />
        <StatTile label="Series" value={formatCount(library.series)} foot={`${formatCount(library.seasons)} seasons`} />
        <StatTile label="Episodes" value={formatCount(library.episodes)} foot={`${formatCount(library.episodesMissing)} missing`} />
        <StatTile label="Requests" value={formatCount(requests.total)} foot={`${formatCount(requests.pending)} pending`} />
        <StatTile label="Containers" value={formatCount(infra.containersRunning)} foot={`${formatCount(infra.cpuCores)} CPU cores`} />
        <StatTile label="Indexers" value={formatCount(infra.indexersEnabled)} foot={`${formatCount(infra.indexerResponseMs)} ms average`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">
              Host load, last {Math.min(view.history.length, 48)} samples
            </h2>
            <span className="text-xs text-[var(--ink-soft)]">percent of capacity</span>
          </div>
          <Trace
            points={tracePoints(view, (point) => ({ cpu: point.cpuPercent, ram: point.memoryPercent }))}
            series={[
              { key: 'cpu', name: 'CPU', color: 'var(--series-cpu)' },
              { key: 'ram', name: 'Memory', color: 'var(--series-ram)' },
            ]}
            max={100}
            format="percent"
          />
        </Panel>

        <Panel>
          <ModuleLabel>Host</ModuleLabel>
          <div className="space-y-5">
            <Meter
              label="Root disk"
              value={`${Math.round(system.rootDiskPercent)}%`}
              ratio={system.rootDiskPercent / 100}
              detail="Operating system and container configuration"
            />
            <Meter
              label="Memory"
              value={`${Math.round(system.memoryPercent)}%`}
              ratio={system.memoryPercent / 100}
              detail={`${formatGiB(infra.memoryTotalBytes)} installed`}
            />
            <Meter
              label="Load average"
              value={infra.load1.toFixed(2)}
              ratio={loadPerCore}
              detail={`${Math.round(loadPerCore * 100)}% of ${formatCount(infra.cpuCores)} cores over one minute`}
            />
            <Meter
              label="Uptime checks"
              value={`${formatCount(infra.probesUp)}/${formatCount(infra.probesTotal)}`}
              ratio={infra.probesTotal > 0 ? infra.probesUp / infra.probesTotal : 0}
              detail="HTTP probes against the front-end services"
              color="var(--status-up)"
            />
          </div>
        </Panel>
      </div>

      <Panel>
        <ModuleLabel>How a request becomes something to watch</ModuleLabel>
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-3">
          <PipelineStage stage="Asked for" value={formatCount(requests.total)} label="requests all time" />
          <Arrow />
          <PipelineStage stage="Searched" value={formatCount(infra.indexersEnabled)} label="indexers enabled" />
          <Arrow />
          <PipelineStage
            stage="Downloading"
            value={formatCount(downloads.queueCount)}
            label={`${formatRate(downloads.downloadRateBytes)} right now`}
          />
          <Arrow />
          <PipelineStage stage="Watchable" value={formatCount(requests.available)} label="fulfilled and in the library" />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.55fr]">
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

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Throughput</h2>
            <span className="text-xs text-[var(--ink-soft)]">whole host, not just downloads</span>
          </div>
          <Trace
            // Host throughput started being recorded after the rest of the
            // series, so drop the leading points that predate it rather than
            // drawing a stub against a mostly-empty axis.
            points={tracePoints(view, (point) => ({
              rx: point.netRxBytes ?? null,
              tx: point.netTxBytes ?? null,
            })).filter((point) => point.values.rx !== null || point.values.tx !== null)}
            series={[
              { key: 'rx', name: 'Network in', color: 'var(--series-cpu)' },
              { key: 'tx', name: 'Network out', color: 'var(--series-ram)' },
            ]}
            format="rate"
            height={158}
            emptyLabel="Collecting samples. Network throughput appears once a few have been recorded."
          />
          <div className="mt-4">
            <MetricRow label="Disk read" value={formatRate(hostIo.diskReadBytes)} />
            <MetricRow label="Disk write" value={formatRate(hostIo.diskWriteBytes)} />
            <MetricRow label="CPU temperature" value={`${Math.round(hostIo.cpuTempC)}°C`} />
            <MetricRow
              label="Torrent queue"
              value={`${formatCount(downloads.queueCount)} · ${formatRate(downloads.downloadRateBytes)}`}
            />
          </div>
        </Panel>
      </div>

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
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Stalled downloads</h2>
            <span className="text-xs text-[var(--ink-soft)]">no progress in 30+ minutes</span>
          </div>
          {stalled.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] px-3 py-2.5">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: 'var(--status-up)',
                  boxShadow: '0 0 0 3px color-mix(in srgb, var(--status-up) 18%, transparent)',
                }}
              />
              <span className="text-sm text-[var(--ink)]">Nothing stuck. Every unfinished download is moving.</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {stalled.map((torrent) => (
                <li key={torrent.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]" title={torrent.name}>
                      {torrent.name}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--status-down)] [font-variant-numeric:tabular-nums]">
                      {formatIdle(torrent.idleMinutes)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'var(--chart-track)' }}
                    role="img"
                    aria-label={`${Math.round(torrent.progress * 100)} percent complete`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${torrent.progress * 100}%`, background: 'var(--status-down)' }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--ink-soft)]">
                    {Math.round(torrent.progress * 100)}% of {formatTB(torrent.sizeBytes ?? 0, 2)} · {torrent.state}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

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
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <Lamp key={service.key} name={service.name} up={service.up} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">
            Prometheus scrapes the Radarr, Sonarr and Prowlarr exporters alongside node-exporter and blackbox probes.
            The same series feed the Grafana dashboards on the private side.
          </p>
        </Panel>
      </div>
    </div>
  )
}
