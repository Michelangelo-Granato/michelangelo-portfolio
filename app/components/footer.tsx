function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16 w-full">
      <div className="surface-panel rounded-[32px] px-6 py-8 md:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="retro-label mb-2">Elsewhere</p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-strong)]">Let’s keep in touch.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
            Full-stack work, photography, experiments, and notes from the things I build.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--ink-soft)]">
        <li>
          <a
            className="flex items-center transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--ink-strong)]"
            rel="noopener noreferrer"
            target="_blank"
            href="https://www.linkedin.com/in/michelangelo-granato/"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">linkedin</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--ink-strong)]"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/michelangelo-granato"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">github</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--ink-strong)]"
            href="mailto:michelangelo.granato.1@gmail.com"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">email</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--ink-strong)]"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/michelangelo-granato/michelangelo-portfolio"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">view source</p>
          </a>
        </li>
        </ul>
        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--line)] pt-4 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)] md:flex-row md:justify-between">
          <span>Toronto, Ontario</span>
          <span>Built with Next.js and Tailwind</span>
        </div>
      </div>
    </footer>
  )
}
