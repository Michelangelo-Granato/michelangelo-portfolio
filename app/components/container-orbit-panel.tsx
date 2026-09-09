'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CONTAINER_GROUPS, type ContainerGroup, type ContainerSnapshot } from 'app/lib/server-dashboard-snapshot'

/** three.js is far larger than the rest of this page put together, so the
 *  chunk is only fetched once the panel is actually scrolled into view. */
const ContainerOrbit = dynamic(() => import('app/components/container-orbit'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[380px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-sm text-[var(--ink-soft)] md:h-[460px]"
      style={{ background: 'var(--chart-surface)' }}
    >
      Starting the renderer…
    </div>
  ),
})

const GROUP_SWATCH: Record<ContainerGroup, string> = {
  media: 'var(--series-cpu)',
  monitoring: 'var(--status-up)',
  home: 'var(--series-third)',
  apps: 'var(--series-ram)',
  infra: 'var(--ink-soft)',
}

const GROUP_LABEL: Record<ContainerGroup, string> = {
  media: 'Media',
  monitoring: 'Monitoring',
  home: 'Home automation',
  apps: 'Applications',
  infra: 'Infrastructure',
}

function formatMemory(bytes: number | null) {
  if (bytes === null) return 'n/a'
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  return `${Math.round(bytes / 1e6)} MB`
}

export function ContainerOrbitPanel({
  containers,
  hostCpuPercent,
}: Readonly<{ containers: ContainerSnapshot[]; hostCpuPercent: number }>) {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<ContainerSnapshot | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    // Older Safari and any headless renderer without IO still get the scene.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(anchor)
    return () => observer.disconnect()
  }, [])

  const handleSelect = useCallback((container: ContainerSnapshot | null) => setSelected(container), [])

  const present = CONTAINER_GROUPS.filter((group) => containers.some((entry) => entry.group === group))
  const busiest = [...containers].sort((a, b) => (b.cpuPercent ?? 0) - (a.cpuPercent ?? 0))[0]

  return (
    <section className="surface-card rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--ink-soft)]">Running containers</h2>
        <span className="text-xs text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
          {containers.length} in orbit · size is memory, speed is CPU
        </span>
      </div>

      <div ref={anchorRef}>
        {visible ? (
          <ContainerOrbit containers={containers} hostCpuPercent={hostCpuPercent} onSelect={handleSelect} />
        ) : (
          <div
            className="h-[380px] w-full rounded-xl border border-dashed border-[var(--line)] md:h-[460px]"
            style={{ background: 'var(--chart-surface)' }}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {present.map((group) => (
          <span key={group} className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full" style={{ background: GROUP_SWATCH[group] }} />
            {GROUP_LABEL[group]}
            <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
              {containers.filter((entry) => entry.group === group).length}
            </span>
          </span>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[var(--ink-soft)]">
        {selected ? (
          <>
            <span className="font-[family-name:var(--font-geist-mono)] text-[var(--ink)]">{selected.name}</span> —{' '}
            {(selected.cpuPercent ?? 0).toFixed(2)}% of one core, {formatMemory(selected.memoryBytes)} resident.
          </>
        ) : (
          <>
            Each ring is one group; a planet&rsquo;s size is its resident memory and its orbital speed its CPU share.
            Hover a planet for its name, or click to pin it here.
            {busiest && ` Busiest right now is ${busiest.name}.`}
          </>
        )}
      </p>

      {/* A WebGL canvas is invisible to a screen reader, so the same figures
          stay available as text. */}
      <details className="mt-3 text-xs text-[var(--ink-soft)]">
        <summary className="cursor-pointer select-none hover:text-[var(--ink)]">View as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left [font-variant-numeric:tabular-nums]">
            <thead className="text-[var(--ink-soft)]">
              <tr>
                <th className="py-1 pr-4 font-medium">Container</th>
                <th className="py-1 pr-4 font-medium">Group</th>
                <th className="py-1 pr-4 font-medium">CPU</th>
                <th className="py-1 pr-4 font-medium">Memory</th>
              </tr>
            </thead>
            <tbody className="text-[var(--ink)]">
              {containers.map((entry) => (
                <tr key={entry.name} className="border-t border-[var(--line)]">
                  <td className="py-1 pr-4 font-[family-name:var(--font-geist-mono)]">{entry.name}</td>
                  <td className="py-1 pr-4">{GROUP_LABEL[entry.group]}</td>
                  <td className="py-1 pr-4">{(entry.cpuPercent ?? 0).toFixed(2)}%</td>
                  <td className="py-1 pr-4">{formatMemory(entry.memoryBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
