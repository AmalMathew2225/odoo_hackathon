# Security Notes & Research

**Date:** 31 October 2026  
**Project:** Brightloop Software — Subscription Management System  
**Framework:** Next.js 16.4.3 (App Router), React 19.3.0, Supabase, Postgres  

---

## 1. Next.js and React Security Analysis

### A. Advisories & Vulnerabilities Evaluated
* **CVE-2026-64641 (Server Actions Denial of Service):**
  * **Summary:** Specially crafted HTTP requests hitting Next.js App Router applications with Server Actions could force excessive CPU consumption in the Node.js event loop, resulting in DoS.
  * **Affected Versions:** Next.js $\ge 13.0.0$ and $< 15.5.21$, $\ge 16.0.0$ and $< 16.2.11$.
  * **Status in this project:** Next.js `16.4.3` is installed, which is well above `16.2.11` and includes the complete fix.

* **CVE-2026-64642 (Middleware / Proxy Bypass):**
  * **Summary:** Under specific routing/segment-prefetch and config configurations, incoming requests could bypass middleware/proxy evaluation, skipping authentication or access controls placed exclusively in the proxy layer.
  * **Affected Versions:** Next.js $< 15.5.21$ and $< 16.2.11$.
  * **Status in this project:** Patched in `16.4.3`.

### B. Framework Architectural Rules Followed
1. **Zero-Trust Server Boundary:** We do **NOT** rely on `proxy.ts` (Next.js 16 middleware) as the sole gatekeeper for authenticated routes or data access. Every Server Action, Route Handler (`/api/*`), and Data Access Layer function independently verifies session authentication and role permissions.
2. **Server Actions Attack Surface:** In Next.js 16, `'use server'` functions expose an external POST endpoint. We treat every Server Action input as untrusted:
   * Always validate arguments with **Zod** on the server.
   * Verify the caller's identity and role using Supabase Auth server client before executing mutations.
   * Return typed, safe Data Transfer Objects (DTOs) rather than internal database representations.
3. **Encrypted Action IDs & CSRF:** Next.js 16 enforces strict Origin-vs-Host validation for Server Action POST requests and encrypts action IDs and closure variables.

---

## 2. Supabase & PostgreSQL Security Architecture

### A. Row Level Security (RLS)
* **RLS Enabled on Every Table:** No exceptions. `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` is applied to every single table created.
* **Deny-by-Default:** Without an explicit policy, PostgreSQL rejects all operations.
* **Role-Based Separation:**
  * `anon`: Restricted strictly to public sign-up or verification if needed; zero access to core financial, subscription, or customer records.
  * `authenticated`: Scoped via RLS policies so customers can **only** select and update their own records (`customer_id = auth.uid()`).
  * `service_role`: Used exclusively on the server side (never sent to client) for administrative operations, staff account provisioning, and automated cron billing.

### B. Safe Profile Creation & Role Assignment
* **The Vulnerability:** Storing user role in client-editable user metadata (`auth.users.raw_user_meta_data`) allows attackers to elevate privileges by sending a modified payload during sign up or profile update.
* **Our Defense:**
  1. A dedicated `profiles` table stores user roles (`customer`, `staff`, `admin`).
  2. A PostgreSQL trigger `ON auth.users AFTER INSERT` automatically provisions a profile with `role = 'customer'`.
  3. The `role` column cannot be updated by normal authenticated users (enforced by RLS and database triggers).
  4. Only an Admin via Server Action using the `SUPABASE_SERVICE_ROLE_KEY` can promote or create Staff accounts.

### C. Server-Only Functions & Database Integrity
* Functions like `run_billing()` and `apply_discount_atomic()` are marked `SECURITY DEFINER` with search paths strictly set (`SET search_path = public`).
* Execution rights (`REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated`) ensure that client-side Supabase callers cannot invoke billing or administrative routines directly.
* All financial transactions (e.g. billing run, payment recording, discount decrement) run inside atomic database transactions (`BEGIN ... COMMIT`) with `FOR UPDATE SKIP LOCKED` to prevent race conditions and double-billing.

### D. Supabase Free Plan Operational Safeguards
* **500 MB Storage Constraint:** Data types are optimized (integers, paise for currency, targeted indexes, no duplicate file blobs).
* **Project Pausing (7 Days Inactivity):** The daily Cloudflare cron billing trigger pings the endpoint regularly, keeping the Supabase database warm and active.
* **Email Rate Limiting (Supabase Auth built-in limit):** Password reset and invoice sending use direct SMTP configuration via Nodemailer to prevent hitting Supabase's low free-tier email quotas.

---

## 3. OWASP Top 10 (2025/2026) Defense Matrix

| OWASP Vulnerability | Risk Scenario | App Defense / Implementation |
|---|---|---|
| **A01: Broken Access Control** | Customer changes ID in URL to view another's invoice; Staff tries to create staff account. | 1. RLS policies enforce `customer_id = auth.uid()`.<br>2. Route Handlers & Server Actions check `profile.role`.<br>3. URLs with unauthorized IDs return `404 Not Found` (no existence leakage). |
| **A02: Cryptographic Failures** | Exposing `SUPABASE_SERVICE_ROLE_KEY` or weak password hashing. | 1. Environment variables validated with Zod at startup. Service role key never has `NEXT_PUBLIC_` prefix.<br>2. Passwords handled by Supabase Auth (Argon2 / bcrypt) with strict complexity rules ($\ge 9$ chars, uppercase, lowercase, special char).<br>3. `CRON_SECRET` verified using Node.js `crypto.timingSafeEqual` to prevent timing attacks. |
| **A03: Injection** | SQL injection in billing or search; XSS in notes/names. | 1. Supabase JS parameterized queries and PL/pgSQL parameterized functions. Zero concatenated SQL.<br>2. Strict React JSX escaping; `dangerouslySetInnerHTML` is prohibited.<br>3. Content Security Policy (CSP) headers applied. |
| **A04: Insecure Design** | Double-billing active subscriptions; overpaying invoices. | 1. `UNIQUE (subscription_id, period_start)` constraint makes duplicate invoices mathematically impossible.<br>2. Payment recording verifies remaining balance atomically: `amount_paid + new_payment <= total_amount`.<br>3. Allowed subscription status transitions strictly defined in a finite-state machine lookup. |
| **A05: Security Misconfiguration** | Missing security headers; detailed stack traces leaked in production. | 1. Next.js response headers configure CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.<br>2. Production error boundary returns generic sanitized error messages. |
| **A06: Vulnerable & Outdated Components** | Using packages with known CVEs. | 1. `npm audit` executed: 0 vulnerabilities found.<br>2. Next.js is version `16.4.3`, safely beyond the July 2026 patches. |
| **A07: Identification & Authentication Failures** | Credential stuffing, brute force on login/reset. | 1. PostgreSQL counter table `rate_limits` enforces IP/email sliding window limits for auth endpoints.<br>2. Password reset uses generic messaging ("If that email exists, we sent a link") to prevent user enumeration.<br>3. Token stored in secure HttpOnly cookies via `@supabase/ssr`. |
| **A08: Software & Data Integrity Failures** | Untrusted code updates; unverified cron payloads. | 1. Webhook/cron endpoint validates secret header via timing-safe check.<br>2. Audit log table (`audit_logs`) is append-only (`REVOKE UPDATE, DELETE`). |
| **A09: Security Logging & Monitoring Failures** | Unauthorized actions unnoticed. | Dedicated `audit_logs` table records actor ID, role, action, target entity, metadata, and timestamp. |
| **A10: Server-Side Request Forgery (SSRF)** | Arbitrary webhook/email requests. | No arbitrary user-supplied URLs fetched server-side; SMTP credentials statically sourced from `.env.local`. |

---

## 4. Package & Dependency Audit

* `npm audit` returned **0 vulnerabilities**.
* Core Dependencies:
  * `next`: `16.4.3` (Secure LTS release, patches CVE-2026-64641 and CVE-2026-64642).
  * `react` & `react-dom`: `19.3.0`.
  * `@tailwindcss/turbopack` & `tailwindcss`: `^4`.
  * `@biomejs/biome`: `2.4.2` for linting and formatting.
* Planned Additions (all free, audited, standard OSS):
  * `@supabase/supabase-js` and `@supabase/ssr` (official Supabase client & cookie auth handler).
  * `zod` (type validation and runtime parsing).
  * `lucide-react` (clean monochrome UI icons).
  * `recharts` (declarative data visualization for the finance dashboard).
  * `nodemailer` & `@types/nodemailer` (direct SMTP email delivery).
  * `vitest` (fast unit testing for pricing and billing math).

