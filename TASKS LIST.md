# APEXMART - MASTER TASKS LIST TRACKER

> Project: ApexMart - Full-Stack E-Commerce Platform (Amazon Clone)
> Methodology: Vertical Slicing (Feature-by-Feature)
> Legend: [ ] Pending | [x] Completed & Verified

---

## 📦 SLICE 0: MONOREPO FOUNDATION & SHARED CONFIG
- [x] **Task 01:** Monorepo Workspace Initialization (backend/, frontend/, tests/, ESLint, Prettier, .gitignore)
- [x] **Task 02:** Backend Core Utilities & Global Error Architecture (AppError, catchAsync, APIFeatures, errorController, Mongoose connection)
- [x] **Task 03:** Frontend Design System & Theme Engine (Tailwind, CSS Variables, DarkModeContext, cn, AppLayout)

---

## 🔐 SLICE 1: AUTHENTICATION & USER GOVERNANCE (RBAC + MFA)
- [x] **Task 04 (Backend):** User Model & Secure Auth APIs (bcrypt, HttpOnly JWT cookies, session rotation, protect/restrictTo middlewares)
- [x] **Task 05 (Backend Test):** Supertest Auth Integration Suite & Postman Manual Guide
- [x] **Task 06 (Frontend):** Auth Feature Slice & Protected Routes (apiAuth, useLogin, useSignup, useUser, ProtectedRoute, Forms)
- [x] **Task 07 (Security & Polish):** Password Recovery & Profile Management (Nodemailer, Profile Update UI, CSRF Token Defense)

---

## 🏷️ SLICE 2: PRODUCT TAXONOMY & CATALOG DISCOVERY
- [x] **Task 08 (Backend):** Category & Product Models with Dynamic Filtering (compound indexes, slugs, APIFeatures search/filter/sort/paginate, .lean() reads)
- [x] **Task 09 (Backend Test):** Supertest Catalog Integration Suite & Postman Verification Guide
- [x] **Task 10 (Frontend):** Catalog Discovery & Deal Scrollers (apiProducts, useProducts, ProductCard with WebP & explicit dimensions to prevent CLS, Filters, Deals Scroller)
- [x] **Task 11 (Security & Polish):** Rate Limiting, Latency Budgets & Skeletons (express-rate-limit, Cache-Aside layer, <300ms query budgets, Skeleton loaders)

---

## 🔍 SLICE 3: PRODUCT DETAIL & MULTI-ANGLE MEDIA (MODULE 02)
- [x] **Task 12 (Backend):** Product Detail API & Secure File Processing (single product populate seller/reviews, Cloudinary upload utility)
- [x] **Task 13 (Backend Test):** Supertest Product Detail Suite & File Upload Boundary Tests
- [x] **Task 14 (Frontend):** Product Detail View & Iconic Buy Box (ImageGallery thumbnail swap, variants, Amazon Buy Box, compositor-only zoom)

---

## 🛒 SLICE 4: CLIENT & SERVER-SYNCHRONIZED SHOPPING CART
- [x] **Task 15 (Backend):** Cart Synchronization API (/cart/sync, stock availability verification)
- [x] **Task 16 (Backend Test):** Supertest Cart Synchronization Suite & Postman Guide
- [x] **Task 17 (Frontend):** Cart State & Free Shipping Progress (CartContext, CartItem, live subtotal math, free shipping progress bar)

---

## 💳 SLICE 5: TRANSACTIONAL ORDER PROCESSING & STRIPE PAYMENTS (MODULES 04 & 05)
- [x] **Task 18 (Backend):** Order Creation with ACID Stock Deduction (Idempotency-Key, MongoDB ACID stock decrement, Stripe PaymentIntent)
- [x] **Task 19 (Backend):** Stripe Webhook Listener & Event Reconciliation (signature validation, payment_intent.succeeded/failed reconciliation)
- [x] **Task 20 (Backend Test):** Supertest ACID Order Suite (stock rollback test) & Stripe CLI simulation guide
- [x] **Task 21 (Frontend):** Multi-Step Checkout Flow (AddressForm, delivery speed, Stripe Elements wrapper, Place Order)

---

## 🚚 SLICE 6: ORDER LIFECYCLE TRACKING & INVOICING
- [x] **Task 22 (Backend):** Order History & Status Lifecycle APIs (GET /orders/my-orders, PATCH /orders/:id/status)
- [x] **Task 23 (Backend Test):** Supertest Order Ownership & IDOR Protection Suite
- [x] **Task 24 (Frontend):** Order Tracking Stepper & Printable Invoices (OrderTimeline 4-step stepper, printable invoice, OrdersPage)

---

## ⭐ SLICE 7: VERIFIED CUSTOMER REVIEWS & RATINGS ENGINE
- [x] **Task 25 (Backend):** Review Model with Verified Buyer Enforcement & calcAverageRatings static hooks
- [x] **Task 26 (Backend Test):** Supertest Review Verification Suite (non-buyer block test) & Postman Guide
- [x] **Task 27 (Frontend):** Customer Reviews & Star Distribution UI (ReviewList, ReviewForm, star distribution bars, verified badges)

---

## 🏬 SLICE 8: MERCHANT / SELLER CENTRAL PORTAL
- [x] **Task 28 (Backend):** Seller Store Management & Analytics APIs (GET /seller/analytics, CRUD with seller ownership IDOR checks)
- [x] **Task 29 (Backend Test):** Supertest Seller Authorization & IDOR Suite
- [x] **Task 30 (Frontend):** Seller Central Dashboard & Virtualized Inventory (KPI cards, trajectory chart, @tanstack/react-virtual table keeping DOM <800 nodes, Add Product modal)

---

## 🛡️ SLICE 9: PLATFORM ADMIN GOVERNANCE & AUDIT TRAIL (MODULE 06)
- [x] **Task 31 (Backend):** Platform Analytics (GMV) & Immutable Audit Logging Middleware (auditLogModel)
- [x] **Task 32 (Backend Test):** Supertest Admin Authorization Suite & Audit Log Persistence Tests
- [x] **Task 33 (Frontend):** Admin Console Feature Slice (Platform metrics, RBAC management table, Virtualized Audit Trail viewer)

---

## 🚀 SLICE 10: END-TO-END TESTING & PRE-DEPLOYMENT HARDENING
- [x] **Task 34 (Testing):** Playwright E2E Automated Browser Journeys (complete buyer & seller workflows)
- [x] **Task 35 (Security & Risk Register):** Full OWASP Security Audit (NoSQLi, XSS DOMPurify, Risk Register documentation)
- [x] **Task 36 (Production Readiness & Audit Gate):** Production Bundle Build, Asset Compression, Full-Spectrum Lighthouse 90+ Audit Gate (Performance, a11y, Best Practices, SEO), and Final Smoke Test
