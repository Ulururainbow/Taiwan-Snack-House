import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_COLOR = { pending: '#f59e0b', shipped: '#3b82f6', delivered: '#22c55e', cancelled: '#aaa' }

const btnStyle = (color = 'var(--primary)') => ({
  background: color, color: '#fff', border: 'none',
  padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem',
  cursor: 'pointer', fontWeight: 600,
})

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #ddd',
  borderRadius: '6px', fontSize: '0.875rem', marginBottom: '8px', boxSizing: 'border-box',
}

const row = { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }

// Format order serial: Order_001 based on sorted position
const orderSerial = (index) => 'Order_' + String(index + 1).padStart(3, '0')

export default function AdminDashboard({ user }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('carts')

  const [allUsers, setAllUsers] = useState([])        // all non-admin users (for Members tab)
  const [cartUsers, setCartUsers] = useState([])      // users with active cart (for Shopping Carts tab)
  const [guests, setGuests] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)

  const [editingUser, setEditingUser] = useState(null)
  const [editName, setEditName] = useState('')

  const [products, setProducts] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '' })
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newImagePreview, setNewImagePreview] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const newFileRef = useRef(null)
  const editFileRef = useRef(null)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!user || user.is_admin !== 1) { navigate('/'); return }
    Promise.all([
      fetch('http://localhost:3001/api/admin/users', { headers: authHeader }).then(r => r.json()),
      fetch('http://localhost:3001/api/admin/users/with-cart', { headers: authHeader }).then(r => r.json()),
      fetch('http://localhost:3001/api/admin/guests', { headers: authHeader }).then(r => r.json()),
      fetch('http://localhost:3001/api/products').then(r => r.json()),
      fetch('http://localhost:3001/api/admin/orders', { headers: authHeader }).then(r => r.json()),
    ]).then(([usersData, cartUsersData, guestsData, productsData, ordersData]) => {
      setAllUsers(Array.isArray(usersData) ? usersData.filter(u => u.is_admin !== 1) : [])
      setCartUsers(Array.isArray(cartUsersData) ? cartUsersData : [])
      setGuests(Array.isArray(guestsData) ? guestsData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const fetchCart = async (id) => {
    setCartLoading(true); setCartItems([])
    const res = await fetch(`http://localhost:3001/api/admin/users/${id}/cart`, { headers: authHeader })
    const data = await res.json()
    setCartItems(Array.isArray(data) ? data : [])
    setCartLoading(false)
  }

  const handleSelectCart = (id, type) => { setSelectedId(id); setSelectedType(type); fetchCart(id) }

  const cartSubtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const cartQty = cartItems.reduce((s, i) => s + i.quantity, 0)
  const cartDiscount = cartQty >= 2 ? cartSubtotal * 0.1 : 0
  const cartAfter = cartSubtotal - cartDiscount
  const cartShipping = cartAfter >= 100 ? 0 : 9.90
  const cartTotal = cartAfter + cartShipping

  const getSelectedName = () => {
    if (!selectedId) return ''
    if (selectedType === 'guest') return selectedId
    const u = cartUsers.find(u => u.id === selectedId)
    return u ? (u.name || u.email) : selectedId
  }

  // ── Members CRUD ──
  const handleEditUser = (u) => { setEditingUser(u.id); setEditName(u.name || '') }
  const handleSaveUser = async (id) => {
    await fetch(`http://localhost:3001/api/admin/users/${id}`, {
      method: 'PUT', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    })
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, name: editName } : u))
    setEditingUser(null)
  }
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? Their cart will also be removed.')) return
    await fetch(`http://localhost:3001/api/admin/users/${id}`, { method: 'DELETE', headers: authHeader })
    setAllUsers(prev => prev.filter(u => u.id !== id))
    setCartUsers(prev => prev.filter(u => u.id !== id))
  }

  // ── Image upload helper ──
  const uploadImage = async (file) => {
    const form = new FormData()
    form.append('image', file)
    const res = await fetch('http://localhost:3001/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json()
    return data.image_path || null
  }

  // ── Products CRUD ──
  const handleEditProduct = (p) => {
    setEditingProduct({ ...p })
    setEditImagePreview(p.image_path ? `/${p.image_path}` : null)
  }

  const handleSaveProduct = async () => {
    let image_path = editingProduct.image_path || null
    if (editFileRef.current?.files[0]) {
      image_path = await uploadImage(editFileRef.current.files[0])
    }
    await fetch(`http://localhost:3001/api/admin/products/${editingProduct.id}`, {
      method: 'PUT', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingProduct.name, description: editingProduct.description, price: editingProduct.price, image_url: image_path })
    })
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...editingProduct, image_path } : p))
    setEditingProduct(null)
    setEditImagePreview(null)
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await fetch(`http://localhost:3001/api/admin/products/${id}`, { method: 'DELETE', headers: authHeader })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert('Name and price are required')
    let image_url = null
    if (newFileRef.current?.files[0]) {
      image_url = await uploadImage(newFileRef.current.files[0])
    }
    const res = await fetch('http://localhost:3001/api/admin/products', {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProduct, image_url })
    })
    const created = await res.json()
    setProducts(prev => [...prev, created])
    setNewProduct({ name: '', description: '', price: '' })
    setNewImagePreview(null)
    if (newFileRef.current) newFileRef.current.value = ''
    setShowNewProduct(false)
  }

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Permanently delete this order record?')) return
    await fetch(`http://localhost:3001/api/admin/orders/${id}`, { method: 'DELETE', headers: authHeader })
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const card = { border: '1px solid #eee', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', background: '#fff' }
  const memberOrders = orders.filter(o => o.user_id != null)
  const guestOrders = orders.filter(o => o.user_id == null)
  const userLabel = (n) => n === 1 ? '1 User' : `${n} Users`

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '2px solid #eee' }}>
        {[
          { key: 'carts', label: `Shopping Carts${(guests.length + cartUsers.length) > 0 ? ` (${guests.length + cartUsers.length})` : ''}` },
          { key: 'members', label: `Members${allUsers.length > 0 ? ` (${allUsers.length})` : ''}` },
          { key: 'products', label: `Products${products.length > 0 ? ` (${products.length})` : ''}` },
          { key: 'orders', label: `Orders${orders.length > 0 ? ` (${orders.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '8px 16px',
            fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? 'var(--primary)' : '#888',
            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer', fontSize: '0.9rem', marginBottom: '-2px',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Shopping Carts ── */}
      {tab === 'carts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', marginBottom: '10px' }}>
              GUEST ({userLabel(guests.length)})
            </h2>
            {guests.length === 0 && <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No active guest carts.</p>}
            {guests.map(g => (
              <div key={g.guest_id} onClick={() => handleSelectCart(g.guest_id, 'guest')} style={{
                ...card, cursor: 'pointer',
                border: `2px solid ${selectedId === g.guest_id ? 'var(--primary)' : '#eee'}`,
                background: selectedId === g.guest_id ? '#fff5f4' : '#fff',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.guest_id}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{g.item_count} item(s) — A${Number(g.total).toFixed(2)}</div>
              </div>
            ))}

            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', margin: '20px 0 10px' }}>
              MEMBER ({userLabel(cartUsers.length)})
            </h2>
            {cartUsers.length === 0 && <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No members with active carts.</p>}
            {cartUsers.map(u => (
              <div key={u.id} onClick={() => handleSelectCart(u.id, 'user')} style={{
                ...card, cursor: 'pointer',
                border: `2px solid ${selectedId === u.id ? 'var(--primary)' : '#eee'}`,
                background: selectedId === u.id ? '#fff5f4' : '#fff',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name || '(no name)'}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.email}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '20px', minHeight: '200px' }}>
            {!selectedId ? (
              <p style={{ color: '#bbb', textAlign: 'center', marginTop: '40px' }}>Select a user to view their cart</p>
            ) : cartLoading ? (
              <p style={{ color: '#aaa' }}>Loading cart...</p>
            ) : (
              <>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: '#555' }}>{getSelectedName()}'s Cart</h2>
                {cartItems.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Cart is empty.</p>
                ) : (
                  <>
                    {cartItems.map(item => (
                      <div key={item.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>Qty: {item.quantity} × A${Number(item.price).toFixed(2)}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>A${(Number(item.price) * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <div style={{ ...row }}><span>Subtotal</span><span>A${cartSubtotal.toFixed(2)}</span></div>
                      {cartDiscount > 0 && <div style={{ ...row, color: '#27ae60' }}><span>10% discount</span><span>-A${cartDiscount.toFixed(2)}</span></div>}
                      <div style={{ ...row, color: cartShipping === 0 ? '#27ae60' : 'inherit' }}><span>Shipping</span><span>{cartShipping === 0 ? 'FREE' : `A$${cartShipping.toFixed(2)}`}</span></div>
                      <div style={{ ...row, borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '4px', fontWeight: 700, color: 'var(--primary)' }}><span>Cart Total</span><span>A${cartTotal.toFixed(2)}</span></div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '16px' }}>Edit member names or remove accounts.</p>
          {allUsers.length === 0 && <p style={{ color: '#aaa' }}>No registered members yet.</p>}
          {allUsers.map(u => (
            <div key={u.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingUser === u.id ? (
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, width: '220px', flex: 1, marginRight: '12px' }} placeholder="Name" />
              ) : (
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name || '(no name)'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{u.email}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingUser === u.id ? (
                  <>
                    <button style={btnStyle()} onClick={() => handleSaveUser(u.id)}>Save</button>
                    <button style={btnStyle('#aaa')} onClick={() => setEditingUser(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button style={btnStyle('#6b7280')} onClick={() => handleEditUser(u)}>Edit</button>
                    <button style={btnStyle('#ef4444')} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Products ── */}
      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333', marginBottom: '4px' }}>{products.length} Product{products.length !== 1 ? 's' : ''} in Catalogue</p>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Manage the product catalogue.</p>
            </div>
            <button style={btnStyle()} onClick={() => { setShowNewProduct(v => !v); setEditingProduct(null) }}>
              {showNewProduct ? 'Cancel' : '+ Add Product'}
            </button>
          </div>

          {showNewProduct && (
            <div style={{ ...card, background: '#fff5f4', marginBottom: '16px' }}>
              <p style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>New Product</p>
              <input style={inputStyle} placeholder="Name *" value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              <input style={inputStyle} placeholder="Description" value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              <input style={inputStyle} placeholder="Price (e.g. 18.00) *" type="number" value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.82rem', color: '#666', display: 'block', marginBottom: '4px' }}>Product Image</label>
                <input type="file" accept="image/*" ref={newFileRef}
                  onChange={e => {
                    const f = e.target.files[0]
                    setNewImagePreview(f ? URL.createObjectURL(f) : null)
                  }}
                  style={{ fontSize: '0.82rem' }} />
                {newImagePreview && (
                  <img src={newImagePreview} alt="preview"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px', display: 'block' }} />
                )}
              </div>
              <button style={btnStyle()} onClick={handleCreateProduct}>Create</button>
            </div>
          )}

          {products.map(p => (
            <div key={p.id} style={{ ...card }}>
              {editingProduct?.id === p.id ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    {editImagePreview
                      ? <img src={editImagePreview} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px' }} />
                      : (p.image_path && <img src={`/${p.image_path}`} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px' }} onError={e => { e.target.style.display = 'none' }} />)
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <input style={inputStyle} value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} placeholder="Name" />
                    <input style={inputStyle} value={editingProduct.description || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} placeholder="Description" />
                    <input style={inputStyle} type="number" value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="Price" />
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.82rem', color: '#666', display: 'block', marginBottom: '4px' }}>Replace Image</label>
                      <input type="file" accept="image/*" ref={editFileRef}
                        onChange={e => {
                          const f = e.target.files[0]
                          setEditImagePreview(f ? URL.createObjectURL(f) : null)
                        }}
                        style={{ fontSize: '0.82rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button style={btnStyle()} onClick={handleSaveProduct}>Save</button>
                      <button style={btnStyle('#aaa')} onClick={() => { setEditingProduct(null); setEditImagePreview(null) }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {p.image_path && (
                      <img src={`/${p.image_path}`} alt={p.name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{p.description}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>A${Number(p.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button style={btnStyle('#6b7280')} onClick={() => handleEditProduct(p)}>Edit</button>
                    <button style={btnStyle('#ef4444')} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Orders ── */}
      {tab === 'orders' && (
        <div>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '16px' }}>All orders across all users. Admin can permanently delete order records.</p>

          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', marginBottom: '10px' }}>
            MEMBER ({userLabel(memberOrders.length)})
          </h2>
          {memberOrders.length === 0
            ? <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>No member orders yet.</p>
            : memberOrders.map((o, i) => (
                <AdminOrderCard key={o.id} o={o} serial={orderSerial(i)} onDelete={handleDeleteOrder} card={card} btnStyle={btnStyle} />
              ))
          }

          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', margin: '20px 0 10px' }}>
            GUEST ({userLabel(guestOrders.length)})
          </h2>
          {guestOrders.length === 0
            ? <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No guest orders yet.</p>
            : guestOrders.map((o, i) => (
                <AdminOrderCard key={o.id} o={o} serial={orderSerial(memberOrders.length + i)} onDelete={handleDeleteOrder} card={card} btnStyle={btnStyle} />
              ))
          }
        </div>
      )}
    </div>
  )
}

function AdminOrderCard({ o, serial, onDelete, card, btnStyle }) {
  const subtotal = Number(o.subtotal)
  const discount = Number(o.discount)
  const shipping = Number(o.shipping)
  const total = Number(o.total)

  return (
    <div style={{ ...card, marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{serial}</div>
          <div style={{ fontWeight: 700, color: '#22a745', fontSize: '0.9rem' }}>{o.guest_name}</div>
          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '1px' }}>{o.guest_email}</div>
          <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '1px' }}>{new Date(o.created_at).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{
            background: { pending: '#f59e0b', shipped: '#3b82f6', delivered: '#22c55e', cancelled: '#aaa' }[o.status] || '#aaa',
            color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600
          }}>{o.status}</span>
          <button style={btnStyle('#ef4444')} onClick={() => onDelete(o.id)}>Delete</button>
        </div>
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px', marginBottom: '10px' }}>
        {o.items?.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#444' }}>
            <span>{item.product_name} ×{item.quantity}</span>
            <span>A${(Number(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div style={{ background: '#f8f8f8', borderRadius: '6px', padding: '10px 12px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#555' }}>
          <span>Subtotal</span><span>A${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#22a745' }}>
            <span>10% discount</span><span>-A${discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: shipping === 0 ? '#22a745' : '#555' }}>
          <span>Shipping</span><span>{shipping === 0 ? 'FREE' : `A$${shipping.toFixed(2)}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', paddingTop: '6px', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
          <span>Total</span><span>A${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}