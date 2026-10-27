# Project Operational Context Summary (Cache)

This cached summary encapsulates the architectural, operational, security, performance, and testing rules extracted from `AI-Rules/00-Master-Workflow.md` through `AI-Rules/04-Testing-Rules.md` and `AGENTS.md`.

---

## 1. Project Identity & Architecture
- **Project Type:** Full-Stack E-commerce Platform (Amazon clone).
- **Scope Model:** Vertical Slicing (Feature-by-Feature: Backend API/Schema -> Automated Test -> Postman Test -> Frontend UI/React Query -> Component Test -> Manual Browser Test -> Security Check -> Next Task).
- **Architectural Layout:** Extended 3-Tier Monorepo:
  - `./frontend/`: Vite + React SPA client.
  - `./backend/`: Node.js + Express + Mongoose MVC API server.
  - `./tests/`: Root-level test suites (E2E with Playwright, cross-cutting integration, fixtures).
  - `./AI-Rules/`: Governance & workflow instructions.
  - `./inputs/`: User reference documents, specifications, or data sources.

---

## 2. Technology Stack Standards

### Frontend (`frontend/src/`)
- **Core:** React 18+, Vite.
- **Routing:** `react-router-dom` (v6+) with nested layouts & `<Outlet/>`.
- **Data Fetching & Server State:** `@tanstack/react-query` (NEVER use `useEffect`/`useState` for API fetching).
- **UI State:** React Context API (restricted to global UI concerns like Dark Mode).
- **Forms:** `react-hook-form` (uncontrolled inputs via `register`).
- **Styling:** Tailwind CSS with centralized CSS variables in `src/styles/index.css`.
- **UI Design System:** Impeccable UI primitives styled via Tailwind CSS.
- **Icons:** `react-icons/hi2` (Heroicons 2).
- **Toasts:** `react-hot-toast` (`<Toaster/>` mounted once globally).
- **Charts:** `recharts` (Light/Dark mode adaptive).
- **Dates:** `date-fns` (strictly no Moment.js or Day.js).
- **Animations:** `gsap` and `@gsap/react` scoped within `useGSAP()` (strictly compositor-only: `transform` and `opacity`).
- **Error Boundaries:** `react-error-boundary` with dedicated fallback UI wrapping top-level layouts and features.
- **List Virtualization:** `@tanstack/react-virtual` for large datasets to enforce flat DOM architecture (< 800 nodes per view, depth < 32).
- **Core Web Vitals:** Explicit `width`/`height` on images (WebP/AVIF), font preloading with `font-display: swap`, initial JS bundle budget < 150KB.

### Backend (`backend/`)
- **Runtime & Framework:** Node.js & Express.js.
- **Database & ODM:** MongoDB & Mongoose ("Fat Models, Skinny Controllers").
- **Core Utilities:** `dotenv`, `morgan` (dev logging), `cors`, `helmet`, `compression` (Gzip/Brotli payload compression), `express.json({ limit: '10kb' })`.
- **Authentication & Security:** `bcryptjs`, `jsonwebtoken` (HttpOnly cookies), `validator`, OAuth 2.0 (Google/GitHub where applicable).
- **Email:** `nodemailer` (transactional emails, password reset tokens).
- **Performance & Cache:** Redis caching (Cache-Aside, TTL, LRU eviction), compound database indexes on high-frequency query fields, `.lean()` appended to all read-only queries, latency budget < 300ms.
- **Patterns:** Reusable `handlerFactory.js`, generic `APIFeatures.js`, custom `AppError.js`, higher-order `catchAsync.js`, centralized `errorController.js`.

---

## 3. Strict Forbidden Practices
- ❌ **NO** writing application code during Phase A (Planning), Phase B (UI Prototyping), or Phase C (Task Breakdown).
- ❌ **NO** combining multiple tasks into a single turn during Phase D.
- ❌ **NO** proceeding to the next task without user manual verification (Browser / Postman) and passing security/testing checks.
- ❌ **NO** `try/catch` blocks inside Express controllers (all async methods wrapped in `catchAsync`).
- ❌ **NO** storing JWT access tokens in `localStorage` or `sessionStorage` (strictly HttpOnly, Secure, SameSite cookies).
- ❌ **NO** hardcoded hex colors or arbitrary CSS values (use CSS variables and Tailwind tokens).
- ❌ **NO** "div soup" or non-semantic HTML.
- ❌ **NO** blank loading screens or missing empty states.
- ❌ **NO** committed secrets, API keys, or `.env` files.
- ❌ **NO** direct DB calls from React UI components (UI -> React Query -> `src/services/` -> REST API).
- ❌ **NO** layout thrashing (forced synchronous reflows) or non-composited animations (only `transform` and `opacity`).
- ❌ **NO** missing explicit `width` & `height` dimensions on images.

---

## 4. Security Rules & Triggered Modules (03-Security-Rules.md)
- **Mandatory Baseline:** Schema-based server-side validation/sanitization, DOMPurify for HTML sanitization, bcrypt password hashing, HTTPS/HSTS, HttpOnly cookies, session fixation prevention (regenerate token on login), CSRF token defense, Helmet headers, restrictive CORS, sanitized production errors.
- **Triggered Modules for E-Commerce:**
  - **Module 01 (Granular Access Control):** RBAC (Customer, Seller, Admin), IDOR prevention, MFA for Admin tiers.
  - **Module 02 (Secure File Processing):** Product images & user avatars with magic byte checks, malware scanning, size limits, Cloudinary/S3 storage.
  - **Module 03 (Scalability & Abuse):** Rate limiting (login/checkout), connection pooling, async jobs for emails.
  - **Module 04 (Transactional Consistency):** Idempotency-Keys for orders/payments, MongoDB ACID sessions for order placement & inventory decrement.
  - **Module 05 (Resilient Integrations):** Circuit breakers, timeouts, exponential backoff for payment gateway (e.g., Stripe) and email services.
  - **Module 06 (Comprehensive Auditing):** Immutable audit logs for payments, refunds, role updates, and inventory alterations.
  - **Module 07 (Risk Register):** Documented Likelihood x Impact matrix with assigned mitigations.

---

## 5. Testing Framework & Quality Gates (04-Testing-Rules.md)
- **Static Quality:** TypeScript / strict linting, ESLint rules, automated `npm audit` / dependency vulnerability check.
- **Unit Testing:** Vitest/Jest for utilities, business logic, calculations, custom hooks (Min 80% coverage).
- **Integration Testing:** Supertest + in-memory MongoDB for API endpoints and database hooks.
- **Component Testing:** React Testing Library for UI components and user interactions.
- **E2E Testing:** Playwright for complete critical buyer/seller journeys (browse -> cart -> checkout -> payment -> order tracking).
- **Core Web Vitals & Performance Auditing:** Lighthouse CI (LHCI) runs or automated benchmarks enforcing:
  - LCP < 2.5s
  - CLS < 0.1
  - INP < 200ms
  - FCP < 1.8s
  - Strict minimum performance score: **90/100**.
- **Fixtures & Doubles:** Deterministic test data in `tests/fixtures/`, mocks for external APIs (Stripe, Nodemailer).

---

## 6. Phase Execution Flow (00-Master-Workflow.md)
1. **Phase A:** Planning, Architecture, Personas, Edge Cases, Database Schema, Construction Tree approval.
2. **Phase B:** Standalone HTML UI Prototypes (`ui-prototypes/*.html`) with Tailwind CDN, Lucide Icons, GSAP animations, Live Preview, and strict user approval gate ("UI Approved").
3. **Phase C:** Task Breakdown using Vertical Slicing (Feature-by-Feature), generate physical `TASKS LIST.md` upon approval.
4. **Phase D:** Atomic Task Implementation Loop:
   - **Database First-Touch Protocol (Conditional MongoDB Atlas Gate):** On first persistence/model task with MongoDB, guide user through MongoDB Atlas setup and confirm cloud URI in `config.env`.
   - Implement 1 task -> AI Automated Test -> User Test Gate (Browser / Postman click-by-click) -> Security Check -> Mark `[x]` in `TASKS LIST.md` -> Wait for permission.
5. **Phase E:** Git & GitHub integration on `main` branch with semantic tagging.
6. **Phase F:** Production build, Smoke testing, Comprehensive Production Audit Gate (Lighthouse Full-Spectrum: Performance 90+, Accessibility 90+, Best Practices 90+, SEO 90+), and zero-knowledge deployment guide.
