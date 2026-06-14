import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api/admin'

export default function AdminReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [vinFilter, setVinFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.listReports({ vin: vinFilter || undefined, limit: 200 }).then(setReports).catch(e => {
      if (e.status === 401) navigate('/admin/login')
      else setError(e.message)
    }).finally(() => setLoading(false))
  }, [vinFilter, navigate])

  async function handleDelete(id) {
    if (!confirm(`წაიშალოს ანგარიში #${id}?`)) return
    try {
      await api.deleteReport(id)
      setReports(rs => rs.filter(r => r.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  const statusColor = s => s === 'completed' ? 'green' : s === 'failed' ? 'red' : 'muted'

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h2 className="adm-page-title">ანგარიშები</h2>
          <p className="adm-page-sub">{reports.length} ჩანაწერი</p>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <i className="ti ti-search" />
          <input
            className="adm-search-input adm-mono"
            placeholder="VIN-ით ფილტრი…"
            value={vinFilter}
            onChange={e => setVinFilter(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {error && <div className="adm-alert-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>VIN</th>
              <th>მოითხოვა</th>
              <th>სტატუსი</th>
              <th>თარიღი</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="adm-table-empty"><div className="spinner" /></td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={6} className="adm-table-empty">ანგარიშები ვერ მოიძებნა</td></tr>
            ) : reports.map(r => (
              <tr key={r.id} className="adm-table-row">
                <td className="adm-muted">#{r.id}</td>
                <td><span className="adm-mono">{r.vin}</span></td>
                <td className="adm-muted">{r.requested_by != null ? `მომხმარებელი #${r.requested_by}` : 'ანონიმური'}</td>
                <td><span className={`adm-badge ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="adm-muted">{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <button className="adm-icon-btn danger" title="წაშლა" onClick={() => handleDelete(r.id)}>
                    <i className="ti ti-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
