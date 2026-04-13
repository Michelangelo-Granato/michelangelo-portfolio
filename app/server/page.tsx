import type { Metadata } from 'next'
import Link from 'next/link'

import { getServerDashboardData } from 'app/lib/server-dashboard'

export const metadata: Metadata = {
  title: 'Home Server',
  description:
    'A look at the media-first homelab behind Michelangelo Granato’s Jellyfin stack, including services, architecture, and telemetry plans.',
}

export const revalidate = 300

const accentMap = {
  red: 'var(--accent-red)',
  blue: 'var(--accent-blue)',
  yellow: 'var(--accent-yellow)',
} as const

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="retro-label mb-2">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)] md:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-[var(--ink-soft)] md:text-lg">{description}</p>
    </div>
  )
}

function ArrowConnector() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12H20M20 12L14.5 6.5M20 12L14.5 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function activityColor(level: number) {
  switch (level) {
    case 4:
      return 'rgba(45, 94, 157, 0.9)'
    case 3:
      return 'rgba(45, 94, 157, 0.7)'
    case 2:
      return 'rgba(216, 166, 43, 0.68)'
    case 1:
      return 'rgba(198, 59, 50, 0.58)'
    default:
      return 'rgba(18, 18, 18, 0.08)'
  }
}

export default async function Page() {
  const { dashboard, source } = await getServerDashboardData()

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
          <p className="retro-label mb-4">{dashboard.intro.eyebrow}</p>
          <h1 className="title max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--ink-strong)] md:text-7xl">
            {dashboard.intro.title}
          </h1>
          <div className="accent-rule my-6"></div>
          <p className="max-w-2xl text-base leading-7 text-[var(--ink)] md:text-lg">{dashboard.intro.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://watch.codebymic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-red) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-red) 22%, transparent)',
              }}
            >
              Open Jellyfin
            </a>
            <a
              href="https://requests.codebymic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-blue) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-blue) 22%, transparent)',
              }}
            >
              Open requests
            </a>
            <Link
              href="/projects"
              className="rounded-full px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent-yellow) 42%, var(--line))',
                background: 'color-mix(in srgb, var(--accent-yellow) 22%, transparent)',
              }}
            >
              Back to projects
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: source === 'live' ? 'var(--accent-blue)' : 'var(--accent-yellow)' }}>
              Data source
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
              {source === 'live' ? 'Live dashboard snapshot' : 'Curated fallback snapshot'}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              {source === 'live'
                ? 'This page is currently rendering normalized data from a configured private endpoint.'
                : 'The internal API route is ready for live telemetry. Until a private endpoint is configured, the UI stays useful with portfolio-safe fallback content.'}
            </p>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: 'var(--accent-red)' }}>
              Current snapshot
            </p>
            <p className="text-lg font-medium text-[var(--ink-strong)]">{dashboard.updatedAt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.intro.tags.map((tag, index) => {
                const accents = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
                const accent = accents[index % accents.length]

                return (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-strong)]"
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `color-mix(in srgb, ${accent} 42%, var(--line))`,
                      background: `color-mix(in srgb, ${accent} 22%, transparent)`,
                    }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Highlights"
          title="The quick operational readout."
          description="A few high-signal metrics set the tone for the page before getting into service details, observability surfaces, and architecture."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.highlights.map((item) => (
            <div key={item.label} className="surface-card rounded-[28px] p-6">
              <p className="retro-label mb-3" style={{ color: accentMap[item.accent] }}>
                {item.label}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Services"
          title="Public apps, private automation, and secure ingress."
          description="This board explains the stack in product terms instead of just container names, which makes it a better portfolio story."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.services.map((service) => (
            <div key={service.name} className="surface-card rounded-[28px] p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="retro-label mb-2" style={{ color: accentMap[service.accent] }}>
                    {service.status}
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">{service.name}</h3>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-strong)]"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `color-mix(in srgb, ${accentMap[service.accent]} 42%, var(--line))`,
                    background: `color-mix(in srgb, ${accentMap[service.accent]} 22%, transparent)`,
                  }}
                >
                  {service.role}
                </span>
              </div>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">{service.detail}</p>
              {service.href && (
                <a
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `color-mix(in srgb, ${accentMap[service.accent]} 42%, var(--line))`,
                    background: `color-mix(in srgb, ${accentMap[service.accent]} 18%, transparent)`,
                  }}
                >
                  Visit service
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Media telemetry"
            title="What I would surface from Jellyfin."
            description="These cards map directly to the kinds of stats that make a media-first homelab feel alive on a portfolio page."
          />
          <div className="grid gap-4">
            {dashboard.media.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeading
            eyebrow="System health"
            title="The infrastructure side of the story."
            description="The most convincing dashboards mix product-facing stats with the machine-level signals that keep the experience reliable."
          />
          <div className="grid gap-4">
            {dashboard.systems.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel rounded-[36px] p-6 md:p-8">
          <SectionHeading
            eyebrow="Architecture"
            title="A portfolio-friendly view of the stack."
            description="Instead of dumping raw infrastructure details, this diagram frames the server as a system with clean boundaries: edge, public apps, automation, and storage."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {dashboard.architecture.map((column, index) => (
              <div key={column.title} className="contents">
                <div className="surface-card rounded-[26px] p-5">
                  <p className="retro-label mb-3" style={{ color: accentMap[column.accent] }}>
                    {column.title}
                  </p>
                  <ul className="space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {column.items.map((item) => (
                      <li key={item} className="rounded-2xl border border-[var(--line)] px-3 py-2 text-[var(--ink)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {index < dashboard.architecture.length - 1 && <ArrowConnector />}
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-[36px] p-6 md:p-8">
          <SectionHeading
            eyebrow="Activity"
            title="A heatmap slot for playback or requests."
            description="A GitHub-style activity graph is an easy win: it is compact, recognizable, and immediately gives the page some life."
          />
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {dashboard.activity.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="grid gap-2">
                {week.map((level, dayIndex) => (
                  <div
                    key={`week-${weekIndex}-day-${dayIndex}`}
                    className="h-4 w-4 rounded-[6px] border border-[rgba(18,18,18,0.08)]"
                    style={{ backgroundColor: activityColor(level) }}
                    aria-label={`Activity level ${level}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            <span>Low</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-3.5 w-3.5 rounded-[4px] border border-[rgba(18,18,18,0.08)]"
                style={{ backgroundColor: activityColor(level) }}
              />
            ))}
            <span>High</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Requests"
            title="A simple way to show the acquisition pipeline."
            description="The request workflow is one of the strongest features to highlight because it connects public UX to private automation."
          />
          <div className="grid gap-4">
            {dashboard.requests.map((item) => (
              <div key={item.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-2" style={{ color: accentMap[item.accent] }}>
                  {item.title}
                </p>
                <p className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeading
            eyebrow="Containers"
            title="Docker is part of the portfolio story too."
            description="Showing the runtime footprint makes it clear that the site owner understands more than just the UI layer."
          />
          <div className="grid gap-4">
            {dashboard.containers.map((container) => (
              <div key={container.name} className="surface-card rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="retro-label mb-2" style={{ color: accentMap[container.accent] }}>
                      Container
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{container.name}</h3>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-strong)]"
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `color-mix(in srgb, ${accentMap[container.accent]} 42%, var(--line))`,
                      background: `color-mix(in srgb, ${accentMap[container.accent]} 22%, transparent)`,
                    }}
                  >
                    {container.purpose}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{container.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-[36px] p-6 md:p-8">
        <SectionHeading
          eyebrow="Integration plan"
          title="Built to graduate from a portfolio slice to a live dashboard."
          description="The page already ships with a normalized internal API route. The next step is plugging that route into your private telemetry sources and letting the fallback snapshot take over when the server is unavailable."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.integrations.map((step, index) => {
            const accents = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)', 'var(--accent-red)']
            const accent = accents[index % accents.length]

            return (
              <div key={step.title} className="surface-card rounded-[28px] p-6">
                <p className="retro-label mb-3" style={{ color: accent }}>
                  Step {index + 1}
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--ink-strong)]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{step.description}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
