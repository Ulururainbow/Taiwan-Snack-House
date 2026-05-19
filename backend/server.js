const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Image upload setup ─────────────────────────────────────────
const uploadDir = path.join(__dirname, '../frontend/public/images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'image_' + Date.now() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = 3001;
const JWT_SECRET = 'taiwan_snack_secret_2024';

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/?', '').replace('/', ''));
  const guestId = params.get('guest_id');
  if (!guestId) { ws.close(); return; }
  ws.guestId = guestId;
  ws.on('close', async () => {
    try {
      await pool.query('DELETE FROM shopping_cart WHERE guest_id = ?', [guestId]);
    } catch {}
  });
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashed, name || '']
    );
    const token = jwt.sign({ id: result.insertId, email, is_admin: 0 }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.insertId, email, name, is_admin: 0 } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: rows[0].id, email, is_admin: rows[0].is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: rows[0].id, email, name: rows[0].name, is_admin: rows[0].is_admin } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/orders', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { user_id, guest_id, guest_name, guest_email, address, phone, items, subtotal, discount, shipping, total } = req.body;
    await conn.beginTransaction();
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, guest_name, guest_email, address, phone, subtotal, discount, shipping, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")',
      [user_id || null, guest_name, guest_email, address, phone, subtotal, discount, shipping, total]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.price, item.quantity]
      );
    }
    if (user_id) {
      await conn.query('DELETE FROM shopping_cart WHERE user_id = ?', [user_id]);
    } else if (guest_id) {
      await conn.query('DELETE FROM shopping_cart WHERE guest_id = ?', [guest_id]);
    }
    await conn.commit();
    res.json({ order_id: orderId, status: 'pending' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orders[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.put('/api/orders/:id/assign', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('UPDATE orders SET user_id = ? WHERE id = ?', [user_id, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign order' });
  }
});

app.put('/api/orders/:id/cancel', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = "cancelled" WHERE id = ? AND status = "pending"',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(400).json({ error: 'Order cannot be cancelled' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ error: 'Admin only' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Returns only users who have active cart items (for Shopping Carts tab)
app.get('/api/admin/users/with-cart', verifyAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.name, u.is_admin
       FROM users u
       INNER JOIN shopping_cart sc ON sc.user_id = u.id
       WHERE u.is_admin != 1`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users with cart' });
  }
});

app.get('/api/admin/guests', verifyAdmin, async (req, res) => {
  try {
    const [guests] = await pool.query(
      `SELECT guest_id, COUNT(*) as item_count, SUM(price * quantity) as total
       FROM shopping_cart 
       WHERE guest_id IS NOT NULL
       GROUP BY guest_id 
       ORDER BY MAX(updated_at) DESC`
    );
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

app.get('/api/admin/users/:id/cart', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let items;
    if (id.startsWith('guest_')) {
      [items] = await pool.query(
        'SELECT * FROM shopping_cart WHERE guest_id = ? ORDER BY updated_at DESC',
        [id]
      );
    } else {
      [items] = await pool.query(
        'SELECT * FROM shopping_cart WHERE user_id = ? ORDER BY updated_at DESC',
        [id]
      );
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { user_id, guest_id, product_id, product_name, price, quantity } = req.body;
    if (!user_id && !guest_id) return res.status(400).json({ error: 'user_id or guest_id required' });
    if (user_id) {
      await pool.query(
        `INSERT INTO shopping_cart (user_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = ?`,
        [user_id, product_id, product_name, price, quantity, quantity]
      );
    } else {
      await pool.query(
        `INSERT INTO shopping_cart (guest_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = ?`,
        [guest_id, product_id, product_name, price, quantity, quantity]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync cart' });
  }
});

app.get('/api/cart/load/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { type } = req.query;
    let items;
    if (type === 'guest') {
      [items] = await pool.query(
        `SELECT sc.*, p.image_path FROM shopping_cart sc
         LEFT JOIN products p ON sc.product_id = p.id
         WHERE sc.guest_id = ? ORDER BY sc.updated_at DESC`,
        [ownerId]
      );
    } else {
      [items] = await pool.query(
        `SELECT sc.*, p.image_path FROM shopping_cart sc
         LEFT JOIN products p ON sc.product_id = p.id
         WHERE sc.user_id = ? ORDER BY sc.updated_at DESC`,
        [ownerId]
      );
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

app.delete('/api/cart/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    if (userId.startsWith('guest_')) {
      await pool.query('DELETE FROM shopping_cart WHERE guest_id = ? AND product_id = ?', [userId, productId]);
    } else {
      await pool.query('DELETE FROM shopping_cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

app.delete('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId.startsWith('guest_')) {
      await pool.query('DELETE FROM shopping_cart WHERE guest_id = ?', [userId]);
    } else {
      await pool.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.get('/api/guest/new-id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT guest_id FROM shopping_cart 
       WHERE guest_id LIKE 'guest_%'
       GROUP BY guest_id`
    );
    const nums = rows
      .map(r => parseInt(r.guest_id.replace('guest_', '')))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    res.json({ guest_id: `guest_${String(next).padStart(4, '0')}` });
  } catch {
    res.status(500).json({ error: 'Failed to generate guest ID' });
  }
});

// ── Products CRUD (admin) ──────────────────────────────────────
app.post('/api/admin/products', verifyAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image_path) VALUES (?, ?, ?, ?)',
      [name, description || '', price, image_url || null]
    );
    res.json({ id: result.insertId, name, description, price, image_path: image_url || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_path = ? WHERE id = ?',
      [name, description, price, image_url || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ── User update / delete (admin) ──────────────────────────────
app.put('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM shopping_cart WHERE user_id = ?', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── Order delete (admin) ───────────────────────────────────────
app.delete('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── Image upload ──────────────────────────────────────────────
app.post('/api/upload/image', verifyAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imagePath = 'images/' + req.file.filename;
  res.json({ image_path: imagePath });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});