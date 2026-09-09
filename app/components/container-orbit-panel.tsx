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
      className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-sm text-[var(--ink-soft)] md:h-[500px]"
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
  const [activeGroup, setActiveGroup] = useState<ContainerGroup | null>(null)
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

  const leaveGroup = useCallback(() => {
    setActiveGroup(null)
    setSelected(null)
  }, [])

  // Escape is the expected way out of a drill-in, and costs nothing to honour.
  useEffect(() => {
    if (!activeGroup) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leaveGroup()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeGroup, leaveGroup])

  const handleSelectGroup = useCallback((group: ContainerGroup | null) => {
    setActiveGroup(group)
    setSelected(null)
  }, [])

  const handleSelectContainer = useCallback((container: ContainerSnapshot | null) => setSelected(container), [])

  const present = CONTAINER_GROUPS.filter((group) => containers.some((entry) => entry.group === group))
  const inGroup = activeGroup ? containers.filter((entry) => entry.group === activeGroup) : containers
  const busiest = [...inGroup].sort((a, b) => (b.cpuPercent ?? 0) - (a.cpuPercent ?? 0))[0]
  const rows = activeGroup ? inGroup : containers

  return (
    <section className="surface-card rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-sm font-medium text-[var(--ink-soft)]">Running containers</h2>
          {activeGroup && (
            <button
              type="button"
              onClick={leaveGroup}
              className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-medium text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-2)]"
            >
              ← All groups
            </button>
          )}
        </div>
        <span className="text-xs text-[var(--ink-soft)] [font-variant-numeric:tabular-nums]">
          {activeGroup
            ? `${GROUP_LABEL[activeGroup]} · ${inGroup.length} containers`
            : `${containers.length} across ${present.length} groups`}
        </span>
      </div>

      <div ref={anchorRef}>
        {visible ? (
          <ContainerOrbit
            containers={containers}
            hostCpuPercent={hostCpuPercent}
            activeGroup={activeGroup}
            onSelectGroup={handleSelectGroup}
            onSelectContainer={handleSelectContainer}
          />
        ) : (
          <div
            className="h-[400px] w-full rounded-xl border border-dashed border-[var(--line)] md:h-[500px]"
            style={{ background: 'var(--chart-surface)' }}
          />
        )}
      </div>

      {/* Real buttons, because a raycaster on a canvas is unreachable by
          keyboard and this is the only way in without a pointer. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {present.map((group) => {
          const active = group === activeGroup
          return (
            <button
              key={group}
              type="button"
              aria-pressed={active}
              onClick={() => (active ? leaveGroup() : handleSelectGroup(group))}
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors"
              style={{
                borderColor: active ? GROUP_SWATCH[group] : 'var(--line)',
                background: active ? `color-mix(in srgb, ${GROUP_SWATCH[group]} 14%, transparent)` : 'transparent',
                color: active ? 'var(--ink-strong)' : 'var(--ink-soft)',
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: GROUP_SWATCH[group] }} />
              {GROUP_LABEL[group]}
              <span className="font-semibold text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                {containers.filter((entry) => entry.group === group).length}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[var(--ink-soft)]">
        {selected ? (
          <>
            <span className="font-[family-name:var(--font-geist-mono)] text-[var(--ink)]">{selected.name}</span> —{' '}
            {(selected.cpuPercent ?? 0).toFixed(2)}% of one core, {formatMemory(selected.memoryBytes)} resident.
          </>
        ) : activeGroup ? (
          <>
            Size is resident memory and distance from the star is CPU share, so the busiest containers orbit closest
            and, by Kepler, fastest. The heaviest are the planets; lighter ones orbit them as moons. Click any body to
            pin it here, or click empty space to go back.
            {busiest && ` Busiest in this group is ${busiest.name}.`}
          </>
        ) : (
          <>
            Each cluster is one group orbiting the host. Click one to drop into it, or use the buttons above.
            {busiest && ` Busiest right now is ${busiest.name}.`}
          </>
        )}
      </p>

      {/* A WebGL canvas is invisible to a screen reader, so the same figures
          stay available as text. */}
      <details className="mt-3 text-xs text-[var(--ink-soft)]">
        <summary className="cursor-pointer select-none hover:text-[var(--ink)]">
          View as table{activeGroup ? ` (${GROUP_LABEL[activeGroup]})` : ''}
        </summary>
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
              {rows.map((entry) => (
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
