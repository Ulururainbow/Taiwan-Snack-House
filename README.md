# Taiwan Snack House

A full-stack e-commerce single-page application for purchasing authentic Taiwanese snacks, built with React (Vite) + Node.js (Express) + MySQL.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, React Router v6, Vite   |
| Backend  | Node.js, Express 5, WebSocket     |
| Database | MySQL 8                           |
| Auth     | JWT + bcrypt password hashing     |
| Upload   | Multer (image file handling)      |

---

## Features

- **Live product search** — filters products in real-time as you type
- **Guest & registered user carts** — persisted to the database for both
- **JWT authentication** — register, login, and protected admin routes
- **Multi-step checkout** — Shipping Info → Payment → Order Review
- **Order tracking** — view full price breakdown and cancel pending orders
- **Admin Dashboard** with four management panels:
  - **Shopping Carts** — view active carts of guests and members
  - **Members** — edit name or delete registered accounts
  - **Products** — full CRUD with image upload
  - **Orders** — view all orders split by Member / Guest; admin can permanently delete records
- **WebSocket** — automatically clears guest cart data when the browser is closed

---

## Prerequisites

The following must be installed on your machine before running the project:

- **Node.js v18+** — https://nodejs.org
- **MySQL 8** — https://dev.mysql.com/downloads/mysql/

> Any MySQL client works for setup (MySQL Workbench, TablePlus, DBeaver, or the terminal).

---

## Setup Instructions

### 1. Database

Open your MySQL client and create the database:

```sql
CREATE DATABASE taiwan_snacks;
```

Then import the schema and seed data via terminal:

```bash
mysql -u root -p taiwan_snacks < taiwan_snacks.sql
```

Or use your MySQL GUI client to import `taiwan_snacks.sql` directly.

### 2. Backend — configure DB credentials

Open `backend/db.js` and update your MySQL password:

```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',   // ← change this to your MySQL password
  database: 'taiwan_snacks',
  ...
});
```

If your MySQL has no password set, leave it as an empty string `''`.

Then install dependencies and start the server:

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Admin Access

To access the Admin Dashboard, set `is_admin = 1` for a user directly in the database:

```sql
UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';
```

Then log in with that account — the **Admin** link will appear in the navbar.

---

## Project Structure

```
Assessment2/
├── backend/
│   ├── server.js       # Express API + WebSocket + Multer image upload
│   ├── db.js           # MySQL connection pool (edit credentials here)
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── images/     # Product images served statically
│   ├── src/
│   │   ├── App.jsx             # Root component, cart state, routing
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Search bar, navigation, auth links
│   │   │   └── CartDrawer.jsx  # Sidebar cart with price breakdown
│   │   └── pages/
│   │       ├── Home.jsx            # Product listing + live search
│   │       ├── Login.jsx           # Login & registration
│   │       ├── ShippingInfo.jsx    # Checkout step 1
│   │       ├── Checkout.jsx        # Checkout step 2 (payment)
│   │       ├── OrderTracking.jsx   # Order confirmation & history
│   │       └── AdminDashboard.jsx  # Admin panel (CRUD)
│   └── package.json
└── taiwan_snacks.sql   # Database schema + seed data
```

---

## Database Entities & CRUD Operations

| Entity          | Create | Read | Update | Delete |
|-----------------|--------|------|--------|--------|
| `users`         |  Register |  Login / Admin view |  Admin edit name |  Admin delete |
| `products`      |  Admin panel |  Product listing |  Admin panel |  Admin panel |
| `shopping_cart` |  Add to cart |  Load cart |  Update quantity |  Remove item / clear |
| `orders`        |  Checkout |  Order tracking |  Cancel order |  Admin delete |
| `order_items`   |  With order |  With order | — |  With order |