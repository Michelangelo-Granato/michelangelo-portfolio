"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

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
  const { theme, resolvedTheme, setTheme } = useTheme()
  const current = resolvedTheme || theme
  const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <nav
      className="fixed left-0 top-0 z-50 w-full"
      id="nav"
    >
      <div className="px-4 md:px-6">
        <div className="mx-auto w-full max-w-6xl pt-4">
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
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle dark mode"
                  className="ml-1 rounded-full p-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
                >
                  {!mounted ? (
                    /* Render a stable placeholder server-side to avoid hydration mismatch */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : current === 'dark' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M12 4.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 22v-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.5 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 12h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.6 5.6L4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.8 19.8l-1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.8 4.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.6 18.4L4.2 19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
