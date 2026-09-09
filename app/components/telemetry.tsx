'use client'

import { useCallback, useEffect, useState } from 'react'

import { Trace, type TracePoint } from 'app/components/trace'

export type RangeKey = '5m' | '1h' | '4h' | '24h' | '7d'

const RANGES: ReadonlyArray<{ key: RangeKey; label: string; sample: string }> = [
  { key: '5m', label: '5 min', sample: '15s samples' },
  { key: '1h', label: '1 hour', sample: '1m samples' },
  { key: '4h', label: '4 hours', sample: '2m samples' },
  { key: '24h', label: '24 hours', sample: '5m samples' },
  { key: '7d', label: '7 days', sample: '30m samples' },
]

type SeriesPoint = {
  t: number
  cpu: number | null
  ram: number | null
  netRx: number | null
  netTx: number | null
}

/** Short windows need seconds; a week needs the day. */
function stampFormatter(range: RangeKey) {
  if (range === '5m') {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  }
  if (range === '7d') {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric' })
  }
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
}

function toTracePoints(points: SeriesPoint[], range: RangeKey): { load: TracePoint[]; net: TracePoint[] } {
  const formatter = stampFormatter(range)

  const load: TracePoint[] = []
  const net: TracePoint[] = []

  for (const point of points) {
    const label = formatter.format(new Date(point.t * 1000))
    load.push({ label, values: { cpu: point.cpu, ram: point.ram } })
    net.push({ label, values: { rx: point.netRx, tx: point.netTx } })
  }

  return { load, net }
}

export function TelemetrySection({
  initialPoints,
  initialRange = '24h',
}: Readonly<{ initialPoints: SeriesPoint[]; initialRange?: RangeKey }>) {
  const [range, setRange] = useState<RangeKey>(initialRange)
  const [points, setPoints] = useState<SeriesPoint[]>(initialPoints)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setPending(true)
    setFailed(false)

    fetch(`/api/server-dashboard/series?range=${range}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: { points?: SeriesPoint[] }) => {
        if (!cancelled && Array.isArray(data.points)) {
          setPoints(data.points)
        }
      })
      .catch((error) => {
        // An aborted request is a range change, not a failure.
        if (!cancelled && (error as Error).name !== 'AbortError') {
          setFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [range])

  const select = useCallback((next: RangeKey) => setRange(next), [])

  const { load, net } = toTracePoints(points, range)
  const active = RANGES.find((entry) => entry.key === range)

  return (
    <section className="surface-card rounded-2xl p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-medium text-[var(--ink-soft)]">Telemetry</h2>
          <span className="text-xs text-[var(--ink-soft)]">{active?.sample}</span>
        </div>

        <div
          role="group"
          aria-label="Time range"
          className="flex flex-wrap gap-1 rounded-xl border border-[var(--line)] p-1"
        >
          {RANGES.map((entry) => {
            const selected = entry.key === range
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => select(entry.key)}
                aria-pressed={selected}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: selected ? 'color-mix(in srgb, var(--series-cpu) 16%, transparent)' : 'transparent',
                  color: selected ? 'var(--ink-strong)' : 'var(--ink-soft)',
                  boxShadow: selected ? 'inset 0 0 0 1px color-mix(in srgb, var(--series-cpu) 40%, var(--line))' : 'none',
                }}
              >
                {entry.label}
              </button>
            )
          })}
        </div>
      </div>

      {failed && (
        <p className="mb-4 text-xs text-[var(--status-down)]">
          Could not reach the server for this range. Showing the last data that loaded.
        </p>
      )}

      {/* Hold the previous render while refetching rather than flashing a skeleton. */}
      <div
        className="grid gap-6 transition-opacity duration-200 lg:grid-cols-2"
        style={{ opacity: pending ? 0.55 : 1 }}
        aria-busy={pending}
      >
        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium text-[var(--ink)]">Host load</h3>
            <span className="text-xs text-[var(--ink-soft)]">percent of capacity</span>
          </div>
          <Trace
            points={load}
            series={[
              { key: 'cpu', name: 'CPU', color: 'var(--series-cpu)' },
              { key: 'ram', name: 'Memory', color: 'var(--series-ram)' },
            ]}
            max={100}
            format="percent"
            height={190}
          />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium text-[var(--ink)]">Network</h3>
            <span className="text-xs text-[var(--ink-soft)]">whole host, not just downloads</span>
          </div>
          <Trace
            points={net}
            series={[
              { key: 'rx', name: 'In', color: 'var(--series-cpu)' },
              { key: 'tx', name: 'Out', color: 'var(--series-ram)' },
            ]}
            format="rate"
            height={190}
          />
        </div>
      </div>
    </section>
  )
}
