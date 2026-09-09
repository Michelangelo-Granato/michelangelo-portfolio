const METRICS_URL_ENV = 'HOMELAB_METRICS_URL'
const METRICS_TOKEN_ENV = 'HOMELAB_METRICS_TOKEN'

/** The homelab is on residential internet, so a slow or half-up server must
 *  never hold a page render open. Past this we fall back. */
const FETCH_TIMEOUT_MS = 6000

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

export interface DriveSnapshot {
  mount: string
  totalBytes: NullableNumber
  freeBytes: NullableNumber
}

/** Whole-host throughput, which shows activity the download client misses. */
export interface HostIoSnapshot {
  netRxBytes: NullableNumber
  netTxBytes: NullableNumber
  diskReadBytes: NullableNumber
  diskWriteBytes: NullableNumber
  cpuTempC: NullableNumber
}

export interface QualityBucket {
  label: string
  count: number
}

/** An unfinished torrent that has not moved for a while. */
export interface StalledTorrent {
  name: string
  state: string
  progress: number
  idleMinutes: number
  sizeBytes: NullableNumber
}

const HOST_IO_KEYS: ReadonlyArray<keyof HostIoSnapshot> = [
  'netRxBytes',
  'netTxBytes',
  'diskReadBytes',
  'diskWriteBytes',
  'cpuTempC',
]

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
  /** Library totals from the Radarr and Sonarr Prometheus exporters. */
  library?: LibrarySnapshot
  /** Host and monitoring facts from node-exporter, cAdvisor, blackbox and Prowlarr. */
  infrastructure?: InfrastructureSnapshot
  /** One entry per filesystem backing the media pool. */
  drives?: DriveSnapshot[]
  /** Host network, disk and thermal readings. */
  hostIo?: HostIoSnapshot
  /** Downloaded films grouped by release quality, largest first. */
  quality?: QualityBucket[]
  /** Unfinished torrents with no recent activity. */
  stalled?: StalledTorrent[]
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
    netRxBytes?: NullableNumber
    netTxBytes?: NullableNumber
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

function isHistoryPoint(value: unknown): boolean {
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

function isOptionalDriveList(value: unknown): value is DriveSnapshot[] | undefined {
  if (value === undefined) {
    return true
  }

  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (!entry || typeof entry !== 'object') return false
      const drive = entry as Partial<DriveSnapshot>
      return (
        typeof drive.mount === 'string' &&
        isNullableNumber(drive.totalBytes) &&
        isNullableNumber(drive.freeBytes)
      )
    })
  )
}

function isOptionalQualityList(value: unknown): value is QualityBucket[] | undefined {
  if (value === undefined) return true
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as QualityBucket).label === 'string' &&
        typeof (entry as QualityBucket).count === 'number',
    )
  )
}

function isOptionalStalledList(value: unknown): value is StalledTorrent[] | undefined {
  if (value === undefined) return true
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (!entry || typeof entry !== 'object') return false
      const torrent = entry as Partial<StalledTorrent>
      return (
        typeof torrent.name === 'string' &&
        typeof torrent.state === 'string' &&
        typeof torrent.progress === 'number' &&
        typeof torrent.idleMinutes === 'number' &&
        isNullableNumber(torrent.sizeBytes)
      )
    })
  )
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
    isOptionalDriveList(snapshot.drives) &&
    isOptionalMetricSection<HostIoSnapshot>(snapshot.hostIo, HOST_IO_KEYS) &&
    isOptionalQualityList(snapshot.quality) &&
    isOptionalStalledList(snapshot.stalled) &&
    Array.isArray(snapshot.history) &&
    snapshot.history.every((point) => isHistoryPoint(point))
  )
}

/**
 * Pulls the snapshot from the homelab's token-gated metrics endpoint. The
 * response comes from a machine on the public internet, so it is validated
 * exactly like any other untrusted input before it reaches the page.
 */
export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const url = process.env[METRICS_URL_ENV]
  const token = process.env[METRICS_TOKEN_ENV]

  if (!url || !token) {
    return null
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as unknown
    return isDashboardSnapshot(json) ? json : null
  } catch {
    return null
  }
}
