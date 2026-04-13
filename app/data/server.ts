export type Accent = 'red' | 'blue' | 'yellow'

export interface DashboardStat {
  label: string
  value: string
  detail: string
  accent: Accent
}

export interface ServiceStatus {
  name: string
  role: string
  status: 'Public' | 'Private' | 'Automation' | 'Monitoring'
  detail: string
  href?: string
  accent: Accent
}

export interface InsightCard {
  title: string
  value: string
  description: string
  accent: Accent
}

export interface ArchitectureColumn {
  title: string
  items: string[]
  accent: Accent
}

export interface ContainerCard {
  name: string
  purpose: string
  detail: string
  accent: Accent
}

export interface IntegrationStep {
  title: string
  description: string
}

export interface ServerDashboardData {
  updatedAt: string
  intro: {
    eyebrow: string
    title: string
    description: string
    tags: string[]
  }
  highlights: DashboardStat[]
  services: ServiceStatus[]
  media: InsightCard[]
  systems: InsightCard[]
  requests: InsightCard[]
  architecture: ArchitectureColumn[]
  containers: ContainerCard[]
  integrations: IntegrationStep[]
  activity: number[][]
}

export const fallbackServerDashboard: ServerDashboardData = {
  updatedAt: 'Curated portfolio snapshot',
  intro: {
    eyebrow: 'Home server / homelab',
    title: 'A media-first server with observability built in.',
    description:
      'This page is the dashboard surface for the stack behind my Jellyfin server. It highlights the services I expose, the operational data I care about, and the pieces I would wire into live telemetry through private APIs.',
    tags: ['Jellyfin', 'Jellyseerr', 'Docker', 'Cloudflare Tunnel', 'Observability'],
  },
  highlights: [
    {
      label: 'Public portals',
      value: '2',
      detail: 'Streaming and requests live behind separate public entry points.',
      accent: 'red',
    },
    {
      label: 'Core services',
      value: '7',
      detail: 'Media delivery, automation, monitoring, ingress, and support tooling.',
      accent: 'blue',
    },
    {
      label: 'Access model',
      value: 'Private origin',
      detail: 'Traffic is routed through an edge tunnel instead of a directly exposed host.',
      accent: 'yellow',
    },
    {
      label: 'Ops posture',
      value: '24/7',
      detail: 'Designed to stay available while handling requests, syncing, and playback.',
      accent: 'red',
    },
  ],
  services: [
    {
      name: 'Jellyfin',
      role: 'Media streaming',
      status: 'Public',
      detail: 'Primary playback surface for movies, shows, and music.',
      href: 'https://watch.codebymic.com',
      accent: 'red',
    },
    {
      name: 'Jellyseerr',
      role: 'Requests and approvals',
      status: 'Public',
      detail: 'Self-service request flow for friends and family.',
      href: 'https://requests.codebymic.com',
      accent: 'blue',
    },
    {
      name: 'Sonarr',
      role: 'Series automation',
      status: 'Automation',
      detail: 'Keeps TV workflows organized, searchable, and continuously updated.',
      accent: 'yellow',
    },
    {
      name: 'Radarr',
      role: 'Movie automation',
      status: 'Automation',
      detail: 'Handles movie quality profiles, grabbing, and import workflows.',
      accent: 'red',
    },
    {
      name: 'Prowlarr',
      role: 'Indexer broker',
      status: 'Automation',
      detail: 'Central place to wire indexers into the rest of the media stack.',
      accent: 'blue',
    },
    {
      name: 'Cloudflare Tunnel',
      role: 'Secure ingress',
      status: 'Monitoring',
      detail: 'Routes public traffic to the homelab without exposing the host directly.',
      accent: 'yellow',
    },
  ],
  media: [
    {
      title: 'Library overview',
      value: 'Movies · Shows · Music',
      description: 'The dashboard is structured to surface category totals, fresh additions, and collection growth over time from Jellyfin.',
      accent: 'red',
    },
    {
      title: 'Recently added',
      value: 'Latest drops',
      description: 'A grid-ready slot for the newest arrivals, ideal for posters, release years, or completion states.',
      accent: 'blue',
    },
    {
      title: 'Playback activity',
      value: 'Sessions + watch time',
      description: 'Designed to display active sessions, lifetime watch hours, and the most-used playback devices.',
      accent: 'yellow',
    },
    {
      title: 'Transcoding health',
      value: 'Direct play first',
      description: 'A natural place to show hardware-vs-software transcodes and the load that remote playback puts on the box.',
      accent: 'red',
    },
  ],
  systems: [
    {
      title: 'Resource gauges',
      value: 'CPU · RAM · Disk',
      description: 'Tracks the essential vitals you want visible at a glance during syncs, scans, and peak streaming windows.',
      accent: 'blue',
    },
    {
      title: 'Storage layout',
      value: 'Pools + free space',
      description: 'Perfect for a visual split between media categories, cache layers, downloads, and remaining headroom.',
      accent: 'yellow',
    },
    {
      title: 'Network edge',
      value: 'Throughput + latency',
      description: 'Useful for speed checks, ingress latency, and tracking how healthy public access feels from the outside.',
      accent: 'red',
    },
    {
      title: 'Uptime posture',
      value: 'Host + services',
      description: 'Separating machine uptime from service uptime makes outages and container restarts much easier to explain.',
      accent: 'blue',
    },
  ],
  requests: [
    {
      title: 'Request pipeline',
      value: 'Requested → available',
      description: 'Shows the flow from a user request through approval, acquisition, import, and eventual playback readiness.',
      accent: 'yellow',
    },
    {
      title: 'Fulfilment trends',
      value: 'Approvals + turnaround',
      description: 'A compact place to show total completed requests, average turnaround time, and approval rate.',
      accent: 'red',
    },
    {
      title: 'Demand signals',
      value: 'Genres + requesters',
      description: 'Great for lightweight social stats like top genres, repeat requesters, and the busiest request weeks.',
      accent: 'blue',
    },
  ],
  architecture: [
    {
      title: 'Edge',
      items: ['DNS', 'Cloudflare Tunnel', 'TLS termination'],
      accent: 'red',
    },
    {
      title: 'Public apps',
      items: ['Jellyfin', 'Jellyseerr', 'Portfolio dashboard'],
      accent: 'blue',
    },
    {
      title: 'Automation',
      items: ['Sonarr', 'Radarr', 'Prowlarr'],
      accent: 'yellow',
    },
    {
      title: 'Storage + host',
      items: ['Media volumes', 'Downloads/cache', 'Docker host'],
      accent: 'red',
    },
  ],
  containers: [
    {
      name: 'jellyfin',
      purpose: 'Playback and library serving',
      detail: 'The customer-facing app in the stack, with posters, metadata, and streaming sessions flowing through it.',
      accent: 'red',
    },
    {
      name: 'jellyseerr',
      purpose: 'Request intake',
      detail: 'A strong portfolio story because it ties product UX directly to backend automation.',
      accent: 'blue',
    },
    {
      name: 'radarr / sonarr',
      purpose: 'Acquisition orchestration',
      detail: 'Shows that the server is not just hosted — it is actually automated end-to-end.',
      accent: 'yellow',
    },
    {
      name: 'cloudflared',
      purpose: 'Ingress connector',
      detail: 'Keeps the private network private while still making select apps publicly reachable.',
      accent: 'red',
    },
  ],
  integrations: [
    {
      title: 'Internal API route',
      description: 'Expose one normalized endpoint from the portfolio app so the UI stays stable even as upstream services evolve.',
    },
    {
      title: 'Incremental refresh',
      description: 'Use revalidation for low-churn stats and client polling for things like active streams or service health.',
    },
    {
      title: 'Safe fallbacks',
      description: 'If the homelab is offline, keep the page useful with a curated snapshot instead of a broken dashboard.',
    },
    {
      title: 'Private ingress',
      description: 'Only expose narrowly scoped telemetry endpoints through a tunnel rather than opening the entire server.',
    },
  ],
  activity: [
    [0, 1, 1, 2, 1, 0, 1],
    [1, 2, 3, 2, 2, 1, 0],
    [0, 1, 2, 4, 3, 1, 0],
    [1, 1, 2, 3, 4, 2, 1],
    [0, 1, 1, 2, 3, 2, 0],
    [1, 2, 2, 3, 2, 1, 1],
    [0, 1, 2, 2, 1, 1, 0],
    [1, 1, 3, 4, 2, 1, 0],
  ],
}
