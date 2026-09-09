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
import type { BlockedImport, DashboardSnapshot, QualityBucket } from 'app/lib/server-dashboard-snapshot'

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
}

export interface MetricsView {
  live: boolean
  generatedAt: string | null
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
    .map((drive) => ({ ...drive, label: driveLabel(drive.mount) }))
    .sort((a, b) => b.totalBytes - a.totalBytes)
}

/** A published value wins only when it is an actual number; null means the
 *  collector could not reach that source, so the last known figure stands in. */
function pick(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function mergeSection<T extends Record<string, number>>(
  source: Partial<Record<keyof T, number | null>> | undefined,
  fallback: T,
): T {
  const out = {} as T
  for (const key of Object.keys(fallback) as Array<keyof T>) {
    out[key] = pick(source?.[key], fallback[key]) as T[keyof T]
  }
  return out
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

  return {
    live: snapshot !== null,
    generatedAt: snapshot?.generatedAt ?? null,
    services,
    servicesUp: services.filter((service) => service.up).length,
    library: mergeSection(snapshot?.library, fallbackLibraryMetrics),
    infra: mergeSection(snapshot?.infrastructure, fallbackInfrastructureMetrics),
    requests: mergeSection(snapshot?.requests, fallbackRequestMetrics),
    downloads: mergeSection(snapshot?.downloads, fallbackDownloadMetrics),
    system: mergeSection(snapshot?.system, fallbackSystemMetrics),
    media: mergeSection(snapshot?.media, fallbackMediaMetrics),
    recentlyAdded: dedupe(snapshot?.media?.recentlyAdded ?? [...fallbackRecentlyAdded]),
    hostIo: mergeSection(snapshot?.hostIo, fallbackHostIo),
    quality: snapshot?.quality?.length ? snapshot.quality : [...fallbackQuality],
    // No fallback: an empty list is a real answer, and inventing blocked
    // imports would be worse than showing none.
    blocked: snapshot?.blocked ?? [],
    drives: buildDrives(snapshot),
    history: snapshot?.history ?? [],
  }
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatTB(value: number, digits = 2) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value / 1e12)} TB`
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
