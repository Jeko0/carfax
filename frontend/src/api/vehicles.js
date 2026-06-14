const BASE = '/api'

async function _get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const fetchStats = () => _get('/vehicles/stats')
export const fetchPricingPlans = () => _get('/pricing-plans')

export const fetchVehicle = (vin) => _get(`/vehicles/${vin.toUpperCase()}`)

export async function compareVehicles(vins, weights) {
  const res = await fetch(`${BASE}/vehicles/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vins, weights }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}
