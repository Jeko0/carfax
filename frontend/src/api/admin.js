const BASE = '/api'

function token() {
  return localStorage.getItem('cf_admin_token')
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.detail || `HTTP ${res.status}`), { status: res.status })
  return data
}

export function adminLogin(email, password) {
  return fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(async r => {
    const d = await r.json()
    if (!r.ok) throw new Error(d.detail || 'Login failed')
    return d
  })
}

// Vehicles
export const listVehicles = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))).toString()
  return req('GET', `/admin/vehicles${q ? '?' + q : ''}`)
}
export const createVehicle = data => req('POST', '/admin/vehicles', data)
export const getVehicle   = vin  => req('GET', `/admin/vehicles/${vin}`)
export const updateVehicle = (vin, data) => req('PATCH', `/admin/vehicles/${vin}`, data)
export const deleteVehicle = vin  => req('DELETE', `/admin/vehicles/${vin}`)

// History records
export const addHistory    = (vin, data) => req('POST',  `/admin/vehicles/${vin}/history`, data)
export const updateHistory = (id, data)  => req('PATCH', `/admin/history/${id}`, data)
export const deleteHistory = id          => req('DELETE', `/admin/history/${id}`)

// Parts
export const deletePart = id => req('DELETE', `/admin/history/parts/${id}`)

// Accident damages
export const deleteDamage = id => req('DELETE', `/admin/history/damages/${id}`)

// Users
export const listUsers   = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))).toString()
  return req('GET', `/admin/users${q ? '?' + q : ''}`)
}
export const updateUser = (id, data) => req('PATCH', `/admin/users/${id}`, data)
export const deleteUser = id         => req('DELETE', `/admin/users/${id}`)

// Reports
export const listReports = (params = {}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))).toString()
  return req('GET', `/admin/reports${q ? '?' + q : ''}`)
}
export const deleteReport = id => req('DELETE', `/admin/reports/${id}`)
