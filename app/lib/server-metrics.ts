import {
  fallbackDownloadMetrics,
  fallbackDrives,
  fallbackHostIo,
  fallbackMediaMetrics,
  fallbackQuality,
  fallbackRecentlyAdded,
  fallbackInfrastructureMetrics,
  fallbackLibraryMetrics,
  fallbackRequestMetrics,
  fallbackServiceStatus,
  fallbackSystemMetrics,
} from 'app/data/server'
import type {
  BlockedImport,
  DashboardSnapshot,
  GrowthPoint,
  QualityBucket,
  ServiceUptime,
} from 'app/lib/server-dashboard-snapshot'

export type HistoryPoint = DashboardSnapshot['history'][number]

export interface ServiceLamp {
  key: string
  name: string
  up: boolean
}

export interface Drive {
  mount: string
  label: string
  totalBytes: number
  freeBytes: number
  /** Null when the collector has no trend, or the drive is not filling. */
  daysUntilFull: number | null
  /** Signed bytes per day of change in free space; null when unknown. */
  trendBytesPerDay: number | null
}

/** Which fields in a section fell back because the collector reported null.
 *  The page dims these so a last-known figure is never read as a live one. */
export type StaleKeys = ReadonlySet<string>

export interface SectionStaleness {
  library: StaleKeys
  infra: StaleKeys
  requests: StaleKeys
  downloads: StaleKeys
  system: StaleKeys
  media: StaleKeys
  hostIo: StaleKeys
}

export interface MetricsView {
  live: boolean
  generatedAt: string | null
  /** Per-section sets of the keys whose values are fallbacks, not live reads. */
  stale: SectionStaleness
  services: ServiceLamp[]
  servicesUp: number
  library: typeof fallbackLibraryMetrics
  infra: typeof fallbackInfrastructureMetrics
  requests: typeof fallbackRequestMetrics
  downloads: typeof fallbackDownloadMetrics
  system: typeof fallbackSystemMetrics
  media: typeof fallbackMediaMetrics
  recentlyAdded: string[]
  hostIo: typeof fallbackHostIo
  quality: QualityBucket[]
  blocked: BlockedImport[]
  drives: Drive[]
  /** Empty until the collector publishes blackbox availability. */
  uptime: ServiceUptime[]
  /** Empty until the collector publishes the growth series. */
  growth: GrowthPoint[]
  history: HistoryPoint[]
}

/** Jellyfin can list the same title once per library it appears in. */
function dedupe(names: string[]) {
  return names
    .map((name) => name.trim())
    .filter((name, index, all) => name.length > 0 && all.indexOf(name) === index)
}

/** `/media/media_main` reads better as `media_main`. */
function driveLabel(mount: string) {
  const tail = mount.split('/').filter(Boolean).pop()
  return tail ?? mount
}

function buildDrives(snapshot: DashboardSnapshot | null): Drive[] {
  const source =
    snapshot?.drives && snapshot.drives.length > 0
      ? snapshot.drives.filter(
          (drive): drive is { mount: string; totalBytes: number; freeBytes: number } =>
            typeof drive.totalBytes === 'number' && typeof drive.freeBytes === 'number' && drive.totalBytes > 0,
        )
      : null

  const drives = source && source.length > 0 ? source : fallbackDrives

  return [...drives]
    .map((drive) => ({
      mount: drive.mount,
      totalBytes: drive.totalBytes,
      freeBytes: drive.freeBytes,
      label: driveLabel(drive.mount),
      daysUntilFull:
        'daysUntilFull' in drive && typeof drive.daysUntilFull === 'number' && Number.isFinite(drive.daysUntilFull)
          ? drive.daysUntilFull
          : null,
      trendBytesPerDay:
        'trendBytesPerDay' in drive &&
        typeof drive.trendBytesPerDay === 'number' &&
        Number.isFinite(drive.trendBytesPerDay)
          ? drive.trendBytesPerDay
          : null,
    }))
    .sort((a, b) => b.totalBytes - a.totalBytes)
}

/**
 * Merges a published section over its fallback, and reports which keys the
 * collector could not supply. A substituted value is still shown - an empty
 * dashboard is worse - but the caller can mark it as last-known rather than
 * letting a stale figure pass for a live measurement.
 */
function mergeSection<T extends Record<string, number>>(
  source: Partial<Record<keyof T, number | null>> | undefined,
  fallback: T,
): { values: T; stale: Set<string> } {
  const values = {} as T
  const stale = new Set<string>()

  for (const key of Object.keys(fallback) as Array<keyof T>) {
    const published = source?.[key]
    if (typeof published === 'number' && Number.isFinite(published)) {
      values[key] = published as T[keyof T]
    } else {
      values[key] = fallback[key]
      stale.add(key as string)
    }
  }

  return { values, stale }
}

function buildServices(snapshot: DashboardSnapshot | null): ServiceLamp[] {
  if (!snapshot) {
    return [...fallbackServiceStatus]
  }

  // Keep the curated order and display names; Plex is deliberately absent.
  return fallbackServiceStatus.map((service) => {
    const reported = (snapshot.services as Record<string, { healthy: boolean } | undefined>)[service.key]
    return { ...service, up: reported ? reported.healthy : service.up }
  })
}

export function buildMetricsView(snapshot: DashboardSnapshot | null): MetricsView {
  const services = buildServices(snapshot)

  const library = mergeSection(snapshot?.library, fallbackLibraryMetrics)
  const infra = mergeSection(snapshot?.infrastructure, fallbackInfrastructureMetrics)
  const requests = mergeSection(snapshot?.requests, fallbackRequestMetrics)
  const downloads = mergeSection(snapshot?.downloads, fallbackDownloadMetrics)
  const system = mergeSection(snapshot?.system, fallbackSystemMetrics)
  const media = mergeSection(snapshot?.media, fallbackMediaMetrics)
  const hostIo = mergeSection(snapshot?.hostIo, fallbackHostIo)

  return {
    live: snapshot !== null,
    generatedAt: snapshot?.generatedAt ?? null,
    stale: {
      library: library.stale,
      infra: infra.stale,
      requests: requests.stale,
      downloads: downloads.stale,
      system: system.stale,
      media: media.stale,
      hostIo: hostIo.stale,
    },
    services,
    servicesUp: services.filter((service) => service.up).length,
    library: library.values,
    infra: infra.values,
    requests: requests.values,
    downloads: downloads.values,
    system: system.values,
    media: media.values,
    recentlyAdded: dedupe(snapshot?.media?.recentlyAdded ?? [...fallbackRecentlyAdded]),
    hostIo: hostIo.values,
    quality: snapshot?.quality?.length ? snapshot.quality : [...fallbackQuality],
    // No fallback: an empty list is a real answer, and inventing blocked
    // imports would be worse than showing none.
    blocked: snapshot?.blocked ?? [],
    drives: buildDrives(snapshot),
    // No fallbacks: an absent series is drawn as absent, never as invented history.
    uptime: snapshot?.uptime ?? [],
    growth: snapshot?.growth ?? [],
    history: snapshot?.history ?? [],
  }
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatTB(value: number, digits = 2) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value / 1e12)} TB`
}

/** Picks the unit from the magnitude, so a week of growth reads as GB and a
 *  library reads as TB rather than everything being a fraction of a terabyte. */
export function formatBytes(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e12) return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value / 1e12)} TB`
  if (abs >= 1e9) return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value / 1e9)} GB`
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value / 1e6)} MB`
}

export function formatGiB(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value / 1024 ** 3)} GB`
}

export function formatRate(value: number) {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(size)} ${units[unit]}`
}

export function formatUptime(hours: number) {
  if (hours < 48) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(hours)}h`
  }
  return `${Math.floor(hours / 24)}d`
}

export function formatClock(timestamp: string | null) {
  if (!timestamp) {
    return null
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
