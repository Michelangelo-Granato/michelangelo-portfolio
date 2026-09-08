import type { Metadata } from 'next'
import Link from 'next/link'

import { LoadTrace, type TracePoint } from 'app/components/load-trace'
import { getServerDashboardData } from 'app/lib/server-dashboard'
import {
  buildMetricsView,
  formatClock,
  formatCount,
  formatGiB,
  formatRate,
  formatTB,
  formatUptime,
  type MetricsView,
} from 'app/lib/server-metrics'

export const metadata: Metadata = {
  title: 'Home Server',
  description: 'Live status board for my home server: library size, host load, storage headroom, and service health.',
}

export const revalidate = 300

/** Meter fills carry severity, so a nearly-full disk reads as full before you
 *  get to the number. */
function severity(ratio: number) {
  if (ratio >= 0.85) return 'var(--status-down)'
  if (ratio >= 0.7) return 'var(--series-third)'
  return 'var(--series-cpu)'
}

function Panel({
  children,
  className = '',
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <section className={`surface-card rounded-2xl p-5 md:p-6 ${className}`}>{children}</section>
  )
}

function ModuleLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <h2 className="mb-4 text-sm font-medium text-[var(--ink-soft)]">{children}</h2>
}

function StatTile({
  label,
  value,
  foot,
}: Readonly<{ label: string; value: string; foot?: string }>) {
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
  const fill = color ?? severity(clamped)

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
        <div className="h-full rounded-full" style={{ width: `${clamped * 100}%`, background: fill }} />
      </div>
      {detail && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{detail}</div>}
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

function PipelineStage({
  stage,
  value,
  label,
}: Readonly<{ stage: string; value: string; label: string }>) {
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

function toTracePoints(view: MetricsView): TracePoint[] {
  return view.history.slice(-48).map((point) => {
    const date = new Date(point.timestamp)
    return {
      label: Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date),
      cpu: point.cpuPercent,
      ram: point.memoryPercent,
    }
  })
}

export default async function Page() {
  const { snapshot } = await getServerDashboardData()
  const view = buildMetricsView(snapshot)
  const { library, infra, requests, downloads, system, services } = view

  const libraryBytes = library.movieBytes + library.seriesBytes
  const mediaUsed = infra.mediaTotalBytes - infra.mediaFreeBytes
  const mediaRatio = infra.mediaTotalBytes > 0 ? mediaUsed / infra.mediaTotalBytes : 0
  const movieShare = libraryBytes > 0 ? library.movieBytes / libraryBytes : 0
  const stamp = formatClock(view.generatedAt)

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
              stack. These numbers come off it every five minutes.
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
            <div className="mt-2 text-sm text-[var(--ink-soft)]">
              of movies and television on disk
            </div>
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
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Host load, last {Math.min(view.history.length, 48)} samples</h2>
            <span className="text-xs text-[var(--ink-soft)]">percent of capacity</span>
          </div>
          <LoadTrace points={toTracePoints(view)} />
        </Panel>

        <Panel>
          <ModuleLabel>Capacity</ModuleLabel>
          <div className="space-y-5">
            <Meter
              label="Media pool"
              value={`${Math.round(mediaRatio * 100)}%`}
              ratio={mediaRatio}
              detail={`${formatTB(mediaUsed)} used of ${formatTB(infra.mediaTotalBytes)} · ${formatTB(infra.mediaFreeBytes)} free`}
            />
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
          <PipelineStage stage="Downloading" value={formatCount(downloads.queueCount)} label={`${formatRate(downloads.downloadRateBytes)} right now`} />
          <Arrow />
          <PipelineStage stage="Watchable" value={formatCount(requests.available)} label="fulfilled and in the library" />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <ModuleLabel>What the library is made of</ModuleLabel>
          <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
            <div
              className="h-full rounded-l-full"
              style={{ width: `${movieShare * 100}%`, background: 'var(--series-cpu)' }}
            />
            <div
              className="h-full rounded-r-full"
              style={{ width: `${(1 - movieShare) * 100}%`, background: 'var(--series-ram)' }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--series-cpu)' }} />
              Movies
              <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                {formatTB(library.movieBytes)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--series-ram)' }} />
              Television
              <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                {formatTB(library.seriesBytes)}
              </span>
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <Meter
              label="Movies downloaded"
              value={`${formatCount(library.moviesDownloaded)}/${formatCount(library.movies)}`}
              ratio={library.movies > 0 ? library.moviesDownloaded / library.movies : 0}
              detail={`${formatCount(library.moviesWanted)} actively wanted`}
              color="var(--series-cpu)"
            />
            <Meter
              label="Episodes downloaded"
              value={`${formatCount(library.episodesDownloaded)}/${formatCount(library.episodes)}`}
              ratio={library.episodes > 0 ? library.episodesDownloaded / library.episodes : 0}
              detail="Counting everything Sonarr is tracking, aired or not"
              color="var(--series-ram)"
            />
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--ink-soft)]">Services</h2>
            <span className="text-xs text-[var(--ink-soft)]">
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
