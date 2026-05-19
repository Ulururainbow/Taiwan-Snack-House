import { useNavigate } from 'react-router-dom'

export default function CartDrawer({ cart, updateQuantity, removeFromCart, subtotal, discount, shipping, total, totalItems, isMobile }) {
  const navigate = useNavigate()

  return (
    <aside style={{
      width: isMobile ? '100%' : 'var(--cart-width)',
      minWidth: isMobile ? 'unset' : 'var(--cart-width)',
      borderLeft: isMobile ? 'none' : '1px solid var(--border)',
      padding: '20px 15px',
      position: isMobile ? 'relative' : 'sticky',
      top: isMobile ? 'unset' : '56px',
      height: isMobile ? 'auto' : 'calc(100vh - 56px)',
      overflowY: 'auto',
      background: '#f9f9f9',
    }}>
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>Shopping Cart</h2>
        </div>
      )}

      {cart.length === 0 ? (
        <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>Your cart is empty</p>
      ) : (
        <>
          <div style={{ paddingBottom: '12px' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #eee', alignItems: 'flex-start' }}>
                {item.image_path && <img src={`/${item.image_path}`} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>A${Number(item.price).toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', background: '#ddd', borderRadius: '4px', fontWeight: 700 }}>−</button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', background: '#ddd', borderRadius: '4px', fontWeight: 700 }}>+</button>
                    <span style={{ fontSize: '0.9rem', marginLeft: '4px' }}>A${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: 'auto', color: '#aaa', background: 'none', fontSize: '0.85rem' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
              <span>Subtotal</span>
              <span>A${Number(subtotal).toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#27ae60' }}>
                <span>10% discount</span>
                <span>-A${Number(discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
              <span style={{ color: shipping === 0 ? '#27ae60' : '#333' }}>Shipping</span>
              <span style={{ color: shipping === 0 ? '#27ae60' : '#333' }}>
                {shipping === 0 ? 'FREE' : `A$${Number(shipping).toFixed(2)}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', paddingTop: '10px', borderTop: '1px solid #eee', marginBottom: '16px' }}>
              <span>Total</span>
              <span>A${Number(total).toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/shipping')}
              style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '1rem' }}
              onMouseOver={e => e.target.style.background = 'var(--primary-dark)'}
              onMouseOut={e => e.target.style.background = 'var(--primary)'}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </aside>
  )
}