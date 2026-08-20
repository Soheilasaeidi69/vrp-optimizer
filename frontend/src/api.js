const BASE = '/api'

export async function createRun(payload) {
  const res = await fetch(`${BASE}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create run: ${res.status}`)
  return res.json()
}

export async function listRuns() {
  const res = await fetch(`${BASE}/runs`)
  if (!res.ok) throw new Error('Failed to list runs')
  return res.json()
}

export async function getRunStatus(id) {
  const res = await fetch(`${BASE}/runs/${id}`)
  if (!res.ok) throw new Error('Failed to fetch run status')
  return res.json()
}

export async function getRunResult(id) {
  const res = await fetch(`${BASE}/runs/${id}/result`)
  if (!res.ok) throw new Error('Failed to fetch run result')
  return res.json()
}
