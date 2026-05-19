import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.95rem',
  color: '#333',
}

export default function Login({ setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(location.state?.mode || 'login')
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState('')
  const [passwordValid, setPasswordValid] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMsg, setForgotMsg] = useState(false)

  useEffect(() => {
    if (location.state?.mode) setMode(location.state.mode)
  }, [location.state])

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      setForm({ ...form, phone: digits })
      return
    }
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === 'password') setPasswordValid(PASSWORD_REGEX.test(e.target.value))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    if (mode === 'register' && !PASSWORD_REGEX.test(form.password)) { setError('Password does not meet requirements'); return }
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    try {
      const res = await fetch(`http://localhost:3001${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        navigate(data.user.is_admin === 1 ? '/admin' : '/orders')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch { setError('Connection failed') }
  }

  if (mode === 'register') {
    return (
      <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 20px' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '1.8rem', fontWeight: 700 }}>Create Account</h2>
        <p style={{ color: '#888', marginBottom: '28px', fontSize: '0.9rem' }}>Join us to track your orders.</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Name</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
          <input name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="04XX XXX XXX" style={inputStyle} />
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Australian mobile number, 10 digits starting with 04</p>
        </div>

        <div style={{ marginBottom: '6px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••"
              style={{ ...inputStyle, border: `1px solid ${passwordValid === false ? '#e74c3c' : passwordValid === true ? '#27ae60' : '#ddd'}`, paddingRight: '44px' }} />
            <button onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#aaa', fontSize: '0.85rem', cursor: 'pointer' }}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', marginBottom: '20px', color: passwordValid === true ? '#27ae60' : passwordValid === false ? '#e74c3c' : '#888' }}>
          At least 8 characters, including letters and numbers
        </p>

        {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

        <button onClick={handleSubmit}
          style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', marginBottom: '16px' }}>
          Create Account
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
          Already have an account?{' '}
          <button onClick={() => { setMode('login'); setError(''); setPasswordValid(null) }}
            style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer' }}>
            Sign In
          </button>
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '36px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '6px', fontSize: '1.8rem', fontWeight: 700 }}>Login</h2>
          <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>Sign in to view your orders.</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
            <input name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '6px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '44px' }} />
              <button onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#aaa', fontSize: '0.85rem', cursor: 'pointer' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', marginBottom: '12px', color: '#888' }}>
            At least 8 characters, including letters and numbers
          </p>

          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button onClick={() => setForgotMsg(!forgotMsg)}
              style={{ background: 'none', color: '#888', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Forgot password?
            </button>
            {forgotMsg && (
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px', textAlign: 'left' }}>
                Please contact support at support@taiwansnackhouse.com
              </p>
            )}
          </div>

          {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

          <button onClick={handleSubmit}
            style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', marginBottom: '16px' }}>
            Sign In
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            Don't have an account?{' '}
            <button onClick={() => { setMode('register'); setError(''); setPasswordValid(null) }}
              style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Register
            </button>
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Not a member yet?</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>Join us and enjoy exclusive member benefits:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              '🎁 Welcome gift credit upon joining',
              '🎂 Birthday shopping bonus every year',
              '💰 Member-exclusive discounts',
              '📦 Priority order tracking',
              '🎉 Surprise offers and seasonal deals',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: '#444', marginBottom: '10px' }}>{item}</li>
            ))}
          </ul>
          <button onClick={() => { setMode('register'); window.scrollTo(0, 0) }}
            style={{ width: '100%', marginTop: '8px', background: 'none', border: '2px solid var(--primary)', color: 'var(--primary)', padding: '11px', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
            Create an Account
          </button>
        </div>
      </div>
    </div>
  )
}