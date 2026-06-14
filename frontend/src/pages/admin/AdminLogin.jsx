import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, listUsers } from '../../api/admin'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { access_token } = await adminLogin(email, password)
      localStorage.setItem('cf_admin_token', access_token)
      try {
        await listUsers({ limit: 1 })
      } catch (err) {
        localStorage.removeItem('cf_admin_token')
        if (err.status === 403) throw new Error('ამ ანგარიშს არ აქვს ადმინის წვდომა.')
        throw err
      }
      navigate('/admin/vehicles')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-head">
          <div className="adm-login-icon"><i className="ti ti-shield-check" /></div>
          <h2>ადმინ პანელი</h2>
          <p>CarFax ადმინისტრაცია</p>
        </div>
        <form onSubmit={handleSubmit} className="adm-login-body">
          {error && <div className="adm-alert-error">{error}</div>}
          <div className="adm-field">
            <label className="adm-label">ელ. ფოსტა</label>
            <input
              className="adm-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="adm-field">
            <label className="adm-label">პაროლი</label>
            <input
              className="adm-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="adm-btn-primary adm-btn-full" disabled={loading}>
            {loading ? 'შესვლა…' : 'შესვლა'}
          </button>
        </form>
      </div>
    </div>
  )
}
