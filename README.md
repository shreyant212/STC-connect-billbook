# STC-connect-billbook
A full-stack MERN-based Retail POS &amp; Billing System for STC Connect featuring inventory management, GST billing, customer &amp; supplier management, sales reports, JWT authentication, and role-based access for Admin and
# STC Connect — Retail POS & Billing System

A full-stack point-of-sale and billing system for **STC Connect** (fans, air coolers, mixer grinders & home appliances) — GST tax invoices, inventory across two locations, credit book (udhar), supplier ledger and reports.

Two parts:

| Part | Path | What it is |
|---|---|---|
| **Frontend** | `index.html` | A complete, working POS app in a single file — open it in any browser, zero setup. Runs on an in-memory data layer that mirrors the API below. |
| **Backend** | `backend/` | Node.js + Express + MongoDB REST API with JWT auth and role-based access, ready for the frontend to be wired onto. |

---

## ✨ Features

- **Dashboard** — today's sales, 14-day trend, low-stock alerts, top sellers, recent bills
- **Products** — SKU/barcode, HSN, category, purchase & selling price, GST %, per-location stock, reorder level
- **Billing (POS)** — search or barcode-scan to add, cart discount (% or ₹), automatic CGST/SGST split, round-off, GST tax invoice with **UPI payment QR**, print / save-as-PDF, WhatsApp share
- **Inventory** — stock in / stock out / transfer between Showroom ↔ Godown, full movement log, low-stock notifications
- **Customers** — purchase history, outstanding balance, **credit book (udhar)** with oldest-bill-first settlement
- **Suppliers** — ledger, multi-line purchase orders that receive stock and track payables
- **Reports** — daily & monthly sales, GST report (GSTR-1 style, by rate), product-wise sales, profit & loss
- **User roles** — `admin` (everything) · `manager` (no users/settings) · `cashier` (billing counter only)

**Demo logins:** `admin/admin123` · `manager/manager123` · `cashier/cashier123`

---

## 🚀 Quick start — frontend only

Open `index.html` in a browser. That's it. It ships with 15 days of seeded shop data.

> Data lives in memory, so a refresh resets it. Use **Settings → Download backup / Load backup** to save and restore your work as JSON. The UPI QR needs internet (loads a small QR library from cdnjs).

To host it, push this repo to GitHub and enable **Settings → Pages → Deploy from branch** — `index.html` at the root serves automatically.

---

## 🔧 Backend setup (Node + Express + MongoDB)

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed              # creates demo users, products, customers, suppliers
npm run dev               # or: npm start
```

The API starts on `http://localhost:5000`. Sign in first:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Use the returned token as `Authorization: Bearer <token>` on every other route.

### API overview

| Method & route | What it does | Roles |
|---|---|---|
| `POST /api/auth/login` | Sign in, returns JWT | all |
| `GET /api/products` `?search=&category=&lowStock=true` | List/search products | all |
| `POST /api/products` · `PUT /:id` · `DELETE /:id` | Manage catalogue (soft delete) | admin, manager |
| `POST /api/bills` | **POS checkout** — server recomputes prices & GST, deducts stock, writes inventory logs, updates the credit book, records payment | all |
| `GET /api/bills` `?from=&to=&customer=` | List invoices | all |
| `POST /api/purchases` | Purchase order — receives stock, updates cost & supplier payable | admin, manager |
| `POST /api/payments` | Collect from customer / pay supplier; settles oldest dues first | all |
| `POST /api/inventory/adjust` · `/transfer` | Manual stock in/out and location transfers | admin, manager |
| `GET /api/reports/summary` `/gst` `/products` `/daily` | All reports, filterable with `?from=&to=` | admin, manager |
| `GET/POST/PUT /api/users` | User management | admin |

### Data model (MongoDB collections)

`Users` · `Products` · `Customers` · `Suppliers` · `Bills` (items embedded) · `Purchases` · `Payments` · `InventoryLogs` · `Counters` (invoice/PO/payment numbering)

Bill items snapshot the name, price, purchase price and GST rate at sale time, so old invoices and profit reports stay correct even after you edit a product.

### GST maths

Prices are stored **GST-exclusive**. A cart discount is spread proportionally across lines so each rate's taxable value stays accurate, tax splits 50/50 into CGST + SGST (intra-state), and the grand total rounds to the rupee with a visible round-off line. The exact same function lives in `backend/utils/gst.js` and inside `index.html`, so the server and the screen can never disagree.

---

## ☁️ Deployment (as per the original spec)

1. **MongoDB Atlas** — create a free M0 cluster, get the connection string into `MONGO_URI`.
2. **Render** (backend) — new Web Service from this repo, root directory `backend`, build `npm install`, start `npm start`, add `MONGO_URI` + `JWT_SECRET` env vars. Run `npm run seed` once from the Render shell.
3. **Vercel / GitHub Pages** (frontend) — serve `index.html`. When you wire it to the API, point its fetch layer at your Render URL and enable CORS (already on in `server.js`).

---

## 🗺️ Roadmap

- [ ] React + Vite frontend consuming this API (the current `index.html` is the reference implementation)
- [ ] Real product photos & barcode label printing
- [ ] E-invoice / e-way bill integration
- [ ] Mobile app (React Native) sharing the same API

## 📁 Structure

```
stc-connect-pos/
├── index.html                 # complete working POS app (open in browser)
└── backend/
    ├── server.js              # Express app + route mounting
    ├── seed.js                # demo data seeder
    ├── config/db.js
    ├── middleware/auth.js     # JWT protect + role authorize
    ├── utils/gst.js           # shared GST bill maths
    ├── models/                # 9 Mongoose models
    └── routes/                # auth, products, customers, suppliers,
                               # bills, purchases, payments, inventory,
                               # reports, users
```

---

Built for STC Connect, Pune. Fans · Coolers · Mixer Grinders 🌀
