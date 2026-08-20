import { useState } from 'react'

const DEFAULTS = {
  name: 'Baseline run',
  alpha: 3,
  beta: 3,
  num_vehicles: 2,
  num_periods: 2,
  num_product_types: 2,
  num_modes: 3,
  time_limit_seconds: 300,
}

export default function ConfigForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(DEFAULTS)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { name, time_limit_seconds, ...rest } = form
    onSubmit({
      name,
      parameters: {
        ...rest,
        time_limit_seconds: Number(time_limit_seconds),
        variable_cost_range: [3, 15],
        fixed_cost_range: [3, 15],
        travel_cost_range: [5, 10],
        risk_range: [0, 1],
        maintenance_cost_range: [5, 10],
        access_cost_range: [5, 10],
        vehicle_capacity_range: [80, 150],
        customer_capacity_range: [50, 100],
        product_weight_range: [5, 10],
        solver: 'cbc',
        objective_weights: [0.5, 0.5],
      },
    })
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Scenario configuration</h2>

      <div className="field">
        <label htmlFor="name">Run name</label>
        <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="alpha">Line-haul nodes (alpha)</label>
          <input id="alpha" type="number" min="1" max="30" value={form.alpha} onChange={(e) => update('alpha', Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="beta">Back-haul nodes (beta)</label>
          <input id="beta" type="number" min="1" max="30" value={form.beta} onChange={(e) => update('beta', Number(e.target.value))} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="vehicles">Fleet size</label>
          <input id="vehicles" type="number" min="1" max="20" value={form.num_vehicles} onChange={(e) => update('num_vehicles', Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="periods">Planning periods</label>
          <input id="periods" type="number" min="1" max="10" value={form.num_periods} onChange={(e) => update('num_periods', Number(e.target.value))} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="products">Product types</label>
          <input id="products" type="number" min="1" max="10" value={form.num_product_types} onChange={(e) => update('num_product_types', Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="modes">Links between each pair of nodes</label>
          <input id="modes" type="number" min="1" max="5" value={form.num_modes} onChange={(e) => update('num_modes', Number(e.target.value))} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="timeout">Solver time limit (seconds)</label>
        <input id="timeout" type="number" min="10" max="3600" value={form.time_limit_seconds} onChange={(e) => update('time_limit_seconds', e.target.value)} />
      </div>

      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? 'Queuing solve…' : 'Run optimization'}
      </button>
    </form>
  )
}