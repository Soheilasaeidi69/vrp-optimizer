import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RouteNetwork from './RouteNetwork.jsx'

const STATUS_CLASS = {
  queued: 'status-queued',
  running: 'status-running',
  completed: 'status-completed',
  failed: 'status-failed',
}

export default function ResultsDashboard({ status, result, coords }) {
  if (!status) {
    return (
      <div className="panel">
        <div className="empty-state">Configure a scenario on the left and run it to see results here.</div>
      </div>
    )
  }

  const isDone = status.status === 'completed'
  const isFailed = status.status === 'failed'

  const inventorySeries = buildInventorySeries(result?.inventory_levels)

  return (
    <div>
      <div className="panel" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{status.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{status.id}</div>
        </div>
        <span className={`status-pill ${STATUS_CLASS[status.status] ?? ''}`}>{status.status}</span>
      </div>

      {isFailed && (
        <div className="panel" style={{ borderColor: 'var(--bad)' }}>
          <h2 style={{ color: 'var(--bad)' }}>Solve failed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-dim)' }}>{result?.error_message}</pre>
        </div>
      )}

      {!isDone && !isFailed && (
        <div className="panel">
          <div className="empty-state">Solving… this can take a few minutes for larger scenarios.</div>
        </div>
      )}

      {isDone && (
        <>
          <div className="kpi-row">
            <div className="kpi">
              <div className="label">Total cost</div>
              <div className="value">{fmt(result?.objectives?.cost)}</div>
            </div>
            <div className="kpi">
              <div className="label">Total risk</div>
              <div className="value">{fmt(result?.objectives?.risk)}</div>
            </div>
            <div className="kpi">
              <div className="label">Solve time</div>
              <div className="value">{fmt(result?.solve_time_seconds)}s</div>
            </div>
          </div>

          <RouteNetwork routes={result?.routes} customCoords={coords} />

          <div className="panel" style={{ marginBottom: 20 }}>
            <h2>Inventory levels over time</h2>
            {inventorySeries.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={inventorySeries}>
                  <CartesianGrid stroke="#2a3a48" strokeDasharray="3 3" />
                  <XAxis dataKey="period" stroke="#8b9bab" fontSize={12} />
                  <YAxis stroke="#8b9bab" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#16212c', border: '1px solid #2a3a48' }} />
                  <Line type="monotone" dataKey="level" stroke="#ff9f45" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No inventory data returned.</div>
            )}
          </div>

          <div className="panel">
            <h2>Selected routes ({result?.routes?.length ?? 0})</h2>
            {result?.routes?.length ? (
              groupByPeriod(result.routes).map(([period, rows]) => (
                <div key={period} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    period {period}
                  </div>
                  <table>
                    <thead>
                      <tr><th>From</th><th>To</th><th>Mode</th><th>Vehicle</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.from}</td><td>{r.to}</td><td>{r.mode}</td><td>{r.vehicle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div className="empty-state">No routes returned.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function fmt(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function groupByPeriod(routes) {
  const byPeriod = {}
  for (const r of routes) {
    if (!byPeriod[r.period]) byPeriod[r.period] = []
    byPeriod[r.period].push(r)
  }
  return Object.entries(byPeriod).sort((a, b) => Number(a[0]) - Number(b[0]))
}

function buildInventorySeries(levels) {
  if (!levels?.length) return []
  const byPeriod = {}
  for (const l of levels) {
    byPeriod[l.period] = (byPeriod[l.period] ?? 0) + l.level
  }
  return Object.entries(byPeriod)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([period, level]) => ({ period, level }))
}