import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../../api/admin'

const EVENT_TYPES = [
  { value: 'service',         label: 'სერვისი' },
  { value: 'accident',        label: 'ავარია' },
  { value: 'tech_inspection', label: 'ტექ. ინსპექტირება' },
  { value: 'ownership',       label: 'მფლობელობა' },
]
const SEVERITY_OPTIONS = [
  { value: 'minor',       label: 'მცირე' },
  { value: 'medium',      label: 'საშუალო' },
  { value: 'significant', label: 'მნიშვნელოვანი' },
  { value: 'critical',    label: 'კრიტიკული' },
]
const PART_ACTIONS = [
  { value: 'replaced', label: 'შეცვლილი' },
  { value: 'repaired',  label: 'შეკეთებული' },
  { value: 'checked',   label: 'შემოწმებული' },
]
const DAMAGE_SEVERITIES = [
  { value: 'none',     label: 'არ არის' },
  { value: 'cosmetic', label: 'კოსმეტიკური' },
  { value: 'minor',    label: 'მცირე' },
  { value: 'moderate', label: 'საშუალო' },
  { value: 'major',    label: 'მძიმე' },
]

function labelFor(arr, value) {
  return arr.find(x => x.value === value)?.label ?? value
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function AdminVehicleDetail() {
  const { vin } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [histories, setHistories] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [historyModal, setHistoryModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', record }

  useEffect(() => {
    api.getVehicle(vin).then(v => {
      setVehicle(v)
      setForm(vehicleToForm(v))
      setHistories(v.history_records || [])
    }).catch(e => {
      if (e.status === 401) navigate('/admin/login')
      else setError(e.message)
    }).finally(() => setLoading(false))
  }, [vin, navigate])

  function vehicleToForm(v) {
    return {
      make: v.make ?? '',
      model: v.model ?? '',
      year: v.year ?? '',
      trim: v.trim ?? '',
      color: v.color ?? '',
      engine: v.engine ?? '',
      transmission: v.transmission ?? '',
      fuel_type: v.fuel_type ?? '',
      emission_standard: v.emission_standard ?? '',
      fuel_consumption: v.fuel_consumption ?? '',
      drive_type: v.drive_type ?? '',
      mileage: v.mileage ?? '',
      price: v.price ?? '',
      owner_count: v.owner_count ?? '',
      is_verified: v.is_verified ?? false,
      report_score: v.report_score ?? '',
      score_verdict: v.score_verdict ?? '',
      score_technical: v.score_technical ?? '',
      score_service_history: v.score_service_history ?? '',
      score_accidents: v.score_accidents ?? '',
      score_owners: v.score_owners ?? '',
      score_tech_inspection: v.score_tech_inspection ?? '',
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const payload = {}
      for (const [k, v] of Object.entries(form)) {
        if (v === '' || v === null) continue
        if (typeof v === 'string' && ['mileage', 'price', 'owner_count', 'year', 'fuel_consumption',
          'report_score', 'score_technical', 'score_service_history', 'score_accidents',
          'score_owners', 'score_tech_inspection'].includes(k)) {
          payload[k] = Number(v)
        } else {
          payload[k] = v
        }
      }
      const updated = await api.updateVehicle(vin, payload)
      setVehicle(updated)
      setSaveMsg('შენახულია')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (e) {
      setSaveMsg('შეცდომა: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteHistory(id) {
    if (!confirm('წაიშალოს ეს ჩანაწერი და ყველა ნაწილი/დაზიანება?')) return
    try {
      await api.deleteHistory(id)
      setHistories(hs => hs.filter(h => h.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDeletePart(histId, partId) {
    if (!confirm('წაიშალოს ეს ნაწილი?')) return
    try {
      await api.deletePart(partId)
      setHistories(hs => hs.map(h =>
        h.id === histId ? { ...h, parts: h.parts.filter(p => p.id !== partId) } : h
      ))
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDeleteDamage(histId, dmgId) {
    if (!confirm('წაიშალოს ეს დაზიანების ჩანაწერი?')) return
    try {
      await api.deleteDamage(dmgId)
      setHistories(hs => hs.map(h =>
        h.id === histId ? { ...h, accident_damages: h.accident_damages.filter(d => d.id !== dmgId) } : h
      ))
    } catch (e) {
      alert(e.message)
    }
  }

  function onHistorySaved(record, mode) {
    if (mode === 'add') {
      setHistories(hs => [record, ...hs])
    } else {
      setHistories(hs => hs.map(h => h.id === record.id ? record : h))
    }
    setHistoryModal(null)
  }

  if (loading) return <div className="adm-page"><div className="adm-loading"><div className="spinner" /></div></div>
  if (error) return <div className="adm-page"><div className="adm-alert-error">{error}</div></div>
  if (!vehicle) return null

  const sortedHistories = [...histories].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))

  return (
    <div className="adm-page">
      <button className="adm-back-btn" onClick={() => navigate('/admin/vehicles')}>
        <i className="ti ti-arrow-left" /> ავტომობილები
      </button>

      <div className="adm-page-head">
        <div>
          <h2 className="adm-page-title">{vehicle.make} {vehicle.model} {vehicle.trim}</h2>
          <p className="adm-page-sub adm-mono">{vehicle.vin} · {vehicle.year}</p>
        </div>
        {vehicle.is_verified && <span className="adm-badge green"><i className="ti ti-check" /> დამოწმებული</span>}
      </div>

      {/* Vehicle form */}
      <form onSubmit={handleSave}>
        <div className="adm-section-card">
          <div className="adm-section-title">ძირითადი ინფო</div>
          <div className="adm-form-grid">
            <Field label="მწარმოებელი" value={form.make} onChange={v => set('make', v)} />
            <Field label="მოდელი" value={form.model} onChange={v => set('model', v)} />
            <Field label="წელი" value={form.year} onChange={v => set('year', v)} type="number" />
            <Field label="კომპლექტაცია" value={form.trim} onChange={v => set('trim', v)} />
            <Field label="ფერი" value={form.color} onChange={v => set('color', v)} />
            <Field label="გარბენი (კმ)" value={form.mileage} onChange={v => set('mileage', v)} type="number" />
            <Field label="ფასი" value={form.price} onChange={v => set('price', v)} type="number" />
            <Field label="მფლობელთა რაოდენობა" value={form.owner_count} onChange={v => set('owner_count', v)} type="number" />
          </div>
          <div className="adm-field adm-field-inline">
            <label className="adm-label">დამოწმებული</label>
            <label className="adm-toggle">
              <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)} />
              <span className="adm-toggle-slider" />
            </label>
          </div>
        </div>

        <div className="adm-section-card">
          <div className="adm-section-title">ტექნიკური მახასიათებლები</div>
          <div className="adm-form-grid">
            <Field label="ძრავი" value={form.engine} onChange={v => set('engine', v)} />
            <Field label="გადაცემათა კოლოფი" value={form.transmission} onChange={v => set('transmission', v)} />
            <Field label="საწვავის სახეობა" value={form.fuel_type} onChange={v => set('fuel_type', v)} />
            <Field label="ემისიის სტანდარტი" value={form.emission_standard} onChange={v => set('emission_standard', v)} />
            <Field label="საწვავის მოხმარება (ლ/100კმ)" value={form.fuel_consumption} onChange={v => set('fuel_consumption', v)} type="number" step="0.1" />
            <Field label="წამყვანი ღერძი" value={form.drive_type} onChange={v => set('drive_type', v)} />
          </div>
        </div>

        <div className="adm-section-card">
          <div className="adm-section-title">ქულები</div>
          <div className="adm-form-grid">
            <Field label="საერთო ქულა" value={form.report_score} onChange={v => set('report_score', v)} type="number" step="0.01" />
            <Field label="ვერდიქტი" value={form.score_verdict} onChange={v => set('score_verdict', v)} />
            <Field label="ტექნიკური" value={form.score_technical} onChange={v => set('score_technical', v)} type="number" step="0.01" />
            <Field label="სერვისის ისტორია" value={form.score_service_history} onChange={v => set('score_service_history', v)} type="number" step="0.01" />
            <Field label="ავარიები" value={form.score_accidents} onChange={v => set('score_accidents', v)} type="number" step="0.01" />
            <Field label="მფლობელები" value={form.score_owners} onChange={v => set('score_owners', v)} type="number" step="0.01" />
            <Field label="ტექ. დათვალიერება" value={form.score_tech_inspection} onChange={v => set('score_tech_inspection', v)} type="number" step="0.01" />
          </div>
        </div>

        <div className="adm-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'adm-save-error' : 'adm-save-ok'}>{saveMsg}</span>}
          <button type="submit" className="adm-btn-primary" disabled={saving}>
            {saving ? 'ინახება…' : 'ცვლილებების შენახვა'}
          </button>
        </div>
      </form>

      {/* History records */}
      <div className="adm-section-card">
        <div className="adm-section-head-row">
          <div className="adm-section-title">ისტორიის ჩანაწერები <span className="adm-count-pill">{histories.length}</span></div>
          <button className="adm-btn-primary adm-btn-sm" onClick={() => setHistoryModal({ mode: 'add' })}>
            <i className="ti ti-plus" /> ჩანაწერის დამატება
          </button>
        </div>

        {sortedHistories.length === 0 ? (
          <p className="adm-empty-note">ისტორიის ჩანაწერები არ არის.</p>
        ) : (
          <div className="adm-hist-list">
            {sortedHistories.map(h => (
              <div key={h.id} className="adm-hist-item">
                <div className="adm-hist-row" onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}>
                  <span className={`adm-event-badge ${h.event_type}`}>{labelFor(EVENT_TYPES, h.event_type)}</span>
                  <span className="adm-hist-date">{new Date(h.event_date).toLocaleDateString()}</span>
                  <span className="adm-hist-title">{h.title || <em className="adm-muted">—</em>}</span>
                  <span className="adm-hist-spacer" />
                  <button
                    className="adm-icon-btn sm"
                    title="ჩანაწერის რედაქტირება"
                    onClick={e => { e.stopPropagation(); setHistoryModal({ mode: 'edit', record: h }) }}
                  ><i className="ti ti-pencil" /></button>
                  <button
                    className="adm-icon-btn sm danger"
                    title="ჩანაწერის წაშლა"
                    onClick={e => { e.stopPropagation(); handleDeleteHistory(h.id) }}
                  ><i className="ti ti-trash" /></button>
                  <i className={`ti ti-chevron-${expandedId === h.id ? 'up' : 'down'} adm-chevron`} />
                </div>

                {expandedId === h.id && (
                  <div className="adm-hist-detail">
                    {h.description && <p className="adm-hist-desc">{h.description}</p>}
                    <div className="adm-hist-meta-grid">
                      {h.odometer != null && <MetaItem label="ოდომეტრი" value={`${h.odometer.toLocaleString()} კმ`} />}
                      {h.location && <MetaItem label="ადგილმდებარეობა" value={h.location} />}
                      {h.source && <MetaItem label="წყარო" value={h.source} />}
                      {h.source_reference && <MetaItem label="მითითება" value={h.source_reference} />}
                      {h.tech_inspection_passed != null && (
                        <MetaItem label="ინსპექცია" value={h.tech_inspection_passed ? 'გავლილი' : 'ჩაიჭრა'} />
                      )}
                      {h.damage_severity && <MetaItem label="სიმძიმე" value={labelFor(DAMAGE_SEVERITIES, h.damage_severity)} />}
                    </div>

                    {h.parts?.length > 0 && (
                      <div className="adm-sub-section">
                        <div className="adm-sub-title">ნაწილები</div>
                        <table className="adm-sub-table">
                          <thead><tr><th>ნაწილი</th><th>მოქმედება</th><th>შენიშვნა</th><th></th></tr></thead>
                          <tbody>
                            {h.parts.map(p => (
                              <tr key={p.id}>
                                <td>{p.part_name}</td>
                                <td><span className="adm-event-badge service">{labelFor(PART_ACTIONS, p.action)}</span></td>
                                <td className="adm-muted">{p.note || '—'}</td>
                                <td>
                                  <button className="adm-icon-btn xs danger" onClick={() => handleDeletePart(h.id, p.id)}>
                                    <i className="ti ti-trash" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {h.accident_damages?.length > 0 && (
                      <div className="adm-sub-section">
                        <div className="adm-sub-title">ავარიის დაზიანებები</div>
                        <table className="adm-sub-table">
                          <thead><tr><th>ნაწილი</th><th>სიმძიმე</th><th></th></tr></thead>
                          <tbody>
                            {h.accident_damages.map(d => (
                              <tr key={d.id}>
                                <td>{d.part_name}</td>
                                <td><span className={`adm-event-badge ${d.severity === 'major' || d.severity === 'moderate' ? 'accident' : 'service'}`}>{labelFor(DAMAGE_SEVERITIES, d.severity)}</span></td>
                                <td>
                                  <button className="adm-icon-btn xs danger" onClick={() => handleDeleteDamage(h.id, d.id)}>
                                    <i className="ti ti-trash" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {historyModal && (
        <HistoryModal
          vin={vin}
          mode={historyModal.mode}
          record={historyModal.record}
          onClose={() => setHistoryModal(null)}
          onSaved={onHistorySaved}
        />
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <input
        className="adm-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        step={step}
      />
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="adm-meta-item">
      <span className="adm-meta-label">{label}</span>
      <span className="adm-meta-value">{value}</span>
    </div>
  )
}

function HistoryModal({ vin, mode, record, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(() => isEdit ? {
    event_type: record.event_type,
    event_date: toDatetimeLocal(record.event_date),
    title: record.title ?? '',
    description: record.description ?? '',
    odometer: record.odometer ?? '',
    mileage_confirmed: record.mileage_confirmed ?? false,
    location: record.location ?? '',
    source: record.source ?? '',
    source_reference: record.source_reference ?? '',
    tech_inspection_passed: record.tech_inspection_passed ?? false,
    next_inspection_date: toDatetimeLocal(record.next_inspection_date),
    damage_severity: record.damage_severity ?? '',
  } : {
    event_type: 'service',
    event_date: '',
    title: '',
    description: '',
    odometer: '',
    mileage_confirmed: false,
    location: '',
    source: '',
    source_reference: '',
    tech_inspection_passed: false,
    next_inspection_date: '',
    damage_severity: '',
  })

  const [parts, setParts] = useState([{ part_name: '', action: 'replaced', note: '' }])
  const [damages, setDamages] = useState([{ part_name: '', severity: 'minor' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
        next_inspection_date: form.next_inspection_date ? new Date(form.next_inspection_date).toISOString() : undefined,
        odometer: form.odometer !== '' ? Number(form.odometer) : null,
        damage_severity: form.damage_severity || null,
      }
      if (!isEdit) {
        payload.parts = form.event_type !== 'ownership'
          ? parts.filter(p => p.part_name.trim())
          : []
        payload.accident_damages = form.event_type === 'accident'
          ? damages.filter(d => d.part_name.trim())
          : []
      }
      let saved
      if (isEdit) {
        saved = await api.updateHistory(record.id, payload)
      } else {
        saved = await api.addHistory(vin, payload)
      }
      onSaved(saved, mode)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  function addPart() { setParts(ps => [...ps, { part_name: '', action: 'replaced', note: '' }]) }
  function removePart(i) { setParts(ps => ps.filter((_, idx) => idx !== i)) }
  function setPart(i, k, v) { setParts(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p)) }

  function addDamage() { setDamages(ds => [...ds, { part_name: '', severity: 'minor' }]) }
  function removeDamage(i) { setDamages(ds => ds.filter((_, idx) => idx !== i)) }
  function setDamage(i, k, v) { setDamages(ds => ds.map((d, idx) => idx === i ? { ...d, [k]: v } : d)) }

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal adm-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isEdit ? 'ჩანაწერის რედაქტირება' : 'ჩანაწერის დამატება'}</h3>
          <button className="adm-icon-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body adm-modal-scroll">
            {error && <div className="adm-alert-error">{error}</div>}

            <div className="adm-row-2">
              <div className="adm-field">
                <label className="adm-label">მოვლენის ტიპი *</label>
                <select className="adm-select" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">თარიღი *</label>
                <input className="adm-input" type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} required />
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-label">სათაური</label>
              <input className="adm-input" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">აღწერა</label>
              <textarea className="adm-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
            </div>

            <div className="adm-row-3">
              <div className="adm-field">
                <label className="adm-label">ოდომეტრი (კმ)</label>
                <input className="adm-input" type="number" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
              </div>
              <div className="adm-field">
                <label className="adm-label">ადგილმდებარეობა</label>
                <input className="adm-input" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="adm-field">
                <label className="adm-label">წყარო</label>
                <input className="adm-input" value={form.source} onChange={e => set('source', e.target.value)} />
              </div>
            </div>

            <div className="adm-row-2">
              <div className="adm-field">
                <label className="adm-label">წყაროს მითითება</label>
                <input className="adm-input" value={form.source_reference} onChange={e => set('source_reference', e.target.value)} />
              </div>
              <div className="adm-field adm-field-inline">
                <label className="adm-label">გარბენი დადასტურებული</label>
                <label className="adm-toggle">
                  <input type="checkbox" checked={form.mileage_confirmed} onChange={e => set('mileage_confirmed', e.target.checked)} />
                  <span className="adm-toggle-slider" />
                </label>
              </div>
            </div>

            {form.event_type === 'tech_inspection' && (
              <div className="adm-row-2">
                <div className="adm-field adm-field-inline">
                  <label className="adm-label">გავლილი</label>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={form.tech_inspection_passed} onChange={e => set('tech_inspection_passed', e.target.checked)} />
                    <span className="adm-toggle-slider" />
                  </label>
                </div>
                <div className="adm-field">
                  <label className="adm-label">შემდეგი ინსპექციის თარიღი</label>
                  <input className="adm-input" type="datetime-local" value={form.next_inspection_date} onChange={e => set('next_inspection_date', e.target.value)} />
                </div>
              </div>
            )}

            {form.event_type === 'accident' && (
              <div className="adm-field">
                <label className="adm-label">ზოგადი დაზიანების სიმძიმე</label>
                <select className="adm-select" value={form.damage_severity} onChange={e => set('damage_severity', e.target.value)}>
                  <option value="">— აირჩიეთ —</option>
                  {SEVERITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            {!isEdit && form.event_type !== 'ownership' && (
              <div className="adm-sub-section">
                <div className="adm-sub-section-head">
                  <div className="adm-sub-title">ნაწილები</div>
                  <button type="button" className="adm-btn-ghost adm-btn-sm" onClick={addPart}>
                    <i className="ti ti-plus" /> ნაწილის დამატება
                  </button>
                </div>
                {parts.map((p, i) => (
                  <div key={i} className="adm-inline-row">
                    <input className="adm-input" placeholder="ნაწილის სახელი" value={p.part_name} onChange={e => setPart(i, 'part_name', e.target.value)} />
                    <select className="adm-select" value={p.action} onChange={e => setPart(i, 'action', e.target.value)}>
                      {PART_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <input className="adm-input" placeholder="შენიშვნა (სურვილისამებრ)" value={p.note} onChange={e => setPart(i, 'note', e.target.value)} />
                    <button type="button" className="adm-icon-btn danger" onClick={() => removePart(i)}>
                      <i className="ti ti-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isEdit && form.event_type === 'accident' && (
              <div className="adm-sub-section">
                <div className="adm-sub-section-head">
                  <div className="adm-sub-title">ავარიის დაზიანებები</div>
                  <button type="button" className="adm-btn-ghost adm-btn-sm" onClick={addDamage}>
                    <i className="ti ti-plus" /> დაზიანების დამატება
                  </button>
                </div>
                {damages.map((d, i) => (
                  <div key={i} className="adm-inline-row">
                    <input className="adm-input" placeholder="ნაწილის სახელი" value={d.part_name} onChange={e => setDamage(i, 'part_name', e.target.value)} />
                    <select className="adm-select" value={d.severity} onChange={e => setDamage(i, 'severity', e.target.value)}>
                      {DAMAGE_SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button type="button" className="adm-icon-btn danger" onClick={() => removeDamage(i)}>
                      <i className="ti ti-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="adm-modal-actions">
            <button type="button" className="adm-btn-ghost" onClick={onClose}>გაუქმება</button>
            <button type="submit" className="adm-btn-primary" disabled={loading}>
              {loading ? 'ინახება…' : isEdit ? 'ცვლილებების შენახვა' : 'ჩანაწერის დამატება'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
