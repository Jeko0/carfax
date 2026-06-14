import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api/admin'

export default function AdminVehicles() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listVehicles({ search: search || undefined, limit: 100 })
      setVehicles(data)
    } catch (e) {
      if (e.status === 401) navigate('/admin/login')
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, navigate])

  useEffect(() => { load() }, [load])

  async function handleDelete(vin, e) {
    e.stopPropagation()
    if (!confirm(`წაიშალოს ავტომობილი ${vin} და მისი სრული ისტორია?`)) return
    try {
      await api.deleteVehicle(vin)
      setVehicles(vs => vs.filter(v => v.vin !== vin))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h2 className="adm-page-title">ავტომობილები</h2>
          <p className="adm-page-sub">{vehicles.length} ჩანაწერი</p>
        </div>
        <button className="adm-btn-primary" onClick={() => setShowCreate(true)}>
          <i className="ti ti-plus" /> ახალი ავტომობილი
        </button>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <i className="ti ti-search" />
          <input
            className="adm-search-input"
            placeholder="ძებნა VIN-ით, მწარმოებლით ან მოდელით…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="adm-alert-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>მწარმოებელი / მოდელი</th>
              <th>წელი</th>
              <th>გარბენი</th>
              <th>ქულა</th>
              <th>დამოწმებული</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="adm-table-empty"><div className="spinner" /></td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={7} className="adm-table-empty">ავტომობილები ვერ მოიძებნა</td></tr>
            ) : vehicles.map(v => (
              <tr
                key={v.vin}
                className="adm-table-row clickable"
                onClick={() => navigate(`/admin/vehicles/${v.vin}`)}
              >
                <td><span className="adm-mono">{v.vin}</span></td>
                <td><strong>{v.make} {v.model}</strong>{v.trim ? <span className="adm-muted"> {v.trim}</span> : null}</td>
                <td>{v.year}</td>
                <td>{v.mileage != null ? `${v.mileage.toLocaleString()} km` : '—'}</td>
                <td>
                  {v.report_score != null
                    ? <span className="adm-score-pill">{Math.round(v.report_score)}</span>
                    : <span className="adm-muted">—</span>}
                </td>
                <td>
                  {v.is_verified
                    ? <span className="adm-badge green"><i className="ti ti-check" /> კი</span>
                    : <span className="adm-badge muted">არა</span>}
                </td>
                <td>
                  <button
                    className="adm-icon-btn danger"
                    title="Delete"
                    onClick={e => handleDelete(v.vin, e)}
                  ><i className="ti ti-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={v => { setShowCreate(false); navigate(`/admin/vehicles/${v.vin}`) }}
        />
      )}
    </div>
  )
}

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ vin: '', make: '', model: '', year: String(new Date().getFullYear()) })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const vehicle = await api.createVehicle({ ...form, year: Number(form.year) })
      onCreate(vehicle)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>ახალი ავტომობილი</h3>
          <button className="adm-icon-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className="adm-modal-body">
          {error && <div className="adm-alert-error">{error}</div>}
          <div className="adm-field">
            <label className="adm-label">VIN *</label>
            <input
              className="adm-input adm-mono"
              value={form.vin}
              onChange={e => set('vin', e.target.value.toUpperCase())}
              required
              maxLength={17}
              placeholder="17-სიმბოლოიანი VIN"
            />
          </div>
          <div className="adm-row-2">
            <div className="adm-field">
              <label className="adm-label">მწარმოებელი *</label>
              <input className="adm-input" value={form.make} onChange={e => set('make', e.target.value)} required />
            </div>
            <div className="adm-field">
              <label className="adm-label">მოდელი *</label>
              <input className="adm-input" value={form.model} onChange={e => set('model', e.target.value)} required />
            </div>
          </div>
          <div className="adm-field">
            <label className="adm-label">წელი *</label>
            <input className="adm-input" type="number" value={form.year} onChange={e => set('year', e.target.value)} required min={1900} max={2030} />
          </div>
          <div className="adm-modal-actions">
            <button type="button" className="adm-btn-ghost" onClick={onClose}>გაუქმება</button>
            <button type="submit" className="adm-btn-primary" disabled={loading}>
              {loading ? 'იქმნება…' : 'შექმნა და რედაქტირება'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
