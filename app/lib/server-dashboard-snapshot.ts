import { get } from '@vercel/blob'

import { fallbackServerDashboard, type ServerDashboardData } from 'app/data/server'

export const DASHBOARD_SNAPSHOT_BLOB_PATH = 'homelab/server-dashboard/latest.json'

type NullableNumber = number | null

export interface LibrarySnapshot {
  movies: NullableNumber
  moviesDownloaded: NullableNumber
  moviesMissing: NullableNumber
  moviesWanted: NullableNumber
  movieBytes: NullableNumber
  series: NullableNumber
  seasons: NullableNumber
  episodes: NullableNumber
  episodesDownloaded: NullableNumber
  episodesMissing: NullableNumber
  seriesBytes: NullableNumber
}

export interface InfrastructureSnapshot {
  cpuCores: NullableNumber
  memoryTotalBytes: NullableNumber
  load1: NullableNumber
  containersRunning: NullableNumber
  mediaTotalBytes: NullableNumber
  mediaFreeBytes: NullableNumber
  probesUp: NullableNumber
  probesTotal: NullableNumber
  indexersEnabled: NullableNumber
  indexerResponseMs: NullableNumber
  healthIssues: NullableNumber
}

const LIBRARY_KEYS: ReadonlyArray<keyof LibrarySnapshot> = [
  'movies',
  'moviesDownloaded',
  'moviesMissing',
  'moviesWanted',
  'movieBytes',
  'series',
  'seasons',
  'episodes',
  'episodesDownloaded',
  'episodesMissing',
  'seriesBytes',
]

const INFRASTRUCTURE_KEYS: ReadonlyArray<keyof InfrastructureSnapshot> = [
  'cpuCores',
  'memoryTotalBytes',
  'load1',
  'containersRunning',
  'mediaTotalBytes',
  'mediaFreeBytes',
  'probesUp',
  'probesTotal',
  'indexersEnabled',
  'indexerResponseMs',
  'healthIssues',
]

export interface DashboardSnapshot {
  generatedAt: string
  services: {
    jellyfin: { healthy: boolean }
    /** Legacy: the library moved to Jellyfin, so the collector no longer reports Plex. */
    plex?: { healthy: boolean }
    seerr: { healthy: boolean }
    radarr: { healthy: boolean }
    sonarr: { healthy: boolean }
    prowlarr: { healthy: boolean }
    qbittorrent: { healthy: boolean }
    unmanic: { healthy: boolean }
    prometheus: { healthy: boolean }
  }
  media: {
    movies: NullableNumber
    series: NullableNumber
    episodes: NullableNumber
    songs: NullableNumber
    recentlyAdded: string[]
    activeStreams: NullableNumber
    watchTimeHours7d: NullableNumber
    directPlays: NullableNumber
    transcodes: NullableNumber
  }
  requests: {
    total: NullableNumber
    pending: NullableNumber
    approved: NullableNumber
    available: NullableNumber
  }
  downloads: {
    queueCount: NullableNumber
    downloadingCount: NullableNumber
    seedingCount: NullableNumber
    downloadRateBytes: NullableNumber
    uploadRateBytes: NullableNumber
  }
  system: {
    uptimeHours: NullableNumber
    cpuPercent: NullableNumber
    memoryPercent: NullableNumber
    rootDiskPercent: NullableNumber
    mediaDiskFreeBytes: NullableNumber
  }
  /**
   * Library totals scraped straight from the Radarr and Sonarr Prometheus
   * exporters. Optional so snapshots published before these were collected
   * still validate.
   */
  library?: LibrarySnapshot
  /**
   * Host and monitoring-stack facts from node-exporter, cAdvisor, blackbox,
   * and the Prowlarr exporter. Optional for the same reason as `library`.
   */
  infrastructure?: InfrastructureSnapshot
  history: Array<{
    timestamp: string
    cpuPercent: NullableNumber
    memoryPercent: NullableNumber
    rootDiskPercent: NullableNumber
    activeStreams: NullableNumber
    pendingRequests: NullableNumber
    availableRequests: NullableNumber
    downloadRateBytes: NullableNumber
    uploadRateBytes: NullableNumber
  }>
}

function isNullableNumber(value: unknown): value is NullableNumber {
  return value === null || typeof value === 'number'
}

function isBooleanRecord(value: unknown): value is { healthy: boolean } {
  return !!value && typeof value === 'object' && typeof (value as { healthy?: unknown }).healthy === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isHistoryPoint(
  value: unknown,
): value is {
  timestamp: string
  cpuPercent: NullableNumber
  memoryPercent: NullableNumber
  rootDiskPercent: NullableNumber
  activeStreams: NullableNumber
  pendingRequests: NullableNumber
  availableRequests: NullableNumber
  downloadRateBytes: NullableNumber
  uploadRateBytes: NullableNumber
} {
  if (!value || typeof value !== 'object') {
    return false
  }

  const point = value as Partial<DashboardSnapshot['history'][number]>

  return (
    typeof point.timestamp === 'string' &&
    isNullableNumber(point.cpuPercent) &&
    isNullableNumber(point.memoryPercent) &&
    isNullableNumber(point.rootDiskPercent) &&
    isNullableNumber(point.activeStreams) &&
    isNullableNumber(point.pendingRequests) &&
    isNullableNumber(point.availableRequests) &&
    isNullableNumber(point.downloadRateBytes) &&
    isNullableNumber(point.uploadRateBytes)
  )
}

/**
 * Optional metric sections validate when absent, or when present with every
 * key set to a number or an explicit null.
 */
function isOptionalMetricSection<T>(value: unknown, keys: ReadonlyArray<keyof T>): value is T | undefined {
  if (value === undefined) {
    return true
  }

  if (!value || typeof value !== 'object') {
    return false
  }

  const section = value as Record<string, unknown>
  return keys.every((key) => isNullableNumber(section[key as string]))
}

export function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Partial<DashboardSnapshot>

  return (
    typeof snapshot.generatedAt === 'string' &&
    isBooleanRecord(snapshot.services?.jellyfin) &&
    (snapshot.services?.plex === undefined || isBooleanRecord(snapshot.services.plex)) &&
    isBooleanRecord(snapshot.services?.seerr) &&
    isBooleanRecord(snapshot.services?.radarr) &&
    isBooleanRecord(snapshot.services?.sonarr) &&
    isBooleanRecord(snapshot.services?.prowlarr) &&
    isBooleanRecord(snapshot.services?.qbittorrent) &&
    isBooleanRecord(snapshot.services?.unmanic) &&
    isBooleanRecord(snapshot.services?.prometheus) &&
    isNullableNumber(snapshot.media?.movies) &&
    isNullableNumber(snapshot.media?.series) &&
    isNullableNumber(snapshot.media?.episodes) &&
    isNullableNumber(snapshot.media?.songs) &&
    isStringArray(snapshot.media?.recentlyAdded) &&
    isNullableNumber(snapshot.media?.activeStreams) &&
    isNullableNumber(snapshot.media?.watchTimeHours7d) &&
    isNullableNumber(snapshot.media?.directPlays) &&
    isNullableNumber(snapshot.media?.transcodes) &&
    isNullableNumber(snapshot.requests?.total) &&
    isNullableNumber(snapshot.requests?.pending) &&
    isNullableNumber(snapshot.requests?.approved) &&
    isNullableNumber(snapshot.requests?.available) &&
    isNullableNumber(snapshot.downloads?.queueCount) &&
    isNullableNumber(snapshot.downloads?.downloadingCount) &&
    isNullableNumber(snapshot.downloads?.seedingCount) &&
    isNullableNumber(snapshot.downloads?.downloadRateBytes) &&
    isNullableNumber(snapshot.downloads?.uploadRateBytes) &&
    isNullableNumber(snapshot.system?.uptimeHours) &&
    isNullableNumber(snapshot.system?.cpuPercent) &&
    isNullableNumber(snapshot.system?.memoryPercent) &&
    isNullableNumber(snapshot.system?.rootDiskPercent) &&
    isNullableNumber(snapshot.system?.mediaDiskFreeBytes) &&
    isOptionalMetricSection<LibrarySnapshot>(snapshot.library, LIBRARY_KEYS) &&
    isOptionalMetricSection<InfrastructureSnapshot>(snapshot.infrastructure, INFRASTRUCTURE_KEYS) &&
    Array.isArray(snapshot.history) &&
    snapshot.history.every((point) => isHistoryPoint(point))
  )
}

function formatCount(value: NullableNumber, fallback: string, suffix?: string) {
  if (value === null) {
    return fallback
  }

  const rendered = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
  return suffix ? `${rendered} ${suffix}` : rendered
}

function formatHours(value: NullableNumber, fallback: string) {
  if (value === null) {
    return fallback
  }

  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}h`
}

function formatPercent(value: NullableNumber, fallback: string) {
  if (value === null) {
    return fallback
  }

  return `${Math.round(value)}%`
}

function formatBytes(value: NullableNumber, fallback: string) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: unitIndex < 3 ? 0 : 1,
  })

  return `${formatter.format(size)} ${units[unitIndex]}`
}

function formatBytesPerSecond(value: NullableNumber, fallback: string) {
  const bytes = formatBytes(value, fallback)
  return bytes === fallback ? fallback : `${bytes}/s`
}

function formatUpdatedAt(generatedAt: string) {
  const date = new Date(generatedAt)

  if (Number.isNaN(date.getTime())) {
    return fallbackServerDashboard.updatedAt
  }

  return `Live snapshot · ${new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)}`
}

function countHealthyServices(snapshot: DashboardSnapshot) {
  return Object.values(snapshot.services).filter((service) => service.healthy).length
}

function hasNumber(value: NullableNumber): value is number {
  return value !== null
}

function hasAnyNumber(...values: NullableNumber[]) {
  return values.some((value) => hasNumber(value))
}

function formatPluralizedMetric(value: number, fallback: string, singular: string) {
  const suffix = value === 1 ? '' : 's'
  return `${formatCount(value, fallback, singular)}${suffix}`
}

function buildJellyfinServiceDetail(snapshot: DashboardSnapshot) {
  if (hasNumber(snapshot.media.activeStreams)) {
    return `Healthy and currently showing ${formatPluralizedMetric(snapshot.media.activeStreams, 'live', 'active stream')}.`
  }

  return 'Healthy and serving the public playback surface for the library.'
}

function buildSeerrServiceDetail(snapshot: DashboardSnapshot) {
  if (hasNumber(snapshot.requests.pending)) {
    return `Healthy and currently tracking ${formatPluralizedMetric(snapshot.requests.pending, 'live', 'pending request')}.`
  }

  return 'Healthy and receiving requests before the automation stack picks them up.'
}

function buildRadarrSonarrServiceDetail(snapshot: DashboardSnapshot) {
  if (hasNumber(snapshot.requests.available)) {
    return `Healthy, with ${formatPluralizedMetric(snapshot.requests.available, 'live', 'available item')} already through the pipeline.`
  }

  return 'Healthy and ready to route movie and TV requests into the library.'
}

function buildQbittorrentServiceDetail(snapshot: DashboardSnapshot) {
  if (hasNumber(snapshot.downloads.queueCount)) {
    return `Healthy, with ${formatPluralizedMetric(snapshot.downloads.queueCount, 'live', 'queued job')} and transfer stats available.`
  }

  return 'Healthy and ready to take over once a request becomes a download.'
}

function buildPrometheusServiceDetail(snapshot: DashboardSnapshot) {
  if (hasAnyNumber(snapshot.system.cpuPercent, snapshot.system.memoryPercent)) {
    return `Healthy and scraping host metrics like CPU ${formatPercent(snapshot.system.cpuPercent, 'n/a')} and RAM ${formatPercent(snapshot.system.memoryPercent, 'n/a')}.`
  }

  return 'Healthy and collecting the private metrics that feed the portfolio view.'
}

function buildServiceDetails(snapshot: DashboardSnapshot) {
  return {
    jellyfin: buildJellyfinServiceDetail(snapshot),
    seerr: buildSeerrServiceDetail(snapshot),
    radarrSonarr: buildRadarrSonarrServiceDetail(snapshot),
    prowlarr:
      snapshot.services.prowlarr.healthy
        ? 'Healthy and still acting as the indexer broker for the rest of the stack.'
        : 'Currently degraded, so indexer lookups may be delayed until it comes back.',
    qbittorrent: buildQbittorrentServiceDetail(snapshot),
    prometheus: buildPrometheusServiceDetail(snapshot),
    access: snapshot.services.prometheus.healthy
      ? 'Caddy still fronts the public pieces while the metrics lane stays private behind the monitoring stack.'
      : 'Caddy still fronts the public pieces while the private telemetry lane stays isolated from the public internet.',
  }
}

function buildSnapshotHighlights(snapshot: DashboardSnapshot, healthyServices: number, totalServices: number) {
  const requestFlowValue = hasNumber(snapshot.requests.pending)
    ? `${formatCount(snapshot.requests.pending, '0')} pending`
    : fallbackServerDashboard.highlights[2].value
  const requestFlowDetail = hasNumber(snapshot.requests.total)
    ? `${formatCount(snapshot.requests.total, 'Live')} total requests are represented in the latest snapshot.`
    : fallbackServerDashboard.highlights[2].detail
  const observabilityValue = hasAnyNumber(snapshot.system.cpuPercent, snapshot.system.memoryPercent)
    ? `CPU ${formatPercent(snapshot.system.cpuPercent, 'n/a')} · RAM ${formatPercent(snapshot.system.memoryPercent, 'n/a')}`
    : fallbackServerDashboard.highlights[3].value
  const observabilityDetail = hasNumber(snapshot.system.uptimeHours)
    ? `Host uptime is ${formatHours(snapshot.system.uptimeHours, 'n/a')} with Prometheus feeding the private metrics lane.`
    : fallbackServerDashboard.highlights[3].detail

  return [
    {
      label: 'Public surfaces',
      value: '2',
      detail: 'The public entry points stay small while the rest of the telemetry remains private and server-side.',
      accent: 'red' as const,
    },
    {
      label: 'Tracked services',
      value: `${healthyServices}/${totalServices}`,
      detail: 'This counts the main streaming, request, automation, and telemetry pieces currently reporting healthy.',
      accent: 'blue' as const,
    },
    {
      label: 'Request flow',
      value: requestFlowValue,
      detail: requestFlowDetail,
      accent: 'yellow' as const,
    },
    {
      label: 'Observability',
      value: observabilityValue,
      detail: observabilityDetail,
      accent: 'red' as const,
    },
  ]
}

function buildSnapshotMedia(snapshot: DashboardSnapshot) {
  const recentlyAddedValue =
    snapshot.media.recentlyAdded.length > 0
      ? snapshot.media.recentlyAdded.slice(0, 2).join(' · ')
      : fallbackServerDashboard.media[1].value
  // Jellyfin is the richer source, but it needs an API key. When that is
  // missing the Radarr and Sonarr exporters still know how big the library is,
  // so fall back to those before falling back to curated copy.
  const movies = snapshot.media.movies ?? snapshot.library?.movies ?? null
  const series = snapshot.media.series ?? snapshot.library?.series ?? null
  const episodes = snapshot.media.episodes ?? snapshot.library?.episodes ?? null

  const libraryValue = hasAnyNumber(movies, series)
    ? `${formatCount(movies, '?')} movies · ${formatCount(series, '?')} shows`
    : fallbackServerDashboard.media[0].value
  const libraryDescription = hasNumber(episodes)
    ? hasNumber(snapshot.media.songs)
      ? `The live snapshot is currently seeing ${formatCount(episodes, '?')} episodes and ${formatCount(snapshot.media.songs, '?')} songs across the library.`
      : `The live snapshot is currently tracking ${formatCount(episodes, '?')} episodes across ${formatCount(series, '?')} series.`
    : fallbackServerDashboard.media[0].description
  const playbackValue = hasAnyNumber(snapshot.media.activeStreams, snapshot.media.watchTimeHours7d)
    ? `${formatCount(snapshot.media.activeStreams, '0')} active · ${formatHours(snapshot.media.watchTimeHours7d, 'n/a')} / 7d`
    : fallbackServerDashboard.media[2].value
  const playbackDescription = hasNumber(snapshot.media.activeStreams)
    ? `Jellyfin is currently reporting ${formatPluralizedMetric(snapshot.media.activeStreams, '0', 'active stream')} in the latest sample.`
    : fallbackServerDashboard.media[2].description
  const transcodeValue = hasAnyNumber(snapshot.media.directPlays, snapshot.media.transcodes)
    ? `${formatCount(snapshot.media.directPlays, '0')} direct · ${formatCount(snapshot.media.transcodes, '0')} transcodes`
    : fallbackServerDashboard.media[3].value
  const transcodeDescription = hasNumber(snapshot.media.transcodes)
    ? 'This keeps an eye on how often playback stays efficient versus how often the server has to transcode.'
    : fallbackServerDashboard.media[3].description

  return [
    {
      ...fallbackServerDashboard.media[0],
      value: libraryValue,
      description: libraryDescription,
    },
    {
      ...fallbackServerDashboard.media[1],
      value: recentlyAddedValue,
      description:
        snapshot.media.recentlyAdded.length > 0
          ? 'These are the newest items making it into the live snapshot right now, straight from the media layer.'
          : fallbackServerDashboard.media[1].description,
    },
    {
      ...fallbackServerDashboard.media[2],
      value: playbackValue,
      description: playbackDescription,
    },
    {
      ...fallbackServerDashboard.media[3],
      value: transcodeValue,
      description: transcodeDescription,
    },
  ]
}

function buildSnapshotSystems(snapshot: DashboardSnapshot, healthyServices: number, totalServices: number) {
  const monitoringValue = hasAnyNumber(snapshot.system.cpuPercent, snapshot.system.memoryPercent)
    ? `CPU ${formatPercent(snapshot.system.cpuPercent, 'n/a')} · RAM ${formatPercent(snapshot.system.memoryPercent, 'n/a')}`
    : fallbackServerDashboard.systems[0].value
  const storageValue = hasAnyNumber(snapshot.system.rootDiskPercent, snapshot.system.mediaDiskFreeBytes)
    ? `Root ${formatPercent(snapshot.system.rootDiskPercent, 'n/a')} · Media ${formatBytes(snapshot.system.mediaDiskFreeBytes, 'n/a')} free`
    : fallbackServerDashboard.systems[1].value
  const storageDescription = hasNumber(snapshot.system.mediaDiskFreeBytes)
    ? 'This is the live storage readout for the box, split between system pressure and remaining media headroom.'
    : fallbackServerDashboard.systems[1].description
  const opsValue = hasNumber(snapshot.system.uptimeHours)
    ? `Uptime ${formatHours(snapshot.system.uptimeHours, 'n/a')} · ${healthyServices}/${totalServices} healthy`
    : fallbackServerDashboard.systems[3].value
  const opsDescription = hasNumber(snapshot.system.uptimeHours)
    ? 'This is the operational view I care about most: is the host up, and are the services I actually care about still responding?'
    : fallbackServerDashboard.systems[3].description

  return [
    {
      ...fallbackServerDashboard.systems[0],
      value: monitoringValue,
      description: snapshot.services.prometheus.healthy
        ? 'These numbers are coming from the monitoring stack rather than being guessed in the app layer.'
        : fallbackServerDashboard.systems[0].description,
    },
    {
      ...fallbackServerDashboard.systems[1],
      value: storageValue,
      description: storageDescription,
    },
    {
      ...fallbackServerDashboard.systems[2],
      value: healthyServices === totalServices ? 'Public up · Private up' : `${healthyServices}/${totalServices} reporting`,
      description: fallbackServerDashboard.systems[2].description,
    },
    {
      ...fallbackServerDashboard.systems[3],
      value: opsValue,
      description: opsDescription,
    },
  ]
}

function buildSnapshotRequests(snapshot: DashboardSnapshot) {
  const requestPipelineValue = hasAnyNumber(snapshot.requests.pending, snapshot.requests.available)
    ? `${formatCount(snapshot.requests.pending, '0')} pending -> ${formatCount(snapshot.requests.available, '0')} available`
    : fallbackServerDashboard.requests[0].value
  const trendValue = hasAnyNumber(snapshot.requests.approved, snapshot.requests.total)
    ? `${formatCount(snapshot.requests.approved, '0')} approved · ${formatCount(snapshot.requests.total, '0')} total`
    : fallbackServerDashboard.requests[1].value
  const demandValue = hasAnyNumber(snapshot.downloads.downloadingCount, snapshot.downloads.queueCount)
    ? `${formatCount(snapshot.downloads.downloadingCount, '0')} active dl · ${formatCount(snapshot.downloads.queueCount, '0')} queued`
    : fallbackServerDashboard.requests[2].value
  const demandDescription = hasNumber(snapshot.downloads.downloadRateBytes)
    ? `Current transfer rate is ${formatBytesPerSecond(snapshot.downloads.downloadRateBytes, 'n/a')} down and ${formatBytesPerSecond(snapshot.downloads.uploadRateBytes, 'n/a')} up.`
    : fallbackServerDashboard.requests[2].description

  return [
    {
      ...fallbackServerDashboard.requests[0],
      value: requestPipelineValue,
    },
    {
      ...fallbackServerDashboard.requests[1],
      value: trendValue,
    },
    {
      ...fallbackServerDashboard.requests[2],
      value: demandValue,
      description: demandDescription,
    },
  ]
}

function buildSnapshotContainers(snapshot: DashboardSnapshot) {
  const jellyfinStatus = snapshot.services.jellyfin.healthy ? 'up' : 'down'
  const seerrStatus = snapshot.services.seerr.healthy ? 'up' : 'down'
  const automationStatus = snapshot.services.radarr.healthy && snapshot.services.sonarr.healthy ? 'both responding' : 'partially degraded'
  const qbittorrentStatus = snapshot.services.qbittorrent.healthy ? 'up' : 'down'
  const unmanicStatus = snapshot.services.unmanic.healthy ? 'up' : 'down'
  const prometheusStatus = snapshot.services.prometheus.healthy ? 'up' : 'down'

  return [
    {
      ...fallbackServerDashboard.containers[0],
      detail: `Jellyfin is ${jellyfinStatus} and serving the library on its own now that Plex is out of the stack.`,
    },
    {
      ...fallbackServerDashboard.containers[1],
      detail: `Seerr is ${seerrStatus}, while Radarr and Sonarr are ${automationStatus} in the latest check.`,
    },
    {
      ...fallbackServerDashboard.containers[2],
      detail: `qBittorrent is ${qbittorrentStatus}, Unmanic is ${unmanicStatus}, and the transfer queue is ${formatCount(snapshot.downloads.queueCount, 'n/a')} items deep.`,
    },
    {
      ...fallbackServerDashboard.containers[3],
      detail: `Prometheus is ${prometheusStatus}, and the metrics pipeline is carrying host and download stats into the portfolio snapshot.`,
    },
  ]
}

export function buildDashboardFromSnapshot(snapshot: DashboardSnapshot): ServerDashboardData {
  const healthyServices = countHealthyServices(snapshot)
  const totalServices = Object.keys(snapshot.services).length
  const serviceDetails = buildServiceDetails(snapshot)
  const serviceDetailsByName: Record<string, string> = {
    Jellyfin: serviceDetails.jellyfin,
    'Requests app': serviceDetails.seerr,
    'Radarr + Sonarr': serviceDetails.radarrSonarr,
    'Prowlarr + Flaresolverr': serviceDetails.prowlarr,
    'qBittorrent + Unmanic': serviceDetails.qbittorrent,
    'Grafana + Prometheus': serviceDetails.prometheus,
    'Caddy + Tailscale + CrowdSec': serviceDetails.access,
  }

  return {
    ...fallbackServerDashboard,
    updatedAt: formatUpdatedAt(snapshot.generatedAt),
    intro: {
      ...fallbackServerDashboard.intro,
      tags: [...fallbackServerDashboard.intro.tags.slice(0, 4), 'Live telemetry'],
    },
    highlights: buildSnapshotHighlights(snapshot, healthyServices, totalServices),
    // Keyed by name rather than array index so reordering or dropping a service
    // cannot silently attach the wrong detail to the wrong card.
    services: fallbackServerDashboard.services.map((service) => ({
      ...service,
      detail: serviceDetailsByName[service.name] ?? service.detail,
    })),
    media: buildSnapshotMedia(snapshot),
    systems: buildSnapshotSystems(snapshot, healthyServices, totalServices),
    requests: buildSnapshotRequests(snapshot),
    containers: buildSnapshotContainers(snapshot),
  }
}

export async function getStoredDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  try {
    // Private store, so the read is authenticated with the store token rather
    // than fetching a public URL. Page-level `revalidate` handles freshness.
    const result = await get(DASHBOARD_SNAPSHOT_BLOB_PATH, { access: 'private' })

    if (!result) {
      return null
    }

    const json = (await new Response(result.stream).json()) as unknown
    return isDashboardSnapshot(json) ? json : null
  } catch {
    return null
  }
}