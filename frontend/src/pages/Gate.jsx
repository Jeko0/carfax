import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import { fetchPricingPlans } from '../api/vehicles'

export default function Gate() {
  const { vin } = useParams()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    fetchPricingPlans().then(data => {
      setPlans(data)
      setSelectedId(data[0]?.id ?? null)
    }).catch(() => {})
  }, [])

  return (
    <>
      <Nav />
      <div className="gate-wrap">
        <button className="back-link" onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left" /> უკან
        </button>
        <div className="gate-card">
          <div className="gate-header">
            <h3>ანგარიში მზადაა შესაქმნელად</h3>
            <p>ამ VIN კოდზე ნაპოვნია ჩანაწერები</p>
            <div className="vin-preview">{vin}</div>
          </div>
          <div className="gate-body">
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem' }}>
              აირჩიე პაკეტი სრული ანგარიშის სანახავად:
            </p>
            <div className="plan-options">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`plan${selectedId === plan.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(plan.id)}
                >
                  {plan.popular && <div className="plan-badge">Popular</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">{plan.price}</div>
                  <div className="plan-feat">{plan.features}</div>
                </div>
              ))}
            </div>
            <button className="pay-btn" onClick={() => navigate(`/report/${vin}`)}>
              <i className="ti ti-lock-open" /> გადახდა და ანგარიშის ნახვა
            </button>
            <div className="pay-note">
              <i className="ti ti-shield-check" /> დაცული გადახდა · TBC Pay · BOG Pay · Visa / MC
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
