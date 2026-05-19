import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#333',
}

const hintStyle = {
  fontSize: '0.75rem',
  color: '#888',
  marginTop: '4px',
}

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  marginBottom: '4px',
  fontWeight: 600,
}

const steps = ['Shipping Info', 'Payment', 'Order Review']

export default function Checkout({ cart, shippingData, user, subtotal, discount, shipping, total, clearCart }) {
  const navigate = useNavigate()
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!shippingData || cart.length === 0) { navigate('/'); return null }

  const handleCardNumber = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
    setCard({ ...card, number: formatted })
  }

  const handleExpiry = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length <= 2) {
      const mm = parseInt(raw || '0')
      if (raw.length === 2 && (mm < 1 || mm > 12)) return
      setCard({ ...card, expiry: raw })
    } else {
      const mm = parseInt(raw.slice(0, 2))
      const yy = parseInt(raw.slice(2, 4))
      if (mm < 1 || mm > 12) return
      if (raw.length === 4 && (yy < 26 || yy > 36)) return
      const formatted = raw.slice(0, 2) + '/' + raw.slice(2)
      setCard({ ...card, expiry: formatted })
    }
  }

  const handleCvv = (e) => {
    setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
  }

  const handlePay = async () => {
    const rawNumber = card.number.replace(/\s/g, '')
    if (rawNumber.length !== 16) { setError('Card number must be 16 digits'); return }
    const parts = card.expiry.split('/')
    const mm = parseInt(parts[0])
    const yy = parseInt(parts[1])
    if (!parts[1] || mm < 1 || mm > 12 || yy < 26 || yy > 36) {
      setError('Please enter a valid expiry date (MM/YY)'); return
    }
    if (card.cvv.length !== 3) { setError('CVV must be 3 digits'); return }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          guest_name: shippingData.name,
          guest_email: shippingData.email,
          address: shippingData.address,
          phone: shippingData.phone,
          items: cart,
          subtotal, discount, shipping, total
        })
      })
      const data = await res.json()
      if (data.order_id) {
        clearCart()
        navigate('/orders', { state: { orderId: data.order_id } })
      }
    } catch { setError('Payment failed, please try again') }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0 32px' }}>
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i <= 1 ? 'var(--primary)' : '#ddd',
                color: i <= 1 ? '#fff' : '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700,
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.75rem', color: i <= 1 ? 'var(--primary)' : '#aaa', fontWeight: i === 1 ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: '80px', height: '2px', background: i < 1 ? 'var(--primary)' : '#ddd', margin: '0 8px', marginBottom: '20px' }} />
            )}
          </div>
        ))}
      </div>

      <div className="checkout-layout">

        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>Payment</h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Card Number</label>
            <input value={card.number} onChange={handleCardNumber} placeholder="1234 5678 9012 3456" style={inputStyle} />
            <p style={hintStyle}>Numbers only, 16 digits</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Expiry</label>
            <input value={card.expiry} onChange={handleExpiry} placeholder="MM/YY" style={inputStyle} />
            <p style={hintStyle}>Month 01-12, year 26-36</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>CVV</label>
            <input value={card.cvv} onChange={handleCvv} placeholder="123" style={inputStyle} />
            <p style={hintStyle}>3 digits on the back of your card</p>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="rememberCard" />
            <label htmlFor="rememberCard" style={{ fontSize: '0.85rem', color: '#666', cursor: 'pointer' }}>
              Remember my payment details for next time
            </label>
          </div>

          {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

          <button onClick={handlePay} disabled={loading}
            style={{ width: '100%', background: loading ? '#ccc' : 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem' }}>
            {loading ? 'Processing...' : 'Complete Payment'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={() => navigate('/shipping')}
              style={{ background: 'none', color: '#888', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Back to Shipping
            </button>
          </div>
        </div>

        <div>
          <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>Order Summary</h3>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>{item.name} x{item.quantity}</span>
                <span>A${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #ddd', marginTop: '10px', paddingTop: '10px' }}>
              <div style={summaryRowStyle}>
                <span>Subtotal</span>
                <span>A${Number(subtotal).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ ...summaryRowStyle, color: '#27ae60' }}>
                  <span>10% discount</span>
                  <span>-A${Number(discount).toFixed(2)}</span>
                </div>
              )}
              <div style={summaryRowStyle}>
                <span style={{ color: shipping === 0 ? '#27ae60' : '#333' }}>Shipping</span>
                <span style={{ color: shipping === 0 ? '#27ae60' : '#333' }}>
                  {shipping === 0 ? 'FREE' : `A$${Number(shipping).toFixed(2)}`}
                </span>
              </div>
              <div style={{ ...summaryRowStyle, fontSize: '1rem', marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                <span>Total</span>
                <span>A${Number(total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>Ship to</h3>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '4px' }}>{shippingData.name}</p>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '4px' }}>{shippingData.address}</p>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>{shippingData.phone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}