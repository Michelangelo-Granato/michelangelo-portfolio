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
    title: 'Hey, I have a home server. Here is what is actually running on it.',
    description:
      'This page is a friendlier view of the stack in my ServerSetup repo: Plex and Jellyfin for playback, the *arr stack plus qBittorrent for automation, Caddy and Tailscale for access, and a separate monitoring layer for the stats I actually want to see.',
    tags: ['Plex + Jellyfin', 'Radarr / Sonarr', 'qBittorrent', 'Prometheus + Grafana', 'Tailscale'],
  },
  highlights: [
    {
      label: 'Public surfaces',
      value: '2',
      detail: 'One entry point for playback, one for requests, with the rest of the stack staying tucked behind the scenes.',
      accent: 'red',
    },
    {
      label: 'Main profile',
      value: '20+',
      detail: 'The full profile covers media, downloads, monitoring, backups, DNS, and home automation instead of just a couple of containers.',
      accent: 'blue',
    },
    {
      label: 'Request flow',
      value: 'Overseerr -> *arr -> qBittorrent',
      detail: 'Requests feed into Prowlarr, Radarr, and Sonarr, then land in the download client before they get imported into the library.',
      accent: 'yellow',
    },
    {
      label: 'Observability',
      value: 'Tautulli + Grafana',
      detail: 'Playback analytics, host metrics, container stats, health checks, and service exporters all have a place in the setup.',
      accent: 'red',
    },
  ],
  services: [
    {
      name: 'Jellyfin',
      role: 'Media streaming',
      status: 'Public',
      detail: 'The public playback surface I link out to here, backed by the same library and automation stack as the rest of the server.',
      href: 'https://watch.codebymic.com',
      accent: 'red',
    },
    {
      name: 'Plex + Tautulli',
      role: 'Playback and analytics',
      status: 'Private',
      detail: 'Plex is still part of the stack, and Tautulli is the obvious place to pull watch history, active sessions, and usage stats from.',
      accent: 'yellow',
    },
    {
      name: 'Requests app',
      role: 'Requests and approvals',
      status: 'Public',
      detail: 'The front end for requests, which then fan out into the actual automation pipeline instead of turning into manual work for me.',
      href: 'https://requests.codebymic.com',
      accent: 'blue',
    },
    {
      name: 'Radarr + Sonarr',
      role: 'Library automation',
      status: 'Automation',
      detail: 'These handle the movie and TV workflows, keep things organized, and connect the request side of the stack to the actual library.',
      accent: 'yellow',
    },
    {
      name: 'Prowlarr + Flaresolverr',
      role: 'Indexer plumbing',
      status: 'Automation',
      detail: 'Prowlarr brokers indexers for the rest of the stack, and Flaresolverr helps keep those lookups working when sites get difficult.',
      accent: 'red',
    },
    {
      name: 'qBittorrent + Unmanic',
      role: 'Downloads and media cleanup',
      status: 'Automation',
      detail: 'qBittorrent handles the actual downloads, and Unmanic is there for the more practical side of keeping media optimized over time.',
      accent: 'blue',
    },
    {
      name: 'Grafana + Prometheus',
      role: 'Monitoring stack',
      status: 'Monitoring',
      detail: 'The monitoring stack lives on the private side over Tailscale, pulling host, container, HTTP, qBittorrent, and *arr metrics into one place.',
      accent: 'yellow',
    },
    {
      name: 'Caddy + Tailscale + CrowdSec',
      role: 'Access and security',
      status: 'Private',
      detail: 'Caddy handles the clean front door, Tailscale handles remote private access, and CrowdSec covers the defensive side of exposing services.',
      accent: 'yellow',
    },
  ],
  media: [
    {
      title: 'Library overview',
      value: 'Plex + Jellyfin libraries',
      description: 'The obvious first card: total movies, total shows, fresh additions, and how the combined library is changing over time.',
      accent: 'red',
    },
    {
      title: 'Recently added',
      value: 'New movies and episodes',
      description: 'A simple feed of the latest arrivals, because that is still the first thing most people look for when they open a media server.',
      accent: 'blue',
    },
    {
      title: 'Playback activity',
      value: 'Sessions + watch time',
      description: 'This is where Tautulli and Jellyfin stats get interesting: active streams, total watch time, busiest days, and what devices people are actually using.',
      accent: 'yellow',
    },
    {
      title: 'Transcoding health',
      value: 'Direct play vs transcode',
      description: 'A good way to see when the server is cruising and when remote playback, subtitles, or codec mismatches are making it work harder.',
      accent: 'red',
    },
  ],
  systems: [
    {
      title: 'Monitoring stack',
      value: 'Grafana · Prometheus · exporters',
      description: 'Host metrics, container metrics, HTTP checks, qBittorrent stats, and *arr metrics all belong here instead of being scattered across different tools.',
      accent: 'blue',
    },
    {
      title: 'Storage layout',
      value: 'data/ · media/ · backups',
      description: 'How the server splits config data, the actual media library, and backup storage, plus how much room is left before I need to think about cleanup.',
      accent: 'yellow',
    },
    {
      title: 'Network and security',
      value: 'Caddy · Tailscale · CrowdSec',
      description: 'This is the outside-in layer: public access where I need it, private access where I want it, and some guardrails around the whole thing.',
      accent: 'red',
    },
    {
      title: 'Ops checks',
      value: 'verify · diagnostics · logs',
      description: 'The setup scripts already expose a nice operational surface, so this is where I would surface container health, port checks, and recent errors.',
      accent: 'blue',
    },
  ],
  requests: [
    {
      title: 'Request pipeline',
      value: 'Requested -> approved -> imported',
      description: 'The actual chain is straightforward and satisfying: a request lands, Radarr or Sonarr picks it up, qBittorrent pulls it down, and then it gets imported into the library.',
      accent: 'yellow',
    },
    {
      title: 'Fulfillment trends',
      value: 'Pending + approved + turnaround',
      description: 'This is where I would show how many requests are waiting, how many are approved, and how long it usually takes for something to go from asked for to available.',
      accent: 'red',
    },
    {
      title: 'Demand signals',
      value: 'Requesters + genres + peaks',
      description: 'The more social side of it: who requests the most, what kinds of media get asked for, and which days or weeks the queue gets busiest.',
      accent: 'blue',
    },
  ],
  architecture: [
    {
      title: 'Edge',
      items: ['Caddy', 'Tailscale', 'CrowdSec'],
      accent: 'red',
    },
    {
      title: 'Apps',
      items: ['Jellyfin', 'Plex', 'Requests UI', 'Homarr'],
      accent: 'blue',
    },
    {
      title: 'Automation',
      items: ['Radarr', 'Sonarr', 'Prowlarr', 'qBittorrent', 'Flaresolverr', 'Unmanic'],
      accent: 'yellow',
    },
    {
      title: 'Data + telemetry',
      items: ['media/', 'data/', 'Tautulli', 'Grafana / Prometheus', 'UrBackup / Syncthing'],
      accent: 'red',
    },
  ],
  containers: [
    {
      name: 'plex / jellyfin / tautulli',
      purpose: 'Playback and viewing stats',
      detail: 'This is the entertainment side of the server: the actual playback apps plus the analytics layer that tells me how the library is being used.',
      accent: 'red',
    },
    {
      name: 'overseerr / radarr / sonarr / prowlarr',
      purpose: 'Request and acquisition chain',
      detail: 'This is the nice part of self-hosting: a single request can kick off searching, matching, downloading, and library import without much manual work.',
      accent: 'blue',
    },
    {
      name: 'qbittorrent / flaresolverr / unmanic',
      purpose: 'Downloads and cleanup',
      detail: 'These are the practical containers doing the heavy lifting, from download handling to keeping media optimized once it lands.',
      accent: 'yellow',
    },
    {
      name: 'grafana / prometheus / dozzle / node-exporter',
      purpose: 'Monitoring and operations',
      detail: 'This is the side of the stack that tells me whether the whole thing is healthy, and it stays on the private side over Tailscale where it belongs.',
      accent: 'red',
    },
  ],
  integrations: [
    {
      title: 'Playback sources',
      description: 'Pull stream counts, watch time, and library growth from Tautulli and Jellyfin so the page reflects what people are actually watching.',
    },
    {
      title: 'Request and download stats',
      description: 'Pull pending requests, approval counts, queue health, and throughput from the request layer, qBittorrent, and the *arr apps.',
    },
    {
      title: 'Infra metrics',
      description: 'Use Prometheus-fed host and container metrics for CPU, memory, disk, uptime, latency, and basic health without hand-rolling each number.',
    },
    {
      title: 'Safe fallback story',
      description: 'If any private endpoints are down, keep the page readable with a curated snapshot instead of exposing internals or shipping a broken dashboard.',
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
