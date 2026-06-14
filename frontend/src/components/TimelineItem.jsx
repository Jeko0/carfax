export default function TimelineItem({ record }) {
  const { event_type, event_date, title, description, odometer,
          source, source_reference, tech_inspection_passed,
          damage_severity, parts, accident_damages } = record

  const date = new Date(event_date).toLocaleDateString('ka-GE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  let dotClass = 'dot-green'
  let badgeClass = 'badge-svc'
  let badgeText = 'სერვისი'
  let icon = 'ti-tool'

  if (event_type === 'accident') {
    dotClass = 'dot-red'; badgeClass = 'badge-acc'; badgeText = 'ავარია'; icon = 'ti-alert-triangle'
  } else if (event_type === 'tech_inspection') {
    dotClass = tech_inspection_passed ? 'dot-green' : 'dot-orange'
    badgeClass = tech_inspection_passed ? 'badge-tech-pass' : 'badge-tech-fail'
    badgeText = tech_inspection_passed ? 'ტექ-ინსპექტირება გავლილი ✓' : 'ტექ-ინსპექტირება ჩავარდა ✗'
    icon = tech_inspection_passed ? 'ti-clipboard-check' : 'ti-clipboard-x'
  }

  const severitySegs = () => {
    const map = { minor: 1, low: 1, moderate: 2, major: 3, critical: 4 }
    const lvl = map[damage_severity] || 1
    return Array.from({ length: 4 }, (_, i) => {
      if (i >= lvl) return 'seg-empty'
      if (i === 0) return 'seg-low'
      if (i === 1) return 'seg-mid'
      return 'seg-high'
    })
  }

  return (
    <div className="tl-item">
      <div className={`tl-dot ${dotClass}`}>
        <i className={`ti ${icon}`} />
      </div>
      <div className="tl-card">
        <div className="tl-card-top">
          <span className={`tl-type-badge ${badgeClass}`}>{badgeText}</span>
          <div className="tl-meta-row">
            <span><i className="ti ti-calendar" /> {date}</span>
            {odometer && <span><i className="ti ti-road" /> {odometer.toLocaleString()} კმ</span>}
          </div>
        </div>
        <div className="tl-card-body">
          {title && <div className="tl-title">{title}</div>}
          {source && (
            <div className="tl-source">
              <i className="ti ti-building" />
              {source}{source_reference ? ` · ${source_reference}` : ''}
            </div>
          )}
          {description && <div className="tl-desc">{description}</div>}

          {event_type === 'accident' && (
            <>
              {accident_damages.length > 0 && (
                <div className="damage-block">
                  <div className="damage-title">დაზიანების ანალიზი</div>
                  <div className="damage-parts">
                    {accident_damages.map((d, i) => {
                      const cls = d.severity === 'none' ? 'dp-green' : d.severity === 'cosmetic' || d.severity === 'minor' ? 'dp-orange' : 'dp-red'
                      const label = { none: 'უვნებელია', cosmetic: 'კოსმეტიკური', minor: 'მცირე', moderate: 'საშუალო', major: 'მნიშვნელოვანი' }[d.severity] || d.severity
                      return (
                        <div key={i} className="damage-part">
                          <div className="dp-label">{d.part_name}</div>
                          <div className={`dp-val ${cls}`}>{label}</div>
                        </div>
                      )
                    })}
                  </div>
                  {damage_severity && (
                    <div className="damage-scale-wrap">
                      <div className="scale-label">საერთო დაზიანების სიმძიმე</div>
                      <div className="scale-track">
                        <div className="scale-segments">
                          {severitySegs().map((s, i) => <div key={i} className={`seg ${s}`} />)}
                        </div>
                      </div>
                      <div className="scale-marks">
                        <span>მცირე</span><span>საშუალო</span><span>მნიშვნელოვანი</span><span>კრიტიკული</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {parts.length > 0 && (
            <div className="parts-changed">
              <div className="parts-label">შეცვლილი / შემოწმებული კომპონენტები:</div>
              <div className="parts-chips">
                {parts.map((p, i) => (
                  <span key={i} className={`part-chip${p.action === 'replaced' ? ' replaced' : ''}`}>
                    {p.part_name}{p.action === 'checked' ? ' ✓' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {odometer && (
            <div className="mileage-note">
              <i className="ti ti-gauge" /> {odometer.toLocaleString()} კმ დროს
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
