'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

export type TraceSeries = {
  key: string
  name: string
  color: string
}

export type TracePoint = {
  label: string
  values: Record<string, number | null>
}

const W = 720
const PAD = { left: 34, right: 18, top: 14, bottom: 24 }

function niceCeiling(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

/** Formatters live here rather than being passed in: a function cannot cross
 *  the server/client boundary, so the caller names one instead. */
const FORMATTERS = {
  percent: (value: number) => `${Math.round(value)}%`,
  rate: (value: number) => {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    let size = value
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit += 1
    }
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(size)} ${units[unit]}`
  },
  bytes: (value: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = value
    let unit = 0
    while (size >= 1000 && unit < units.length - 1) {
      size /= 1000
      unit += 1
    }
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: unit >= 3 ? 2 : 0 }).format(size)} ${units[unit]}`
  },
} as const

export type TraceFormat = keyof typeof FORMATTERS

export function Trace({
  points,
  series,
  max,
  format: formatName,
  height = 210,
  emptyLabel = 'Collecting samples. The trace appears once the server has published a few snapshots.',
  idleLabel,
}: Readonly<{
  points: TracePoint[]
  series: TraceSeries[]
  /** Fixed axis top; omit to scale to the data. */
  max?: number
  format: TraceFormat
  height?: number
  emptyLabel?: string
  /** Shown instead of a flat zero line when nothing happened in the window. */
  idleLabel?: string
}>) {
  const [active, setActive] = useState<number | null>(null)
  const frameRef = useRef<SVGSVGElement | null>(null)
  const format = FORMATTERS[formatName]

  const plotH = height - PAD.top - PAD.bottom
  const plotW = W - PAD.left - PAD.right

  const observed = useMemo(() => {
    let peak = 0
    for (const point of points) {
      for (const definition of series) {
        const value = point.values[definition.key]
        if (typeof value === 'number' && Number.isFinite(value)) peak = Math.max(peak, value)
      }
    }
    return peak
  }, [points, series])

  const axisTop = max ?? niceCeiling(observed)

  const xAt = useCallback(
    (index: number) => PAD.left + (plotW * index) / Math.max(points.length - 1, 1),
    [plotW, points.length],
  )
  const yAt = useCallback(
    (value: number) => PAD.top + plotH - (Math.min(Math.max(value, 0), axisTop) / axisTop) * plotH,
    [plotH, axisTop],
  )

  const ends = useMemo(() => {
    const result: Record<string, { index: number; value: number } | null> = {}
    for (const definition of series) {
      result[definition.key] = null
      for (let i = points.length - 1; i >= 0; i -= 1) {
        const value = points[i].values[definition.key]
        if (typeof value === 'number' && Number.isFinite(value)) {
          result[definition.key] = { index: i, value }
          break
        }
      }
    }
    return result
  }, [points, series])

  const locate = useCallback(
    (clientX: number) => {
      const frame = frameRef.current
      if (!frame || points.length === 0) return
      const box = frame.getBoundingClientRect()
      const ratio = (clientX - box.left) / box.width
      const t = (ratio - PAD.left / W) / (plotW / W)
      const index = Math.round(t * (points.length - 1))
      setActive(Math.min(Math.max(index, 0), points.length - 1))
    },
    [plotW, points.length],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (points.length === 0) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        setActive((current) => {
          const base = current ?? points.length - 1
          const next = event.key === 'ArrowLeft' ? base - 1 : base + 1
          return Math.min(Math.max(next, 0), points.length - 1)
        })
      }
      if (event.key === 'Escape') setActive(null)
    },
    [points.length],
  )

  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--line)] px-6 text-center text-sm text-[var(--ink-soft)]"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    )
  }

  if (idleLabel && observed === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--line)] px-6 text-center text-sm text-[var(--ink-soft)]"
        style={{ height }}
      >
        {idleLabel}
      </div>
    )
  }

  const ticks = max === 100 ? [0, 25, 50, 75, 100] : [0, axisTop / 2, axisTop]
  const point = active === null ? null : points[active]

  function buildPath(key: string) {
    let path = ''
    let pen = false
    points.forEach((entry, index) => {
      const value = entry.values[key]
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        pen = false
        return
      }
      path += `${pen ? 'L' : 'M'}${xAt(index).toFixed(1)} ${yAt(value).toFixed(1)}`
      pen = true
    })
    return path
  }

  const summary = series
    .map((definition) => {
      const end = ends[definition.key]
      return `${definition.name} ${end ? format(end.value) : 'unknown'}`
    })
    .join(', ')

  return (
    <div>
      <div className="relative">
        <svg
          ref={frameRef}
          viewBox={`0 0 ${W} ${height}`}
          className="block h-auto w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-cpu)]"
          role="img"
          tabIndex={0}
          aria-label={`Trend over the last ${points.length} snapshots. ${summary}.`}
          onPointerMove={(event) => locate(event.clientX)}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yAt(tick) + 3}
                textAnchor="end"
                className="fill-[var(--ink-soft)] text-[9px] [font-variant-numeric:tabular-nums]"
              >
                {format(tick)}
              </text>
            </g>
          ))}

          {series.map((definition) => (
            <path
              key={definition.key}
              d={buildPath(definition.key)}
              fill="none"
              stroke={definition.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {point && (
            <line
              x1={xAt(active!)}
              x2={xAt(active!)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--ink-soft)"
              strokeWidth="1"
            />
          )}

          {series.map((definition) => {
            const end = ends[definition.key]
            if (!end) return null
            const hovered = point?.values[definition.key]
            const live = typeof hovered === 'number' && Number.isFinite(hovered)
            return (
              <circle
                key={definition.key}
                cx={xAt(live ? active! : end.index)}
                cy={yAt(live ? (hovered as number) : end.value)}
                r="4.5"
                fill={definition.color}
                stroke="var(--chart-surface)"
                strokeWidth="2"
              />
            )
          })}

          <text x={PAD.left} y={height - 6} className="fill-[var(--ink-soft)] text-[9px]">
            {points[0].label}
          </text>
          <text x={W - PAD.right} y={height - 6} textAnchor="end" className="fill-[var(--ink-soft)] text-[9px]">
            {points[points.length - 1].label}
          </text>
        </svg>

        {point && (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: `${(xAt(active!) / W) * 100}%` }}
          >
            <div className="mb-1 text-[10px] text-[var(--ink-soft)]">{point.label}</div>
            {series.map((definition) => {
              const value = point.values[definition.key]
              return (
                <div key={definition.key} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: definition.color }} />
                  <span className="text-[var(--ink-soft)]">{definition.name}</span>
                  <span className="font-medium text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                    {typeof value === 'number' && Number.isFinite(value) ? format(value) : 'n/a'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map((definition) => {
          const end = ends[definition.key]
          return (
            <span key={definition.key} className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <span className="h-0.5 w-4 rounded-full" style={{ background: definition.color }} />
              {definition.name}
              {end && (
                <span className="font-medium text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                  {format(end.value)}
                </span>
              )}
            </span>
          )
        })}
      </div>

      <details className="mt-3 text-xs text-[var(--ink-soft)]">
        <summary className="cursor-pointer select-none hover:text-[var(--ink)]">View as table</summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-left [font-variant-numeric:tabular-nums]">
            <thead className="text-[var(--ink-soft)]">
              <tr>
                <th className="py-1 pr-4 font-medium">Time</th>
                {series.map((definition) => (
                  <th key={definition.key} className="py-1 pr-4 font-medium">
                    {definition.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[var(--ink)]">
              {points.map((row, index) => (
                <tr key={`${row.label}-${index}`} className="border-t border-[var(--line)]">
                  <td className="py-1 pr-4">{row.label}</td>
                  {series.map((definition) => {
                    const value = row.values[definition.key]
                    return (
                      <td key={definition.key} className="py-1 pr-4">
                        {typeof value === 'number' && Number.isFinite(value) ? format(value) : 'n/a'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
