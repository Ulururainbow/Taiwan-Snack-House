import { useEffect, useState } from 'react'
import CartDrawer from '../components/CartDrawer'

export default function Home({ cart, addToCart, updateQuantity, removeFromCart, subtotal, discount, shipping, total, totalItems, searchTerm }) {
  const [products, setProducts] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => console.error('Failed to load products'))
  }, [])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', background: '#fff' }}>
      <main style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '2px solid var(--border)' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 700 }}>Taiwan Snack House</h1>
          <p style={{ color: '#666', marginTop: '4px', fontSize: '0.9rem' }}>Authentic Taiwanese snacks & gifts</p>
          <div style={{
            marginTop: '12px',
            background: 'linear-gradient(135deg, #fff5f3, #ffe4cc)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '0.9rem',
            color: 'var(--primary)',
            fontWeight: 500,
          }}>
            <strong>Buy 2+ items → 10% OFF</strong> | Spend A$100+ → <strong>FREE SHIPPING</strong>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <img
                src={product.image_path ? `/${product.image_path}` : '/images/placeholder.png'}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', background: '#f0f0f0' }}
              />
              <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>{product.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '6px', flex: 1, lineHeight: 1.4 }}>{product.description}</p>
                <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>A${Number(product.price).toFixed(2)}</p>
                <button
                  onClick={() => addToCart(product)}
                  style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s' }}
                  onMouseOver={e => e.target.style.background = 'var(--primary-dark)'}
                  onMouseOut={e => e.target.style.background = 'var(--primary)'}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Desktop Cart */}
      <div className="cart-desktop">
        <CartDrawer cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} subtotal={subtotal} discount={discount} shipping={shipping} total={total} totalItems={totalItems} />
      </div>

      {/* Mobile Float Button */}
      <button className="cart-float-btn" onClick={() => setCartOpen(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {totalItems > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#fff', color: 'var(--primary)', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalItems}
          </span>
        )}
      </button>

      {/* Mobile Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '16px 16px 0 0', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>Shopping Cart</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', fontSize: '1.4rem', color: '#999' }}>✕</button>
            </div>
            <CartDrawer cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} subtotal={subtotal} discount={discount} shipping={shipping} total={total} totalItems={totalItems} isMobile />
          </div>
        </div>
      )}
    </div>
  )
}