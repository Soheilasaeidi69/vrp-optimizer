import { useEffect, useRef, useState } from 'react'
import ConfigForm from './components/ConfigForm.jsx'
import ResultsDashboard from './components/ResultsDashboard.jsx'
import NodeCoordinates from './components/NodeCoordinates.jsx'
import { createRun, getRunStatus, getRunResult } from './api.js'

export default function App() {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [numNodes, setNumNodes] = useState(7)
  const [coords, setCoords] = useState({})
  const [useCustomCoords, setUseCustomCoords] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  async function handleSubmit(payload) {
    setNumNodes(payload.parameters.alpha + payload.parameters.beta + 1)
    setSubmitting(true)
    setResult(null)
    try {
      const run = await createRun(payload)
      setStatus(run)
      pollRef.current = setInterval(async () => {
        const s = await getRunStatus(run.id)
        setStatus(s)
        if (s.status === 'completed' || s.status === 'failed') {
          clearInterval(pollRef.current)
          const r = await getRunResult(run.id)
          setResult(r)
          setSubmitting(false)
        }
      }, 2000)
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1>Routing optimizer</h1>
        <span className="tag">multi-period · multi-vehicle · pickup &amp; delivery</span>
      </div>
      <div className="layout">
        <div>
          <ConfigForm onSubmit={handleSubmit} submitting={submitting} />
          <NodeCoordinates
            numNodes={numNodes}
            coords={coords}
            onChange={setCoords}
            enabled={useCustomCoords}
            onToggle={setUseCustomCoords}
          />
        </div>
        <ResultsDashboard status={status} result={result} coords={useCustomCoords ? coords : null} />
      </div>
    </div>
  )
}