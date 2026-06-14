import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchVehicle } from '../api/vehicles'
import TimelineItem from '../components/TimelineItem'

const RATING_KEYS = [
  { key: 'score_technical',       label: 'ტექნიკური მდგომარეობა' },
  { key: 'score_service_history', label: 'სერვის ისტორია' },
  { key: 'score_accidents',       label: 'ავარიები' },
  { key: 'score_owners',          label: 'მფლობელები' },
  { key: 'score_tech_inspection', label: 'ტექ-ინსპექტირება' },
]

function ratingColor(v) {
  if (v >= 75) return '#1D9E75'
  if (v >= 50) return '#E8A020'
  return '#C0392B'
}

export default function Report() {
  const { vin } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!vin) return
    setLoading(true)
    fetchVehicle(vin)
      .then(setVehicle)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [vin])

  if (!vin) {
    return (
      <>
        <div className="page-top">
          <div className="logo"><i className="ti ti-shield-check" /> კარ<span>ფაქსი</span>.ge</div>
          <div className="top-actions">
            <button className="top-btn" onClick={() => navigate('/')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} /> მთავარი
            </button>
          </div>
        </div>
        <div className="wrap" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>VIN კოდი არ არის მითითებული</p>
          <button className="search-btn" onClick={() => navigate('/')}>მთავარზე დაბრუნება</button>
        </div>
      </>
    )
  }

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p>ანგარიში იტვირთება...</p>
    </div>
  )

  if (error) return (
    <div className="error-wrap">
      <i className="ti ti-alert-circle" style={{ fontSize: 32, color: 'var(--red)', display: 'block', marginBottom: 8 }} />
      <p style={{ color: 'var(--red)', marginBottom: 8 }}>{error}</p>
      <button className="search-btn" onClick={() => navigate('/')}>უკან</button>
    </div>
  )

  const v = vehicle
  const history = v.history_records || []
  const serviceCount  = history.filter(h => h.event_type === 'service').length
  const accidentCount = history.filter(h => h.event_type === 'accident').length
  const techTotal     = history.filter(h => h.event_type === 'tech_inspection').length
  const techPass      = history.filter(h => h.event_type === 'tech_inspection' && h.tech_inspection_passed).length

  const FILTER_MAP = {
    svc:  'service',
    acc:  'accident',
    tech: 'tech_inspection',
    own:  'ownership',
  }
  const filtered = filter === 'all'
    ? history
    : history.filter(h => h.event_type === FILTER_MAP[filter])

  const score = v.report_score ?? null

  return (
    <>
      <div className="page-top">
        <div className="logo"><i className="ti ti-shield-check" /> კარ<span>ფაქსი</span>.ge</div>
        <div className="top-actions">
          <button className="top-btn" onClick={() => navigate(`/gate/${vin}`)}>
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }} /> უკან
          </button>
          <button className="top-btn accent">
            <i className="ti ti-download" style={{ fontSize: 13 }} /> PDF
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="car-hero">
          <div>
            <div className="car-badge">
              <i className="ti ti-shield-check" style={{ fontSize: 11 }} /> ვერიფიცირებული ანგარიში
            </div>
            <div className="car-title">{v.make} {v.model} {v.trim || ''}</div>
            <div className="car-vin-label">VIN: {v.vin}</div>
            <div className="car-tags">
              <span className="car-tag tag-blue"><i className="ti ti-calendar" style={{ fontSize: 11 }} /> {v.year} წელი</span>
              {techPass > 0 && <span className="car-tag tag-green"><i className="ti ti-check" style={{ fontSize: 11 }} /> ტექ-ინსპ. გავლილი</span>}
              {accidentCount > 0 && <span className="car-tag tag-amber"><i className="ti ti-alert-triangle" style={{ fontSize: 11 }} /> {accidentCount} ავარია</span>}
              <span className="car-tag tag-blue"><i className="ti ti-tool" style={{ fontSize: 11 }} /> {serviceCount} სერვისი</span>
              <span className="car-tag tag-blue"><i className="ti ti-user" style={{ fontSize: 11 }} /> {v.owner_count ?? '—'} მფლობელი</span>
            </div>
          </div>
          <div className="score-block">
            <div className="score-ring">
              {score != null
                ? <><div className="score-big">{Math.round(score)}</div><div className="score-of">/100</div></>
                : <div className="score-big" style={{ fontSize: 28 }}>—</div>}
            </div>
            {score != null && <div className="score-verdict">{v.score_verdict || 'კარგი მდგომარეობა'}</div>}
            <div className="score-sub">ანგარიშური ქულა</div>
          </div>
        </div>

        <div className="specs-row">
          {[
            { icon: 'ti-calendar',       lbl: 'წელი',           val: v.year },
            { icon: 'ti-gas-station',    lbl: 'საწვავი',        val: v.fuel_type || '—' },
            { icon: 'ti-leaf',           lbl: 'ემისია',         val: v.emission_standard || '—' },
            { icon: 'ti-flame',          lbl: 'მოხმ. ლ/100',   val: v.fuel_consumption != null ? v.fuel_consumption : '—' },
            { icon: 'ti-steering-wheel', lbl: 'წამყვ. თვლები', val: v.drive_type || '—' },
          ].map(s => (
            <div key={s.lbl} className="spec-card">
              <div className="spec-icon"><i className={`ti ${s.icon}`} /></div>
              <div className="spec-lbl">{s.lbl}</div>
              <div className="spec-val">{s.val}</div>
            </div>
          ))}
        </div>

        <div className="summary-cards">
          <div className="sum-c">
            <div className="sum-ic ic-blue"><i className="ti ti-user" style={{ color: '#185FA5' }} /></div>
            <div>
              <div className="sum-num">{v.owner_count ?? '—'}</div>
              <div className="sum-lbl">მფლობელი საქართველოში</div>
            </div>
          </div>
          <div className="sum-c">
            <div className="sum-ic ic-green"><i className="ti ti-tool" style={{ color: '#0F6E56' }} /></div>
            <div>
              <div className="sum-num">{serviceCount}</div>
              <div className="sum-lbl">სერვის ჩანაწერი</div>
            </div>
          </div>
          <div className="sum-c">
            <div className="sum-ic ic-red"><i className="ti ti-alert-triangle" style={{ color: '#C0392B' }} /></div>
            <div>
              <div className="sum-num">{accidentCount}</div>
              <div className="sum-lbl">ავარია</div>
            </div>
          </div>
        </div>

        <div className="rating-card">
          <h4><i className="ti ti-chart-bar" style={{ fontSize: 14, marginRight: 6 }} />შეფასების სკალა</h4>
          {RATING_KEYS.map(({ key, label }) => {
            const val = Math.round(v[key] ?? 0)
            return (
              <div key={key} className="r-row">
                <div className="r-key">{label}</div>
                <div className="r-bg">
                  <div className="r-fill" style={{ width: `${val}%`, background: ratingColor(val) }} />
                </div>
                <div className="r-val">{val}</div>
              </div>
            )
          })}
        </div>

        <div className="tl-head-row">
          <h3>ავტომობილის ისტორია</h3>
          <div className="filter-chips">
            {[
              { id: 'all',  label: 'ყველა',            cls: 'active-all' },
              { id: 'svc',  label: 'სერვისი',           cls: 'active-svc' },
              { id: 'acc',  label: 'ავარია',            cls: 'active-acc' },
              { id: 'tech', label: 'ტექ-ინსპექტირება',  cls: 'active-tech' },
              { id: 'own',  label: 'მფლობელობა',        cls: 'active-own' },
            ].map(f => (
              <span
                key={f.id}
                className={`fchip${filter === f.id ? ` ${f.cls}` : ''}`}
                onClick={() => setFilter(f.id)}
              >{f.label}</span>
            ))}
          </div>
        </div>

        <div className="timeline">
          {filtered.length === 0 ? (
            <div className="no-more">ჩანაწერები არ მოიძებნა</div>
          ) : (
            filtered.map(r => <TimelineItem key={r.id} record={r} />)
          )}
          {filter === 'all' && (
            <div className="no-more">
              <i className="ti ti-history" style={{ fontSize: 16, verticalAlign: -2, marginRight: 6 }} />
              ისტორიის დასაწყისი — {v.year} წელს პირველი რეგისტრაცია
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
          <button
            style={{ background: 'var(--brand2)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => navigate('/compare')}
          >
            <i className="ti ti-chart-bar" /> TOPSIS შედარებაზე გადასვლა ↗
          </button>
        </div>
      </div>
    </>
  )
}
