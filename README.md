# 🍅 Tomato - Full-Stack Food Ordering & Real-Time Kitchen Operations Management System

A state-of-the-art, responsive full-stack food delivery application built with **React**, **Node.js**, **Express**, and **MongoDB**. Features **Google Sign-In OAuth2**, **Real-Time Server-Sent Events (SSE)**, **Cash/Stripe Payments**, **Kitchen Order Ticket (KOT) Thermal Printing**, **Sound Alerts**, and **Material 3 Design Aesthetics**.

---

## 🌟 Key Features

### 🛒 Customer Storefront UI
- **Dynamic Food Catalog**: Interactive category filtering & Veg / Non-Veg diet type filters.
- **Flexible Fulfillment & Checkout**: Support for **Delivery** and **Dine-In / Pickup** orders.
- **Dual Payment Gateways**: Stripe Online Credit Card checkout & Cash on Delivery (COD).
- **Google OAuth2 Sign-In**: Integrated Google Identity Services (GIS) with one-click Google Sign-In and desktop One Tap prompts.
- **Live Timeline Order Tracker**: Real-time progress visualizer covering *Placed* → *Food Processing* → *Prepared* → *Out for Delivery* → *Delivered*.

### ⚙️ Admin Operations & Kitchen Dashboard
- **Real-Time Order Audio & Visual Alerts**: Browser-native Web Audio API synthesizer chime ("ting") and red notification dots on incoming orders.
- **Live Summary Stat Cards**: Real-time operational metric counters (*Total Orders*, *Needs Acceptance*, *Preparing Food*, *Out for Delivery*).
- **Kitchen Order Ticket (KOT) Printing**: One-click thermal receipt printing displaying itemized order lists, customer phone numbers, delivery addresses, or Dine-In table numbers.
- **Daily Cash Logging & Income Tracker**: Daily cash input logging auto-sorted with **Today** at the top cascading down 7 days.
- **Access Authorization Control**: Access Request & Grant Workflow for Revenue Analytics.
- **Store Configuration**: Live toggles for Store Open/Close status, Tax Rates, Delivery Fees, Discount Rates, and Location Geofencing coordinates.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router DOM, Axios, Material 3 Design System (Vanilla CSS with CSS Variables).
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (JSON Web Tokens), Bcryptjs, Server-Sent Events (SSE).
- **Authentication**: JWT Auth + Native Google OAuth2 Tokeninfo Verification.
- **Payment Processing**: Stripe API + Cash on Delivery (COD).

---

## 📂 Project Architecture

```
FoodOrderingWebsite/
├── backend/                  # Express API Server & Database Models
│   ├── config/               # Database connection config
│   ├── controllers/          # Business logic handlers
│   ├── models/               # Mongoose schemas (Order, User, Food, Settings, CashLog)
│   ├── routes/               # Express API endpoints
│   ├── utils/                # Server-Sent Events (SSE) live updates manager
│   ├── seed.js               # Database catalog & admin seeder script
│   └── server.js             # Entry point
├── frontend/                 # Storefront Client & Integrated Admin Panel
│   ├── src/
│   │   ├── admin/            # Integrated Admin Dashboard views & components
│   │   ├── components/       # Storefront UI components (Navbar, LoginPopup, etc.)
│   │   ├── context/          # StoreContext state management
│   │   ├── pages/            # Customer pages (Home, Cart, PlaceOrder, MyOrders)
│   │   └── App.jsx           # Main App Container & SSE Listeners
│   └── .env                  # Frontend environment variables
└── admin/                    # Standalone Admin Portal
```

---

## ⚙️ Environment Variables

### Backend Environment Setup (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tomato_foodDelivery
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FRONTEND_URL=http://localhost:5173
DEFAULT_ADMIN_EMAIL=superAdmin_email here
DEFAULT_ADMIN_PASSWORD=SuperAdminPass_here
```

### Frontend Environment Setup (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_FRONTEND_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install storefront frontend dependencies
cd ../frontend
npm install

# Install standalone admin dependencies
cd ../admin
npm install
```

### 2. Seed Database Catalog & Initial Admin
```bash
cd backend
node seed.js
```

### 3. Start Development Servers
In separate terminal windows:

```bash
# Terminal 1: Run Backend API Server (Port 4000)
cd backend
npm run server

# Terminal 2: Run Customer Storefront (Port 5173)
cd frontend
npm run dev

# Terminal 3: Run Admin Dashboard (Port 5174)
cd admin
npm run dev
```

---

## 🔑 Default Credentials

- **Admin Login**: `admin@tomato.com` / `AdminPass@2026!` *(configurable in `backend/.env`)*
- **Test Customer Login**: `customer@tomato.com` / `1234`

---

## 🌐 Deploying to Render

### 1. Backend Service (Web Service)
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: Add `MONGODB_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `FRONTEND_URL`.

### 2. Frontend Site (Static Site)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Add `VITE_BACKEND_URL` and `VITE_GOOGLE_CLIENT_ID`.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
