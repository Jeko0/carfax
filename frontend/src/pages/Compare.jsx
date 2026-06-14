import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { compareVehicles } from '../api/vehicles'

const CRITERIA_DEF = [
  { key: 'service_history', label: 'სერვის ისტორია', icon: 'ti-tool' },
  { key: 'accidents',       label: 'ავარიები',        icon: 'ti-alert-triangle' },
  { key: 'owners',          label: 'მფლობელთა რაოდ.', icon: 'ti-user' },
  { key: 'mileage',         label: 'გარბენი',          icon: 'ti-road' },
  { key: 'tech_inspection', label: 'ტექ-ინსპექტირება', icon: 'ti-clipboard-check' },
]

const PRESETS = {
  balanced: [25, 25, 20, 20, 10],
  safety:   [15, 40, 15, 15, 15],
  value:    [20, 20, 20, 30, 10],
  eco:      [30, 15, 20, 20, 15],
}

const RANK_CLS = ['rn-gold', 'rn-silver', 'rn-bronze', 'rn-plain']

const TABLE_ROWS = [
  { section: 'ტექ. მახასიათებლები', items: [
    { label: 'წელი',       icon: 'ti-calendar',       field: 'year',             better: 'higher' },
    { label: 'საწვავი',    icon: 'ti-gas-station',    field: 'fuel_type',        better: 'none' },
    { label: 'ემისია',     icon: 'ti-leaf',           field: 'emission_standard',better: 'none' },
    { label: 'მოხ. ლ/100', icon: 'ti-flame',          field: 'fuel_consumption', better: 'lower' },
    { label: 'წ. თვლები',  icon: 'ti-steering-wheel', field: 'drive_type',       better: 'none' },
  ]},
  { section: 'ისტ. მახასიათებლები', items: [
    { label: 'გარბენი კმ', icon: 'ti-road',            field: 'mileage',       better: 'lower' },
    { label: 'მფლობ.',     icon: 'ti-user',            field: 'owner_count',   better: 'lower' },
    { label: 'სერვ.',      icon: 'ti-tool',            field: 'service_count', better: 'higher' },
    { label: 'ავარ.',      icon: 'ti-alert-triangle',  field: 'accident_count',better: 'lower' },
    { label: 'ტექ-ინსპ.', icon: 'ti-clipboard-check', field: 'tech_ratio',    better: 'higher' },
  ]},
]

function cellClass(val, all, better) {
  if (better === 'none' || all.some(v => v === null)) return ''
  const nums = all.filter(v => v !== null)
  const best = better === 'higher' ? Math.max(...nums) : Math.min(...nums)
  const worst = better === 'higher' ? Math.min(...nums) : Math.max(...nums)
  if (val === best) return 'c-best'
  if (val === worst) return 'c-worst'
  return ''
}

export default function Compare() {
  const navigate = useNavigate()
  const [vinInput, setVinInput] = useState('')
  const [vins, setVins] = useState([])
  const [weights, setWeights] = useState([25, 25, 20, 20, 10])
  const [activePreset, setActivePreset] = useState('balanced')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const addVin = () => {
    const v = vinInput.trim().toUpperCase()
    if (v.length < 5 || vins.includes(v) || vins.length >= 4) return
    setVins(prev => [...prev, v])
    setVinInput('')
  }

  const removeVin = vin => setVins(prev => prev.filter(v => v !== vin))

  const onSlider = (idx, val) => {
    setWeights(prev => {
      const next = [...prev]
      next[idx] = Number(val)
      return next
    })
    setActivePreset(null)
  }

  const applyPreset = name => {
    setWeights([...PRESETS[name]])
    setActivePreset(name)
  }

  const runCompare = useCallback(async () => {
    if (vins.length < 2) { setError('მინ. 2 VIN კოდი შეიყვანე'); return }
    setLoading(true); setError(null)
    const w = {
      service_history: weights[0], accidents: weights[1],
      owners: weights[2], mileage: weights[3], tech_inspection: weights[4],
    }
    try {
      const data = await compareVehicles(vins, w)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [vins, weights])

  const ranking = result?.ranking ?? []
  const winner = ranking[0]

  return (
    <>
      <div className="page-top">
        <div className="logo"><i className="ti ti-shield-check" /> კარ<span>ფაქსი</span>.ge</div>
        <button className="top-btn" onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left" style={{ fontSize: 13 }} /> მთავარი
        </button>
      </div>

      <div className="wrap" style={{ maxWidth: 960 }}>
        <div className="compare-header">
          <h2>TOPSIS შედარება</h2>
          <p>შეიყვანე VIN კოდები, დაარეგულირე წონები და გაარკვიე საუკეთესო ვარიანტი</p>
        </div>

        <div className="topsis-layout">
          {/* Weight panel */}
          <div className="weight-panel">
            <div className="wp-head">
              <h3><i className="ti ti-adjustments-horizontal" style={{ fontSize: 14, marginRight: 5 }} />კრიტ. წონები</h3>
              <p>სლაიდერებით დაარეგულირე — ჯამი უნდა იყოს 100%</p>
            </div>
            <div className="total-pill">
              <span className="total-label"><i className="ti ti-sum" style={{ fontSize: 13, verticalAlign: -1, marginRight: 3 }} />ჯამი</span>
              <span className={`total-val ${totalWeight === 100 ? 'ok' : totalWeight > 100 ? 'over' : 'under'}`}>{totalWeight}%</span>
            </div>
            <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {Object.keys(PRESETS).map(p => (
                <button key={p} className={`preset-btn${activePreset === p ? ' active' : ''}`} onClick={() => applyPreset(p)}>
                  {{ balanced: 'გათანაბრებული', safety: 'უსაფრთხოება', value: 'ღირებულება', eco: 'ეკო' }[p]}
                </button>
              ))}
            </div>
            <div className="crit-list">
              {CRITERIA_DEF.map((c, i) => (
                <div key={c.key} className="crit-row">
                  <div className="crit-top">
                    <span className="crit-name"><i className={`ti ${c.icon}`} /> {c.label}</span>
                    <span className="crit-pct">{weights[i]}%</span>
                  </div>
                  <input type="range" className="crit-slider" min={0} max={100} step={1}
                    value={weights[i]} onChange={e => onSlider(i, e.target.value)} />
                  <div className="crit-bar-bg">
                    <div className="crit-bar-fill" style={{ width: `${weights[i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="reset-btn" onClick={() => applyPreset('balanced')}>
              <i className="ti ti-refresh" style={{ fontSize: 13 }} /> გადაყენება
            </button>
          </div>

          {/* Right column */}
          <div>
            {/* VIN input */}
            <div className="add-bar">
              <input
                placeholder="VIN კოდი (min 5 სიმბ.)"
                maxLength={17}
                value={vinInput}
                onChange={e => setVinInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && addVin()}
              />
              <button className="add-car-btn" onClick={addVin}>
                <i className="ti ti-plus" /> დამატება
              </button>
              <span className="add-note">მაქს. 4 ავტომობილი</span>
            </div>

            {vins.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
                {vins.map(v => (
                  <div key={v} style={{ background: 'var(--brand)', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v}
                    <button onClick={() => removeVin(v)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 4, width: 18, height: 18, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button
              className="pay-btn"
              style={{ marginBottom: '1.5rem' }}
              onClick={runCompare}
              disabled={loading || vins.length < 2}
            >
              {loading
                ? <><i className="ti ti-loader" /> იანგარიშება...</>
                : <><i className="ti ti-calculator" /> TOPSIS გაანგარიშება</>
              }
            </button>

            {error && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, padding: '12px 14px', color: '#791F1F', marginBottom: '1rem', fontSize: 13 }}>
                <i className="ti ti-alert-circle" /> {error}
              </div>
            )}

            {ranking.length > 0 && (
              <>
                <div className="topsis-result">
                  <div className="tr-head">
                    <div />
                    <div>ავტომობილი</div>
                    <div style={{ textAlign: 'right' }}>ქულა</div>
                    <div>პოზ.</div>
                  </div>
                  {ranking.map((entry, idx) => {
                    const s = entry.topsis_score
                    const maxS = ranking[0].topsis_score || 1
                    const pct = Math.round((s / maxS) * 100)
                    const scoreColor = s > 0.65 ? '#085041' : s > 0.4 ? '#633806' : '#791F1F'
                    return (
                      <div key={entry.car.vin} className={`tr-row${idx === 0 ? ' top-car' : ''}`}>
                        <div className={`rank-num ${RANK_CLS[idx] || 'rn-plain'}`}>{entry.rank}</div>
                        <div className="car-info">
                          <div className="vin">{entry.car.vin}</div>
                          <div className="model">{entry.car.model_label}</div>
                        </div>
                        <div className="score-display" style={{ color: scoreColor }}>{s.toFixed(2)}</div>
                        <div className="bar-wrap">
                          <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {winner && (
                  <div className="verdict-box">
                    <i className="ti ti-trophy" />
                    <span>
                      <strong>TOPSIS შედეგი:</strong> <strong>{winner.car.model_label}</strong> ({winner.car.vin}) — საუკეთესო ვარიანტია. ქულა: <strong>{winner.topsis_score.toFixed(2)}</strong>
                    </span>
                  </div>
                )}

                <CompareTable ranking={ranking} navigate={navigate} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function CompareTable({ ranking, navigate }) {
  const cars = ranking.map(e => e.car)
  const n = cars.length
  const gridCols = `minmax(90px,1fr) repeat(${n},minmax(0,1fr))`

  return (
    <div className="comp-table">
      {/* header */}
      <div className="ct-head-row" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
        <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', borderRight: '1px solid var(--border)' }}>კრიტ.</div>
        {cars.map((c, i) => (
          <div key={c.vin} style={{ padding: '8px 10px', borderRight: i < n - 1 ? '.5px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '.06em' }}>{i === 0 ? '🏆 ' : ''}{c.vin}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{c.model_label.split(' · ')[0]}</div>
          </div>
        ))}
      </div>

      {TABLE_ROWS.map(sec => (
        <div key={sec.section}>
          <div className="ct-sec-label" style={{ display: 'block', gridColumn: `1/${n + 2}` }}>{sec.section}</div>
          {sec.items.map(row => {
            const vals = cars.map(c => {
              if (row.field === 'tech_ratio') return c.tech_total > 0 ? `${c.tech_pass}/${c.tech_total}` : '—'
              const raw = c[row.field]
              return raw != null ? raw : '—'
            })
            const nums = vals.map(v => {
              const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
              return isNaN(n) ? null : n
            })
            return (
              <div key={row.field} className="ct-data-row" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
                <div className="ct-label-cell">
                  <i className={`ti ${row.icon}`} style={{ fontSize: 13 }} />{row.label}
                </div>
                {vals.map((v, i) => {
                  const cls = cellClass(nums[i], nums, row.better)
                  const isWinner = i === 0
                  return (
                    <div
                      key={i}
                      className={`ct-val-cell${isWinner ? ' winner-col' : ''} ${cls}`}
                      style={{ borderRight: i < n - 1 ? '.5px solid var(--border)' : 'none' }}
                    >
                      {typeof v === 'number' ? v.toLocaleString() : v}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ))}

      <div className="verdict-row" style={{ display: 'flex' }}>
        <div className="verdict-text">
          <strong>TOPSIS შედეგი:</strong> {ranking[0]?.car.model_label} — საუკეთესო ვარიანტია.
        </div>
        <button className="verdict-btn" onClick={() => navigate(`/report/${ranking[0]?.car.vin}`)}>
          <i className="ti ti-file-description" style={{ fontSize: 14 }} /> სრული ანგარიში
        </button>
      </div>
    </div>
  )
}
