# ApexMart — Enterprise Amazon-Grade Full-Stack E-Commerce Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20%26%20Render-success?style=for-the-badge&logo=vercel)](https://frontend-woad-two-scu7pccs5d.vercel.app/)
[![Tests](https://img.shields.io/badge/Vitest-290%20Passed%20(100%25)-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/AbdallaTaher/ApexMart-ecommerce-platform)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

> A production-ready, feature-dense full-stack e-commerce marketplace built with **React 18**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and **MongoDB Atlas**. Architected with strict separation of concerns, vertical feature slicing, OWASP enterprise security, and 100% automated test coverage.

---

## 🚀 Live Production Links

- **🌐 Live Web Application (Frontend):** [https://frontend-woad-two-scu7pccs5d.vercel.app](https://frontend-woad-two-scu7pccs5d.vercel.app/)
- **⚙️ Live REST API (Backend):** Deployed on Render Web Service (connected to MongoDB Atlas)
- **📦 GitHub Repository:** [https://github.com/AbdallaTaher/ApexMart-ecommerce-platform](https://github.com/AbdallaTaher/ApexMart-ecommerce-platform)

---

## 🔑 Demo Access Credentials

Visitors, recruiters, and reviewers can explore all role-based portals using these seeded test accounts:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Buyer / Customer** | `buyer@apexmart.com` | `Password123!` | Catalog browsing, cart, checkout, order tracking, verified customer reviews |
| **Merchant / Seller** | `seller@apexmart.com` | `Password123!` | Seller Central portal, inventory management, KPI trajectory charts, product CRUD |
| **Platform Admin** | `admin@apexmart.com` | `Password123!` | Platform Governance console, Gross Merchandise Volume (GMV), RBAC management, audit trails |

*(You can also register a brand new customer account at any time on `/signup`)*.

---

## ✨ Key Feature Highlights

### 🛒 1. Amazon-Style Storefront & Catalog Discovery
- **Multi-Facet Filtering:** Filter in real-time by department/category, minimum customer star rating, and dynamic price sliders.
- **Effective Price Sorting:** Database-indexed sorting based on the buyer's actual checkout price (`effectivePrice` calculating direct discounts vs deal percentages).
- **Search with Debounce:** Instant search across product titles, descriptions, and brand names with URL query synchronization.
- **Stock Indicators:** Dynamic stock urgency alerts (*"Only 3 left in stock"*, *"In Stock"*, or *"Out of Stock"*).

### 🔍 2. Interactive Media Stage & Zoom Lens
- **Multi-Angle Gallery:** Interactive thumbnail carousel with seamless active image selection.
- **Hardware-Accelerated Zoom:** High-resolution zoom lens using compositor-only CSS transforms (`scale(2.2)`) and mouse coordinates for ultra-smooth 60fps performance.
- **Graceful Error Fallbacks:** Cross-origin image referrer handling (`no-referrer`) and graceful fallback rendering to prevent broken image placeholders.

### 🛍️ 3. Optimistic Shopping Cart & Inventory Clamping
- **Instant Client Feedback:** Optimistic UI state mutations via React Context API backed by `localStorage` persistence.
- **Live Server Verification:** Automatic reconciliation against backend warehouse inventory with stock boundary adjustments and toast alerts.
- **Amazon Prime Threshold:** Live shipping fee calculator with free delivery unlocked on orders over $35.

### 💳 4. Multi-Step Checkout & Stripe Payment Gateway
- **4-Step Checkout Stepper:** Address Form validation -> Delivery Speed (Standard, Two-Day, Next-Day) -> Stripe Elements Payment -> Order Review.
- **Secure Card Processing:** Integrated with Stripe SDK for PCI-compliant client-side payment tokens and webhook verification.

### 🚚 5. Order Tracking & Printable Invoices
- **Visual Order Timeline:** 4-stage delivery tracker (*Order Placed* → *Processing* → *Shipped* → *Delivered*).
- **IDOR Protection:** Strict ownership verification ensuring buyers only access their personal order history.
- **Printable Invoices:** Clean print-optimized CSS layout for customer receipts.

### ⭐ 6. Verified Customer Reviews & Ratings Engine
- **Verified Buyer Enforcement:** Anti-spam security gate restricting review submissions strictly to customers who purchased the product.
- **Rating Distribution Breakdown:** Aggregated 5-star distribution percentages and average rating recalculation on Mongoose post-save hooks.
- **Helpful Review Voting:** Interactive thumbs-up voting preventing duplicate user votes.

### 🏬 7. Merchant Central (Seller Portal)
- **Business KPI Metrics:** Real-time metrics for total revenue, active listings, units sold, and average rating.
- **Revenue Trajectory Chart:** Responsive revenue visualizations powered by Recharts (adapts to Dark/Light theme).
- **Virtualized Inventory Table:** High-density inventory management powered by `@tanstack/react-virtual` keeping the DOM strictly below 800 nodes.
- **Product Management:** Modal for creating, editing, and deleting inventory items with instant catalog cache invalidation.

### 🛡️ 8. Platform Governance & Security Audit Trail
- **Executive Metrics:** Platform-wide Gross Merchandise Volume (GMV), active customer count, and system status.
- **RBAC Role Management:** Administrator interface to inspect user accounts and update authorization tiers (`user`, `seller`, `admin`).
- **Immutable Audit Trail:** Append-only database audit log capturing administrative role mutations, refunds, and security events.

---

## 🏗️ Architecture & Technology Stack

```
ApexMart Monorepo/
├── frontend/               # React 18 + Vite SPA (Client Tier)
│   ├── src/
│   │   ├── context/        # Global UI state (CartContext, DarkModeContext)
│   │   ├── features/       # Vertical domain slices (auth, products, cart, checkout, orders, reviews, seller, admin)
│   │   ├── services/       # Axios API client configured for HttpOnly cookies
│   │   ├── ui/             # Reusable design system primitives & route guards
│   │   └── App.jsx         # Client-side router & route protection hierarchy
├── backend/                # Node.js + Express.js MVC (API Tier)
│   ├── controllers/        # Thin controllers delegating to models & factories
│   ├── models/             # Mongoose schemas with compound indexes & lifecycle hooks
│   ├── routes/             # RESTful route definitions & rate limiters
│   ├── utils/              # CacheLayer, AppError, catchAsync, APIFeatures, latency budget
│   └── server.js           # Express bootstrap, Atlas connection, graceful shutdown
└── tests/                  # Automated Test Suites
    ├── unit/               # Vitest unit tests (business logic, helpers)
    ├── integration/        # Supertest API & database integration suites
    └── e2e/                # Playwright end-to-end browser journeys
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, React Router v6 |
| **State & Data Fetching** | `@tanstack/react-query` v5, React Context API |
| **Styling & Design System** | Tailwind CSS 3.4, Custom Amazon-inspired palette, Dark/Light mode |
| **Icons & Visuals** | `react-icons/hi2` (Heroicons 2), Recharts, GSAP |
| **Forms & Toasts** | `react-hook-form`, `react-hot-toast` |
| **Virtualization** | `@tanstack/react-virtual` |
| **Backend Runtime** | Node.js 18+, Express.js 4 |
| **Database & ODM** | MongoDB Atlas, Mongoose 8 |
| **Authentication & Crypto** | JWT (JSON Web Tokens), `bcryptjs`, HttpOnly SameSite cookies |
| **Performance & Caching** | In-Memory Cache-Aside engine (`catalogCache`), Gzip/Brotli compression |
| **Testing Framework** | Vitest 1.6, Supertest 6, Playwright 1.44 |
| **Cloud Hosting** | **Vercel** (Frontend Edge CDN) + **Render** (Node.js Web Service) |

---

## 🔒 Security Hardening & OWASP Compliance

ApexMart enforces enterprise-grade security standards across every endpoint:

1. **HttpOnly Cookie Authentication:** JWT tokens are stored exclusively in `HttpOnly`, `Secure`, `SameSite=none/lax` cookies, completely immune to JavaScript XSS theft.
2. **NoSQL Injection Defense:** Incoming request payloads are sanitized with `express-mongo-sanitize` to strip MongoDB operator injection vectors (`$gt`, `$ne`).
3. **Cross-Site Scripting (XSS) Prevention:** User-generated content is sanitized via `DOMPurify` before rendering.
4. **Security HTTP Headers:** Configured via `helmet` (Strict-Transport-Security, X-Content-Type-Options, DNS prefetch control, Frameguard).
5. **Rate Limiting:** Granular rate limiters on public authentication endpoints (`authLimiter`) and search queries (`catalogSearchLimiter`) to prevent brute-force attacks.
6. **In-Flight IDOR Guards:** Object-level authorization checks ensuring sellers and buyers can only modify resources they legitimately own.
7. **ACID Transaction Consistency:** Order placement and stock decrements are coordinated through database-level transactional boundaries.

---

## 🧪 Automated Test Suite (290/290 Tests Passing)

All business logic, security middleware, API contracts, and user journeys are backed by comprehensive automated test suites:

```bash
# Run all 26 test suites
npm run test:unit
```

```text
 ✓ tests/unit/cartHelper.test.js (10 tests)
 ✓ tests/unit/secureFileProcessing.test.js (13 tests)
 ✓ tests/integration/errorArchitecture.test.js (9 tests)
 ✓ tests/integration/passwordRecoveryIntegration.test.js (13 tests)
 ✓ tests/integration/adminGovernanceIntegration.test.js (14 tests)
 ✓ tests/integration/stripeWebhookIntegration.test.js (8 tests)
 ✓ tests/integration/cartIntegration.test.js (16 tests)
 ✓ tests/integration/productDetailIntegration.test.js (13 tests)
 ✓ tests/integration/orderOwnershipAndLifecycle.test.js (23 tests)
 ✓ tests/integration/catalogIntegration.test.js (27 tests)
 ✓ tests/integration/acidOrderRollback.test.js (5 tests)
 ✓ tests/integration/sellerPortalIntegration.test.js (15 tests)
 ✓ tests/unit/cacheLayer.test.js (8 tests)
 ✓ tests/integration/orderCreationIntegration.test.js (15 tests)
 ✓ tests/unit/apiFeatures.test.js (5 tests)
 ✓ tests/integration/authIntegration.test.js (24 tests)
 ✓ tests/integration/reviewVerification.test.js (18 tests)
 ✓ tests/unit/apiProducts.test.js (7 tests)
 ✓ tests/unit/appError.test.js (3 tests)
 ✓ tests/unit/cn.test.js (4 tests)
 ✓ tests/integration/catalogSecurityPolish.test.js (17 tests)
 ✓ tests/unit/fixtures.test.js (3 tests)
 ✓ tests/unit/catchAsync.test.js (2 tests)
 ✓ tests/unit/reviewModel.test.js (6 tests)
 ✓ tests/unit/authMiddleware.test.js (5 tests)
 ✓ tests/unit/userModel.test.js (7 tests)

Test Files  26 passed (26)
     Tests  290 passed (290)
```

---

## 💻 Local Development Setup

To run ApexMart locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/AbdallaTaher/ApexMart-ecommerce-platform.git
cd ApexMart-ecommerce-platform
```

### 2. Install dependencies
```bash
# Install root monorepo, frontend, and backend packages
npm install
npm --prefix frontend install
npm --prefix backend install
```

### 3. Configure environment variables
Create `backend/config.env` using the provided template:
```bash
cp backend/config.env.example backend/config.env
```
Update `backend/config.env` with your MongoDB connection string, JWT secrets, and API credentials.

### 4. Seed sample catalog & users
```bash
npm run seed:catalog
```

### 5. Launch development servers
```bash
# Concurrently starts Vite frontend (:5173) and Express backend (:5000)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
