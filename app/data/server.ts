/**
 * Last-known figures measured off the homelab's Prometheus exporters
 * (2026-09-08). These stand in per-field whenever the published snapshot is
 * missing or a collector could not reach one of its sources, so the page never
 * renders an empty dashboard and never invents a number.
 */

export const fallbackLibraryMetrics = {
  movies: 142,
  moviesDownloaded: 124,
  moviesMissing: 12,
  moviesWanted: 4,
  movieBytes: 1_383_820_666_582,
  series: 94,
  seasons: 391,
  episodes: 7116,
  episodesDownloaded: 3705,
  episodesMissing: 534,
  seriesBytes: 4_033_089_186_407,
}

export const fallbackInfrastructureMetrics = {
  cpuCores: 8,
  memoryTotalBytes: 16_705_282_048,
  load1: 0.21,
  containersRunning: 46,
  mediaTotalBytes: 13_948_649_287_680,
  mediaFreeBytes: 2_076_208_758_784,
  probesUp: 5,
  probesTotal: 7,
  indexersEnabled: 15,
  indexerResponseMs: 191,
  healthIssues: 2,
}

export const fallbackRequestMetrics = {
  total: 222,
  pending: 0,
  approved: 119,
  available: 79,
}

export const fallbackDownloadMetrics = {
  queueCount: 37,
  downloadingCount: 0,
  seedingCount: 0,
  downloadRateBytes: 0,
  uploadRateBytes: 0,
}

export const fallbackSystemMetrics = {
  uptimeHours: 17.7,
  cpuPercent: 7.2,
  memoryPercent: 33.2,
  rootDiskPercent: 52,
  mediaDiskFreeBytes: 2_076_208_758_784,
}

/** The two drives backing the media pool. drive2 really is at zero bytes
 *  available; the gap between its size and usage is ext4's root reserve. */
export const fallbackDrives: ReadonlyArray<{ mount: string; totalBytes: number; freeBytes: number }> = [
  { mount: '/media/media_main', totalBytes: 7_995_956_187_136, freeBytes: 2_076_208_709_632 },
  { mount: '/media/drive2', totalBytes: 5_952_693_100_544, freeBytes: 0 },
]

/** Display names and last-known state for the services the collector tracks. */
export const fallbackServiceStatus: ReadonlyArray<{ key: string; name: string; up: boolean }> = [
  { key: 'jellyfin', name: 'Jellyfin', up: true },
  { key: 'seerr', name: 'Requests', up: true },
  { key: 'radarr', name: 'Radarr', up: true },
  { key: 'sonarr', name: 'Sonarr', up: true },
  { key: 'prowlarr', name: 'Prowlarr', up: true },
  { key: 'qbittorrent', name: 'qBittorrent', up: true },
  { key: 'unmanic', name: 'Unmanic', up: false },
  { key: 'prometheus', name: 'Prometheus', up: true },
]
