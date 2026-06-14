import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('cf_admin_token')) navigate('/admin/login')
  }, [navigate])

  function logout() {
    localStorage.removeItem('cf_admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <i className="ti ti-shield-check" />
          <span>ადმინი</span>
        </div>
        <nav className="adm-nav">
          <NavLink to="/admin/vehicles" className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-car" /> ავტომობილები
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-users" /> მომხმარებლები
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}>
            <i className="ti ti-file-description" /> ანგარიშები
          </NavLink>
        </nav>
        <button className="adm-logout-btn" onClick={logout}>
          <i className="ti ti-logout" /> გასვლა
        </button>
      </aside>
      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  )
}
