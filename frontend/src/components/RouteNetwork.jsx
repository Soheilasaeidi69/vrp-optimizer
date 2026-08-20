const COLORS = ['#ff9f45', '#4ad6a5', '#6ea8ff', '#ff6b9d', '#c792ea', '#ffd166']

export default function RouteNetwork({ routes }) {
  if (!routes?.length) return null

  const periods = Array.from(new Set(routes.map((r) => r.period))).sort((a, b) => a - b)
  const vehicles = Array.from(new Set(routes.map((r) => r.vehicle))).sort((a, b) => a - b)
  const colorFor = (vehicle) => COLORS[vehicles.indexOf(vehicle) % COLORS.length]

  const nodeSet = new Set()
  routes.forEach((r) => {
    nodeSet.add(r.from)
    nodeSet.add(r.to)
  })
  const nodes = Array.from(nodeSet).sort((a, b) => a - b)

  const size = 340
  const center = size / 2
  const radius = size / 2 - 55
  const positions = {}
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
    positions[n] = {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  })

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <h2>Route network</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {periods.map((period) => (
          <PeriodDiagram
            key={period}
            period={period}
            routes={routes.filter((r) => r.period === period)}
            vehicles={vehicles}
            colorFor={colorFor}
            positions={positions}
            size={size}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {vehicles.map((v) => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
            <span style={{ width: 14, height: 3, background: colorFor(v), display: 'inline-block' }} />
            vehicle {v}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', opacity: 0.7 }}>
        Node 0 is the depot. Each colored line traces one vehicle's tour in order, starting and ending at the depot. The "L" label on each line shows which link was used.
      </div>
    </div>
  )
}

function buildTours(edges) {
  const remaining = edges.map((e) => ({ ...e, used: false }))
  const tours = []

  while (remaining.some((e) => !e.used)) {
    let start = remaining.find((e) => !e.used && e.from === 0)
    if (!start) start = remaining.find((e) => !e.used)
    if (!start) break

    const path = [start.from]
    let current = start.from
    start.used = true
    path.push(start.to)
    current = start.to

    let steps = 0
    while (current !== path[0] && steps < remaining.length + 1) {
      const next = remaining.find((e) => !e.used && e.from === current)
      if (!next) break
      next.used = true
      path.push(next.to)
      current = next.to
      steps += 1
    }
    tours.push(path)
  }

  return tours
}

function PeriodDiagram({ period, routes, vehicles, colorFor, positions, size }) {
  const toursByVehicle = vehicles.map((v) => ({
    vehicle: v,
    tours: buildTours(routes.filter((r) => r.vehicle === v)),
  }))

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        period {period}
      </div>
      <svg width={size} height={size}>
        <defs>
          {vehicles.map((v) => (
            <marker
              key={v}
              id={`arrow-p${period}-${v}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill={colorFor(v)} />
            </marker>
          ))}
        </defs>

        {toursByVehicle.map(({ vehicle, tours }) =>
          tours.map((path, tourIdx) =>
            path.slice(0, -1).map((node, i) => {
              const from = positions[node]
              const to = positions[path[i + 1]]
              if (!from || !to) return null
              const dx = to.x - from.x
              const dy = to.y - from.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const shrink = 20
              const x2 = to.x - (dx / dist) * shrink
              const y2 = to.y - (dy / dist) * shrink
              const midX = (from.x + to.x) / 2
              const midY = (from.y + to.y) / 2
              const mode = routes.find(
                (r) => r.vehicle === vehicle && r.from === node && r.to === path[i + 1]
              )?.mode
              return (
                <g key={`${vehicle}-${tourIdx}-${i}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={x2}
                    y2={y2}
                    stroke={colorFor(vehicle)}
                    strokeWidth={2}
                    opacity={0.9}
                    markerEnd={`url(#arrow-p${period}-${vehicle})`}
                  />
                  {mode !== undefined && (
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="var(--font-mono)"
                      fontSize={9}
                      fill={colorFor(vehicle)}
                      style={{ paintOrder: 'stroke', stroke: 'var(--panel)', strokeWidth: 3 }}
                    >
                      L{mode + 1}
                    </text>
                  )}
                </g>
              )
            })
          )
        )}

        {Object.keys(positions).map((nStr) => {
          const n = Number(nStr)
          const pos = positions[n]
          const isDepot = n === 0
          return (
            <g key={n}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isDepot ? 15 : 12}
                fill={isDepot ? '#16212c' : '#1c2a37'}
                stroke={isDepot ? '#ff9f45' : '#2a3a48'}
                strokeWidth={isDepot ? 2 : 1.5}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--text)"
              >
                {n}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}