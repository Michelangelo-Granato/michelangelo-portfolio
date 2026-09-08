'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

export type TracePoint = {
  label: string
  cpu: number | null
  ram: number | null
}

const W = 720
const H = 210
const PAD = { left: 30, right: 18, top: 14, bottom: 24 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const SERIES = [
  { key: 'cpu' as const, name: 'CPU', color: 'var(--series-cpu)' },
  { key: 'ram' as const, name: 'Memory', color: 'var(--series-ram)' },
]

function xAt(index: number, count: number) {
  return PAD.left + (PLOT_W * index) / Math.max(count - 1, 1)
}

function yAt(value: number) {
  return PAD.top + PLOT_H - (Math.min(Math.max(value, 0), 100) / 100) * PLOT_H
}

/** Breaks the line wherever the collector reported null, rather than drawing
 *  a straight segment across a gap that was never measured. */
function buildPath(points: TracePoint[], key: 'cpu' | 'ram') {
  let path = ''
  let pen = false

  points.forEach((point, index) => {
    const value = point[key]
    if (value === null || !Number.isFinite(value)) {
      pen = false
      return
    }
    path += `${pen ? 'L' : 'M'}${xAt(index, points.length).toFixed(1)} ${yAt(value).toFixed(1)}`
    pen = true
  })

  return path
}

function lastDefined(points: TracePoint[], key: 'cpu' | 'ram') {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const value = points[i][key]
    if (value !== null && Number.isFinite(value)) {
      return { index: i, value }
    }
  }
  return null
}

export function LoadTrace({ points }: Readonly<{ points: TracePoint[] }>) {
  const [active, setActive] = useState<number | null>(null)
  const frameRef = useRef<SVGSVGElement | null>(null)

  const ends = useMemo(
    () => ({ cpu: lastDefined(points, 'cpu'), ram: lastDefined(points, 'ram') }),
    [points],
  )

  const locate = useCallback(
    (clientX: number) => {
      const frame = frameRef.current
      if (!frame || points.length === 0) return
      const box = frame.getBoundingClientRect()
      const ratio = (clientX - box.left) / box.width
      const plotStart = PAD.left / W
      const plotSpan = PLOT_W / W
      const t = (ratio - plotStart) / plotSpan
      const index = Math.round(t * (points.length - 1))
      setActive(Math.min(Math.max(index, 0), points.length - 1))
    },
    [points.length],
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
      <div className="flex h-[210px] items-center justify-center rounded-xl border border-dashed border-[var(--line)] px-6 text-center text-sm text-[var(--ink-soft)]">
        Collecting samples. The trace appears once the server has published a few snapshots.
      </div>
    )
  }

  const point = active === null ? null : points[active]

  return (
    <div>
      <div className="relative">
        <svg
          ref={frameRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-cpu)]"
          role="img"
          tabIndex={0}
          aria-label={`Host load over the last ${points.length} snapshots. CPU currently ${ends.cpu?.value.toFixed(0) ?? 'unknown'} percent, memory ${ends.ram?.value.toFixed(0) ?? 'unknown'} percent.`}
          onPointerMove={(event) => locate(event.clientX)}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          {[0, 25, 50, 75, 100].map((tick) => (
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
                {tick}
              </text>
            </g>
          ))}

          {SERIES.map((series) => (
            <path
              key={series.key}
              d={buildPath(points, series.key)}
              fill="none"
              stroke={series.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {point && (
            <line
              x1={xAt(active!, points.length)}
              x2={xAt(active!, points.length)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--ink-soft)"
              strokeWidth="1"
            />
          )}

          {SERIES.map((series) => {
            const end = ends[series.key]
            if (!end) return null
            const hovered = point?.[series.key]
            const index = active !== null && hovered !== null && hovered !== undefined ? active : end.index
            const value = active !== null && hovered !== null && hovered !== undefined ? hovered : end.value
            return (
              <circle
                key={series.key}
                cx={xAt(index, points.length)}
                cy={yAt(value)}
                r="4.5"
                fill={series.color}
                stroke="var(--chart-surface)"
                strokeWidth="2"
              />
            )
          })}

          <text
            x={PAD.left}
            y={H - 6}
            className="fill-[var(--ink-soft)] text-[9px]"
          >
            {points[0].label}
          </text>
          <text
            x={W - PAD.right}
            y={H - 6}
            textAnchor="end"
            className="fill-[var(--ink-soft)] text-[9px]"
          >
            {points[points.length - 1].label}
          </text>
        </svg>

        {point && (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: `${(xAt(active!, points.length) / W) * 100}%` }}
          >
            <div className="mb-1 text-[10px] text-[var(--ink-soft)]">{point.label}</div>
            {SERIES.map((series) => (
              <div key={series.key} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-0.5 w-3 rounded-full" style={{ background: series.color }} />
                <span className="text-[var(--ink-soft)]">{series.name}</span>
                <span className="font-medium text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                  {point[series.key] === null ? 'n/a' : `${Math.round(point[series.key] as number)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {SERIES.map((series) => {
          const end = ends[series.key]
          return (
            <span key={series.key} className="inline-flex items-center gap-2 text-xs text-[var(--ink-soft)]">
              <span className="h-0.5 w-4 rounded-full" style={{ background: series.color }} />
              {series.name}
              {end && (
                <span className="font-medium text-[var(--ink-strong)] [font-variant-numeric:tabular-nums]">
                  {Math.round(end.value)}%
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
                <th className="py-1 pr-4 font-medium">CPU</th>
                <th className="py-1 font-medium">Memory</th>
              </tr>
            </thead>
            <tbody className="text-[var(--ink)]">
              {points.map((row, index) => (
                <tr key={`${row.label}-${index}`} className="border-t border-[var(--line)]">
                  <td className="py-1 pr-4">{row.label}</td>
                  <td className="py-1 pr-4">{row.cpu === null ? 'n/a' : `${Math.round(row.cpu)}%`}</td>
                  <td className="py-1">{row.ram === null ? 'n/a' : `${Math.round(row.ram)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
