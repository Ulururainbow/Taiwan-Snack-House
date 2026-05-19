import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ShippingInfo from './pages/ShippingInfo'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

const getStoredUser = () => {
  try {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) return JSON.parse(stored)
  } catch {}
  return null
}

export default function App() {
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(getStoredUser)
  const [shippingData, setShippingData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [guestId, setGuestId] = useState(localStorage.getItem('guest_id') || null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (guestId) return
    const stored = localStorage.getItem('guest_id')
    if (stored) { setGuestId(stored); return }
    fetch('http://localhost:3001/api/guest/new-id')
      .then(r => r.json())
      .then(data => {
        localStorage.setItem('guest_id', data.guest_id)
        setGuestId(data.guest_id)
      })
      .catch(() => {
        // fallback: use timestamp-based 4-digit suffix so it's still readable
        const num = String(Date.now()).slice(-4)
        const fallback = 'guest_' + num.padStart(4, '0')
        localStorage.setItem('guest_id', fallback)
        setGuestId(fallback)
      })
  }, [])

  useEffect(() => {
    if (user || !guestId) return
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(`ws://localhost:3001/?guest_id=${guestId}`)
    wsRef.current = ws
    return () => { ws.close() }
  }, [user, guestId])

  useEffect(() => {
    if (user) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [user])

  useEffect(() => {
    if (!guestId && !user) return
    const ownerId = user ? user.id : guestId
    const type = user ? 'user' : 'guest'
    fetch(`http://localhost:3001/api/cart/load/${ownerId}?type=${type}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCart(data.map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            image_path: item.image_path || null,
          })))
        }
      })
      .catch(() => {})
  }, [user, guestId])

  const handleSetUser = (userData) => {
    setUser(userData)
    setSearchTerm('')
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const syncCartItem = (item, currentUser) => {
    const owner = currentUser || user
    const body = owner
      ? { user_id: owner.id, product_id: item.id, product_name: item.name, price: item.price, quantity: item.quantity }
      : { guest_id: guestId, product_id: item.id, product_name: item.name, price: item.price, quantity: item.quantity }
    fetch('http://localhost:3001/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  const removeCartItemFromDB = (productId) => {
    const ownerId = user ? user.id : guestId
    fetch(`http://localhost:3001/api/cart/${ownerId}/${productId}`, { method: 'DELETE' })
  }

  const clearCartFromDB = () => {
    const ownerId = user ? user.id : guestId
    fetch(`http://localhost:3001/api/cart/${ownerId}`, { method: 'DELETE' })
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      const newCart = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { id: product.id, name: product.name, price: product.price, image_path: product.image_path || null, quantity: 1 }]
      const updatedItem = newCart.find(i => i.id === product.id)
      syncCartItem(updatedItem)
      return newCart
    })
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const newCart = prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
      const updatedItem = newCart.find(i => i.id === id)
      if (updatedItem) {
        syncCartItem(updatedItem)
      } else {
        removeCartItemFromDB(id)
      }
      return newCart
    })
  }

  const removeFromCart = (id) => {
    removeCartItemFromDB(id)
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const clearCart = () => {
    clearCartFromDB()
    setCart([])
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const discount = totalItems >= 2 ? subtotal * 0.1 : 0
  const afterDiscount = subtotal - discount
  const shipping = afterDiscount >= 100 ? 0 : 9.90
  const total = afterDiscount + shipping

  const cartProps = { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal, discount, shipping, total, guestId }

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={handleSetUser} totalItems={totalItems} onSearch={setSearchTerm} searchTerm={searchTerm} />
      <Routes>
        <Route path="/" element={<Home {...cartProps} searchTerm={searchTerm} />} />
        <Route path="/login" element={<Login setUser={handleSetUser} />} />
        <Route path="/shipping" element={<ShippingInfo {...cartProps} shippingData={shippingData} setShippingData={setShippingData} user={user} setUser={handleSetUser} />} />
        <Route path="/checkout" element={<Checkout {...cartProps} shippingData={shippingData} user={user} clearCart={clearCart} />} />
        <Route path="/orders" element={<OrderTracking user={user} />} />
        <Route path="/admin" element={<AdminDashboard user={user} />} />
      </Routes>
    </BrowserRouter>
  )
}