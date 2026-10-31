# Brightloop Software: Subscription Management System

A high-performance, enterprise-grade subscription and billing engine built for **Brightloop Software** during the 24-Hour Odoo Hackathon. The platform runs recurring billing from end to end: catalog products, variants, tiered plans, quotation templates, contract state-machine workflows, immutable point-in-time tax invoices, manual payment reconciliations, and an executive finance telemetry dashboard.

---

## 1. Technologies Used

- **Framework:** Next.js 16.4.3 (App Router, Turbopack, React Compiler, React 19.3.0, TypeScript Strict)
- **Styling:** Tailwind CSS v4 (Strict monochrome palette: black, white, neutral grays)
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security, Sequences, and PL/pgSQL billing engine)
- **Linter & Formatter:** Biome 2.4.2 (0 errors, 100% compliant)
- **Schema Validation:** Zod
- **Email Delivery:** Nodemailer (Direct SMTP integration with HTML invoice templates)
- **Data Visualization:** Recharts (Declarative revenue performance and status telemetry)
- **Icons:** Lucide React (Minimalist monochrome symbols)
- **Test Harness:** Vitest (Unit tests for pricing, taxes, discounts, date math, and timing-safe secrets)

---

## 2. Setup Guide From Scratch

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials, SMTP relay keys, and cron secret:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
CRON_SECRET=<your-secure-32-char-secret>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your-smtp-login>
SMTP_PASSWORD=<your-smtp-password>
EMAIL_FROM="Brightloop Software <billing@brightloop.local>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Database Migrations (In Order)
In your **Supabase Dashboard &rarr; SQL Editor**, paste and execute the files located in the `schema/` directory in sequence:
1. `schema/01_tables.sql` (Tables, constraints, sequences, and rate limiting)
2. `schema/02_indexes.sql` (Performance partial indexes for sub-2s response)
3. `schema/03_functions.sql` (Sequential numbering, state transitions, atomic discount checks, and the `run_billing()` engine)
4. `schema/04_rls.sql` (Enables Row Level Security on all tables with role-isolated policies)
5. `schema/05_triggers.sql` (Auth registration hook and automatic timestamp maintenance)
6. `schema/90_demo_data.sql` *(Optional benchmark dataset)*: Seeds core products, variants (e.g. Brand "Odoo" +₹560), plans, payment terms, discounts, and **10,000 subscriptions with 3,000 invoices and ~2,100 payments**.

### Step 4: Promote the First Admin Account
1. Start the app: `npm run dev`
2. Navigate to `http://localhost:3000/signup` and register your admin account.
3. In the Supabase SQL Editor, run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

---

## 3. External Systems Setup

### A. Supabase Authentication Settings
- Navigate to **Authentication &rarr; Providers &rarr; Email**:
  - Disable "Confirm email" if you wish users to log in immediately upon registration (recommended for hackathon evaluations).
  - Enable "Secure email change" and set minimum password length to 9 characters.

### B. SMTP Configuration in Supabase & Brevo
- To deliver password reset emails: Configure SMTP settings in **Supabase Dashboard &rarr; Project Settings &rarr; Auth &rarr; SMTP Settings** using Brevo or your preferred SMTP host.
- For recurring invoice dispatch to clients: Ensure the `SMTP_*` variables in `.env.local` match your SMTP provider.

### C. Cloudflare Scheduled Cron Worker
Set up a Cloudflare Cron Trigger (or GitHub Action / cron-job.org) to hit the billing endpoint daily:
- **Target URL:** `https://your-domain.com/api/cron/billing`
- **HTTP Method:** `POST`
- **Header:** `Authorization: Bearer <CRON_SECRET>`

---

## 4. Roles and Access Control Matrix

| Role | Accessible Sections | Core Permissions |
|---|---|---|
| **Admin** | Full System | Manages products, variants, plans, payment terms, taxes, discounts, quotation templates, provisions internal staff accounts, triggers on-demand billing runs, and reviews audit logs. |
| **Staff** | Operations | Manages customer records, creates subscriptions and quotations, confirms/cancels invoices, sends invoice emails via SMTP, prints invoices, records manual payments, and monitors the finance dashboard. Read-only catalog access. |
| **Customer** | Portal | View own subscriptions, invoices, and payments. Ability to pause, renew, or close active subscriptions (governed by plan rules). Update profile and password. |

---

## 5. Security Architecture

1. **Zero-Trust Access Control:** Route Handlers, Server Actions, and data functions verify session identity and role permissions independently. We do not rely on proxy/middleware alone for security.
2. **Deterministic Role Assignment:** Sign up always assigns the `customer` role through an immutable PostgreSQL database trigger. Role escalation via user metadata is blocked. Only an Admin using the server-only `SUPABASE_SERVICE_ROLE_KEY` can provision Staff accounts.
3. **Database-Level Row Level Security (RLS):** Enabled across **100% of tables**. Customers can only select records matching `customer_id = auth.uid()`.
4. **Timing-Safe Cryptography:** `CRON_SECRET` evaluation in `/api/cron/billing` uses Node.js `crypto.timingSafeEqual` with buffer length equalization to protect against timing attacks.
5. **No Dangerous HTML:** React JSX escaping enforced everywhere; zero usage of `dangerouslySetInnerHTML`.
6. **Rate Limiting:** Backed by an atomic PostgreSQL sliding window table (`rate_limits`) covering login, registration, and password recovery.
7. **Monochrome Design Compliance:** Strictly avoids color-only status coding. Statuses (Draft, Confirmed, Paid, Overdue, Active, Paused, Closed) are rendered with distinct gray tones, outlines, typographic weights, and symbolic markers (`○`, `•`, `◉`, `●`, `⏸`, `■`, `✓`, `!`).

---

## 6. Assumptions

- **Currency:** All monetary values are handled as whole integers in paise (₹1 = 100 paise) to prevent floating-point inaccuracies.
- **Tax Model:** Prices are exclusive of tax. Tax is applied on the discounted line base. Stacking taxes (e.g. CGST 9% + SGST 9%) are supported.
- **Subscription Pausing:** Pausing freezes billing and shifts the subscription expiry date and next billing date forward by the exact paused duration when resumed.
- **Renewal:** Extends the existing subscription record by one full billing cycle.
- **Payment Gateway:** Manual settlement recording (Bank Transfer, Cash, Cheque, UPI, Other) against confirmed invoices.

---

## 7. Demo Checklist Verification

- [x] **Weak passwords rejected:** Enforced on client form and validated with Zod on the server ($\ge 9$ chars, uppercase, lowercase, special character).
- [x] **Case-insensitive email uniqueness:** `Ivana@x.com` and `ivana@x.com` normalized to lowercase before database query and insertion.
- [x] **Single-use reset link:** Handled via Supabase Auth recovery tokens.
- [x] **Customer record isolation:** Opening another customer's invoice or subscription ID returns `404 Not Found`.
- [x] **Staff creation authorization:** Attempting to create a staff account without an Admin session returns `403 Forbidden`.
- [x] **Idempotent billing run:** Executing `run_billing()` multiple times produces zero duplicate invoices due to `UNIQUE(subscription_id, period_start)`.
- [x] **Payment balance cap:** Attempting to record a payment exceeding the invoice balance is rejected atomically.
- [x] **Discount usage limit:** Atomic decrement blocks discount application after the usage quota is exhausted; cancelled invoices restore the quota.
- [x] **10,000+ benchmark performance:** Dashboard queries execute in sub-2-second response times using partial indexes on active contracts and overdue invoices.
