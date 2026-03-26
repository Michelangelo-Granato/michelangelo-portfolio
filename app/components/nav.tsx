"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = {
  '/': {
    name: 'home',
  },
  '/about': {
    name: 'about',
  },
  '/projects': {
    name: 'projects',
  },
  '/pictures': {
    name: 'pictures',
  },
  '/contact': {
    name: 'contact',
  },
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed left-0 top-0 z-50 w-full"
      id="nav"
    >
      <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
        <div className="surface-panel flex items-center justify-between rounded-[28px] px-4 py-3 md:px-6 md:py-4">
          <Link href="/" className="flex items-center gap-3 rounded-full pr-4 transition-transform duration-200 hover:-translate-y-0.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(24,24,24,0.16)] bg-[linear-gradient(135deg,#efefea,#c8c8c1)] text-sm font-semibold text-[var(--ink-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              MG
            </span>
            <span className="hidden sm:flex sm:flex-col sm:leading-tight">
              <span className="text-sm font-semibold text-[var(--ink-strong)]">Michelangelo Granato</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">Developer portfolio</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {Object.entries(navItems).map(([path, { name }]) => {
              const active = path === '/' ? pathname === path : pathname === path || pathname.startsWith(path + '/')
              return (
                <Link
                  key={path}
                  href={path}
                  aria-current={active ? 'page' : undefined}
                  className="rounded-full px-3 py-2 text-sm font-medium capitalize transition-all duration-200 md:px-4"
                  style={{
                    background: active ? 'rgba(45, 94, 157, 0.12)' : 'transparent',
                    color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
                    boxShadow: active ? 'inset 0 0 0 1px rgba(45, 94, 157, 0.18)' : 'none',
                  }}
                >
                  {name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
