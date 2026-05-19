import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STATUS_COLOR = { pending: '#f59e0b', shipped: '#3b82f6', delivered: '#22c55e', cancelled: '#aaa' }
const steps = ['Shipping Info', 'Payment', 'Order Review']

export default function OrderTracking({ user }) {
  const [orders, setOrders] = useState([])
  const [guestOrder, setGuestOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const newOrderId = location.state?.orderId

  useEffect(() => {
    if (user) {
      setLoading(true)
      fetch(`http://localhost:3001/api/orders/user/${user.id}`)
        .then(r => r.json())
        .then(data => { setOrders(data); setLoading(false) })
        .catch(() => setLoading(false))
    } else if (newOrderId) {
      setLoading(true)
      fetch(`http://localhost:3001/api/orders/${newOrderId}`)
        .then(r => r.json())
        .then(data => { setGuestOrder(data); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [user, newOrderId])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/cancel`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
        if (guestOrder?.id === orderId) setGuestOrder({ ...guestOrder, status: 'cancelled' })
      }
    } catch { alert('Failed to cancel order') }
  }

  const OrderCard = ({ order, showCancel = false }) => {
    const subtotal = Number(order.subtotal)
    const discount = Number(order.discount)
    const shipping = Number(order.shipping)
    const total = Number(order.total)
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Order Confirmed</span>
          <span style={{ background: STATUS_COLOR[order.status], color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>{order.status}</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>{new Date(order.created_at).toLocaleDateString()}</p>
        {order.items?.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
            <span>{item.product_name} x{item.quantity}</span>
            <span>A${(Number(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#555' }}>
            <span>Subtotal</span><span>A${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: '#22a745' }}>
              <span>10% discount</span><span>-A${discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: shipping === 0 ? '#22a745' : '#555' }}>
            <span>Shipping</span><span>{shipping === 0 ? 'FREE' : `A$${shipping.toFixed(2)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <span>Total</span>
            <span>A${total.toFixed(2)}</span>
          </div>
        </div>
        {showCancel && order.status === 'pending' && (
          <button onClick={() => handleCancel(order.id)}
            style={{ marginTop: '12px', background: 'none', border: '1px solid #ddd', color: '#888', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>
            Cancel Order
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0 32px' }}>
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700,
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: i === 2 ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: '80px', height: '2px', background: 'var(--primary)', margin: '0 8px', marginBottom: '20px' }} />
            )}
          </div>
        ))}
      </div>

      {newOrderId && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ color: '#166534', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Order Placed Successfully!</p>
          <p style={{ color: '#166534', fontSize: '0.9rem' }}>Your order has been received.</p>
        </div>
      )}

      <h2 style={{ color: 'var(--primary)', marginBottom: '24px' }}>Order Tracking</h2>

      {loading ? <p>Loading...</p> : (
        user ? (
          orders.length === 0 ? (
            <p style={{ color: '#aaa' }}>No orders found.</p>
          ) : orders.map(order => <OrderCard key={order.id} order={order} showCancel={true} />)
        ) : guestOrder ? (
          <>
            <OrderCard order={guestOrder} showCancel={true} />
            <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.85rem', color: '#666' }}>
              Want to track future orders?{' '}
              <button onClick={() => navigate('/login')}
                style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                Create an account
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>Please log in to view your orders.</p>
            <button onClick={() => navigate('/login')}
              style={{ background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>
        )
      )}

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', color: '#888', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
          Back to Shop
        </button>
      </div>
    </div>
  )
}