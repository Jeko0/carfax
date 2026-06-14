import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { fetchStats } from '../api/vehicles'

export default function Home() {
  const [vin, setVin] = useState('')
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {})
  }, [])

  const handleSearch = () => {
    const v = vin.trim().toUpperCase() || '1HGBH41JXMN109186'
    navigate(`/gate/${v}`)
  }

  return (
    <>
      <Nav />

      <div className="hero">
        <div className="hero-badge">🇬🇪 საქართველოს ყველა მონაცემთა ბაზა</div>
        <h1>შეამოწმე <span>ნებისმიერი</span> მანქანის ისტორია</h1>
        <p>VIN კოდის შეყვანით მიიღე სრული ინფორმაცია მანქანის სერვისებზე, ავტოსაგზაო შემთხვევებზე, მფლობელთა რაოდენობასა და ტექ-ინსპექციაზე.</p>
        <div className="search-box">
          <label>VIN კოდი</label>
          <div className="vin-row">
            <input
              className="vin-input"
              placeholder="მაგ: 1HGBH41JXMN109186"
              maxLength={17}
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              <i className="ti ti-search" /> შეამოწმე
            </button>
          </div>
          <div className="search-note">
            <div className="dot" />
            {stats
              ? `${stats.vehicle_count.toLocaleString()} ავტომობილი · ${stats.record_count.toLocaleString()} ჩანაწერი`
              : 'საქართველოს ავტომობილების ბაზა'}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">რა ინფორმაციას მიიღებ?</div>
        <div className="section-sub">ყველა ინფორმაცია ერთ ადგილას — სახელმწიფო ბაზებიდან, სერვის ცენტრებიდან და ტექ-ინსპექციიდან</div>
        <div className="feature-grid">
          {[
            { icon: '🚗', title: 'მფლობელთა ისტორია', desc: 'რამდენი მფლობელი ჰყავს მანქანას საქართველოში რეგისტრაციის დღიდან.' },
            { icon: '🔧', title: 'სერვის ჩანაწერები', desc: 'Tegeta, Elit-Auto და 100+ სხვა სერვის ცენტრის ჩანაწერები — თარიღი, გარბენი, სამუშაო.' },
            { icon: '💥', title: 'ავარიები', desc: 'ავარიების სრული ისტორია — მცირე, საშუალო ან მნიშვნელოვანი დაზიანების სკალით.' },
            { icon: '🏁', title: 'ტექ-ინსპექტირება', desc: 'გავლილი და დახარვეზებული ტექ-ინსპექციები, თარიღი და გარბენი.' },
            { icon: '⛽', title: 'ტექნიკური მახასიათებლები', desc: 'საწვავის ტიპი, მოხმარება, ემისიის სტანდარტი, წამყვანი თვლები.' },
            { icon: '📊', title: 'TOPSIS შედარება', desc: 'შეადარე რამდენიმე VIN კოდი TOPSIS მეთოდით — იპოვე საუკეთესო ვარიანტი.' },
          ].map(f => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
