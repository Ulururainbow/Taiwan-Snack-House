import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#333',
}

const sectionLabelStyle = {
  fontSize: '0.8rem',
  color: '#888',
  fontWeight: 600,
  marginBottom: '16px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
}

const steps = ['Shipping Info', 'Payment', 'Order Review']

export default function ShippingInfo({ cart, setShippingData, user, setUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [registerMode, setRegisterMode] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValid, setPasswordValid] = useState(null)
  const [error, setError] = useState('')

  if (cart.length === 0) { navigate('/'); return null }

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      setForm({ ...form, phone: digits }); return
    }
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegChange = (e) => {
    if (e.target.name === 'phone') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      setRegForm({ ...regForm, phone: digits }); return
    }
    setRegForm({ ...regForm, [e.target.name]: e.target.value })
    if (e.target.name === 'password') setPasswordValid(PASSWORD_REGEX.test(e.target.value))
  }

  const fillFromRecipient = () => {
    setRegForm({ ...regForm, name: form.name, phone: form.phone, email: form.email })
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone) { setError('Please fill in all required fields'); return }
    if (form.phone.length !== 10) { setError('Please enter a valid 10-digit Australian phone number'); return }

    if (registerMode) {
      if (!regForm.email || !regForm.password) { setError('Please fill in all account fields'); return }
      if (!PASSWORD_REGEX.test(regForm.password)) { setError('Password must be at least 8 characters with letters and numbers'); return }
      try {
        const res = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regForm.email, password: regForm.password, name: regForm.name || form.name })
        })
        const data = await res.json()
        if (data.token) {
          setUser(data.user)
          localStorage.setItem('token', data.token)
        } else {
          setError(data.error || 'Registration failed'); return
        }
      } catch { setError('Registration failed'); return }
    }

    setShippingData(form)
    navigate('/checkout')
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px 60px', background: '#fff', minHeight: 'calc(100vh - 56px)' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0 32px' }}>
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i === 0 ? 'var(--primary)' : '#ddd',
                color: i === 0 ? '#fff' : '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700,
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.75rem', color: i === 0 ? 'var(--primary)' : '#aaa', fontWeight: i === 0 ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: '80px', height: '2px', background: '#ddd', margin: '0 8px', marginBottom: '20px' }} />
            )}
          </div>
        ))}
      </div>

      <h2 style={{ color: 'var(--primary)', marginBottom: '24px' }}>Shipping Information</h2>

      {/* Recipient section */}
      <p style={sectionLabelStyle}>Recipient Information</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Full Name *</label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Address *</label>
        <input name="address" value={form.address} onChange={handleChange} placeholder="Street, suburb, state, postcode" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Phone *</label>
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="04XX XXX XXX" style={inputStyle} />
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Australian mobile number, 10 digits starting with 04</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email address" style={inputStyle} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #bbb', marginBottom: '24px' }} />

      {/* Account section */}
      {!user && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
            <input type="checkbox" checked={registerMode} onChange={e => setRegisterMode(e.target.checked)} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Create an account (optional)</span>
          </label>

          {registerMode && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={sectionLabelStyle}>Account Information</p>
                <button onClick={fillFromRecipient}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Same as recipient
                </button>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Name</label>
                <input name="name" value={regForm.name} onChange={handleRegChange} placeholder="Your name" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Email *</label>
                <input name="email" value={regForm.email} onChange={handleRegChange} placeholder="you@email.com" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Phone</label>
                <input name="phone" value={regForm.phone} onChange={handleRegChange} placeholder="04XX XXX XXX" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={regForm.password} onChange={handleRegChange}
                    placeholder="••••••••"
                    style={{ ...inputStyle, border: `1px solid ${passwordValid === false ? '#e74c3c' : passwordValid === true ? '#27ae60' : '#ddd'}`, paddingRight: '44px' }} />
                  <button onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#aaa', fontSize: '0.85rem', cursor: 'pointer' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: passwordValid === true ? '#27ae60' : passwordValid === false ? '#e74c3c' : '#888', marginTop: '4px' }}>
                  At least 8 characters, including letters and numbers
                </p>
              </div>
            </>
          )}

        </>
      )}

      {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

      <button onClick={handleSubmit}
        style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', marginBottom: '16px' }}>
        Continue to Payment
      </button>

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', color: '#888', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
          Back to Cart
        </button>
      </div>
    </div>
  )
}