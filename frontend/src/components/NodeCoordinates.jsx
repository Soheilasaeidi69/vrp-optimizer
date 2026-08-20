export default function NodeCoordinates({ numNodes, coords, onChange, enabled, onToggle }) {
  function updateCoord(nodeId, axis, value) {
    onChange({
      ...coords,
      [nodeId]: { ...coords[nodeId], [axis]: Number(value) },
    })
  }

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: enabled ? 12 : 0 }}>
        <h2 style={{ margin: 0 }}>Node coordinates</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          use custom positions
        </label>
      </div>

      {enabled && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {Array.from({ length: numNodes }, (_, i) => i).map((nodeId) => (
            <div key={nodeId} style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                {nodeId === 0 ? 'depot (0)' : `node ${nodeId}`}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  placeholder="x"
                  value={coords[nodeId]?.x ?? ''}
                  onChange={(e) => updateCoord(nodeId, 'x', e.target.value)}
                  style={{ fontSize: 12, padding: '5px 6px' }}
                />
                <input
                  type="number"
                  placeholder="y"
                  value={coords[nodeId]?.y ?? ''}
                  onChange={(e) => updateCoord(nodeId, 'y', e.target.value)}
                  style={{ fontSize: 12, padding: '5px 6px' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}