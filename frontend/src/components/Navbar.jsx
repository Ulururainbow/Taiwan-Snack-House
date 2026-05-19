import { Link, useNavigate } from 'react-router-dom'

export default function Navbar({ user, setUser, totalItems, onSearch, searchTerm }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    navigate('/')
  }

  const handleSearch = (e) => {
    onSearch(e.target.value)
  }

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '2px solid var(--primary)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Taiwan Snack House
      </Link>

      <div style={{ position: 'relative', width: '100%', maxWidth: '260px', minWidth: '80px', flexShrink: 1 }}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--primary)" strokeWidth="2.2"
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          type="text"
          autoComplete="off"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            padding: '6px 14px 6px 32px',
            borderRadius: '20px',
            border: '1.5px solid var(--primary)',
            fontSize: '0.9rem',
            width: '100%',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
        {user ? (
          <>
            <Link to="/orders" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Order Tracking</Link>
            {user.is_admin === 1 && (
              <Link to="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Admin</Link>
            )}
            <span style={{ fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap' }}>Hi, {user.name || 'Member'}</span>
            <button onClick={handleLogout} style={{ background: 'none', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" state={{ mode: 'login' }} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Login</Link>
            <Link to="/login" state={{ mode: 'register' }} style={{ background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px', borderRadius: '6px' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}