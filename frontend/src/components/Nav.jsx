import { useNavigate, useLocation } from 'react-router-dom'

export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <i className="ti ti-shield-check" />
        ქარ-ფაქსი.ge
      </div>
      <div className="nav-btns">
        <button
          className={`nav-pill${pathname === '/' ? ' active' : ''}`}
          onClick={() => navigate('/')}
        >მთავარი</button>
        <button
          className={`nav-pill${pathname.startsWith('/compare') ? ' active' : ''}`}
          onClick={() => navigate('/compare')}
        >შედარება</button>
      </div>
    </nav>
  )
}
