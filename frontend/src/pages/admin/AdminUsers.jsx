import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api/admin'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.listUsers({ limit: 200 }).then(setUsers).catch(e => {
      if (e.status === 401) navigate('/admin/login')
      else setError(e.message)
    }).finally(() => setLoading(false))
  }, [navigate])

  async function toggle(user, field) {
    try {
      const updated = await api.updateUser(user.id, { [field]: !user[field] })
      setUsers(us => us.map(u => u.id === updated.id ? updated : u))
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(user) {
    if (!confirm(`წაიშალოს მომხმარებელი ${user.email}?`)) return
    try {
      await api.deleteUser(user.id)
      setUsers(us => us.filter(u => u.id !== user.id))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h2 className="adm-page-title">მომხმარებლები</h2>
          <p className="adm-page-sub">{users.length} მომხმარებელი</p>
        </div>
      </div>

      {error && <div className="adm-alert-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ელ. ფოსტა</th>
              <th>სახელი</th>
              <th>აქტიური</th>
              <th>ადმინი</th>
              <th>გაწევრიანდა</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="adm-table-empty"><div className="spinner" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="adm-table-empty">მომხმარებლები ვერ მოიძებნა</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="adm-table-row">
                <td className="adm-muted">#{u.id}</td>
                <td>{u.email}</td>
                <td>{u.full_name}</td>
                <td>
                  <label className="adm-toggle" title="აქტიურობის გადართვა">
                    <input type="checkbox" checked={u.is_active} onChange={() => toggle(u, 'is_active')} />
                    <span className="adm-toggle-slider" />
                  </label>
                </td>
                <td>
                  <label className="adm-toggle" title="ადმინობის გადართვა">
                    <input type="checkbox" checked={u.is_admin} onChange={() => toggle(u, 'is_admin')} />
                    <span className="adm-toggle-slider" />
                  </label>
                </td>
                <td className="adm-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="adm-icon-btn danger" title="მომხმარებლის წაშლა" onClick={() => handleDelete(u)}>
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
