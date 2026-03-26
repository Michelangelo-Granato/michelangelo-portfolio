
import Link from 'next/link'

export default function Page() {
  const links = [
    {
      name: 'About',
      url: '/about',
      external: false,
      description: 'About Me'
    },
    {
      name: 'Pictures',
      url: '/pictures',
      external: false,
      description: 'Photo Gallery'
    },
    {
      name: 'Projects',
      url: '/projects',
      external: false,
      description: 'My Work'
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/michelangelo-granato',
      external: true,
      description: 'Connect with me'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/Michelangelo-Granato',
      external: true,
      description: 'Check out my code'
    },
    {
      name: 'Watch',
      url: 'https://watch.codebymic.com',
      external: true,
      description: 'My Jellyfin Media Server'
    },
    {
      name: 'Requests',
      url: 'https://requests.codebymic.com',
      external: true,
      description: 'Movie & Show Requests (Seerr)'
    },
  ]

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid min-h-[calc(100dvh-12rem)] items-start gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="surface-panel rounded-[40px] px-6 py-8 md:px-10 md:py-12">
          <p className="retro-label mb-4">Toronto based full-stack developer</p>
          <h1 className="title max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.05em] text-[var(--ink-strong)] md:text-7xl lg:text-[5.5rem]">
            Hey, here is some stuff, enjoy.
          </h1>
          <div className="accent-rule my-6"></div>
          <p className="max-w-2xl text-base leading-7 text-[var(--ink)] md:text-lg">
            I build product-focused web experiences with Next.js, TypeScript, .NET, and distributed systems. This site is a disorganized collection of the work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              View projects
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-[var(--line)] bg-white/45 px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              About me
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-card rounded-[32px] p-6">
            <p className="retro-label mb-3" style={{ color: 'var(--accent-red)' }}>Current focus</p>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">
              Scalable product engineering with measured design decisions.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            <div className="surface-card rounded-[28px] p-5">
              <p className="retro-label mb-2" style={{ color: 'var(--accent-blue)' }}>Stack</p>
              <p className="text-base font-medium text-[var(--ink-strong)]">Next.js, TypeScript, .NET, MongoDB, Kafka</p>
            </div>
            <div className="surface-card rounded-[28px] p-5">
              <p className="retro-label mb-2" style={{ color: 'var(--accent-yellow)' }}>Role</p>
              <p className="text-base font-medium text-[var(--ink-strong)]">Software Developer II at Dayforce</p>
            </div>
            <div className="surface-card rounded-[28px] p-5">
              <p className="retro-label mb-2">Mode</p>
              <p className="text-base font-medium text-[var(--ink-strong)]">Practical, opinionated, and detail-oriented</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="retro-label mb-2">Navigation</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)] md:text-4xl">Start anywhere.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
            The structure is simple on purpose. Every section gets straight to the point.
          </p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link, index) => {
          const accentColors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-yellow)']
          const accentShadows = [
            '0 12px 30px rgba(198, 59, 50, 0.08)',
            '0 12px 30px rgba(45, 94, 157, 0.08)',
            '0 12px 30px rgba(216, 166, 43, 0.08)',
          ]
          const accentColor = accentColors[index % accentColors.length]
          const accentShadow = accentShadows[index % accentShadows.length]

          return (
          <Link
            key={link.name}
            href={link.url}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="surface-card group relative overflow-hidden rounded-[28px] p-6 transition-all duration-200 hover:-translate-y-1"
            style={{ boxShadow: accentShadow }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span
                className="accent-dot"
                style={{ color: accentColor }}
              ></span>
              <span className="retro-label">{link.external ? 'external' : 'internal'}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)] transition-transform duration-200 group-hover:translate-x-1">
                {link.name}
              </h3>
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                {link.description}
              </p>
            </div>
          </Link>
          )
        })}
      </div>
      </section>
    </div>
  )
}
