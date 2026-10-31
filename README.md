# Subscription Management System

One unified platform to run plans, subscriptions and recurring billing in one place, built for the fictional company **Brightloop Software**. It covers the full life of a subscription business: products and plans, quotations, subscriptions, invoices, discounts, payments and revenue reporting.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend + backend | Next.js |
| Auth | Supabase Auth (email + password, password reset link) |
| Database | Supabase Postgres |
| Data security | Postgres Row Level Security (RLS) |
| Scheduled billing | Supabase `pg_cron` / Edge Function, or Vercel Cron hitting an API route |
| Email | Custom SMTP (e.g. Resend) for reset links and invoice emails |
| Hosting | Vercel (app) + Supabase (database and auth) |

Optional extras: Tailwind CSS + shadcn/ui, Zod, Recharts, Drizzle or Prisma.

---

## Roles

| Role | Access |
|---|---|
| **Admin** | Full system: staff creation, taxes, discounts, products, plans, everything |
| **Internal staff** | Day-to-day work with limited access (customers, quotations, subscriptions, invoices, payments). No tax, discount or user management |
| **Customer** | Portal showing only their own subscriptions and invoices |

Only the admin can add a new staff member. Customers sign up on their own.

---

## Features

### 1. Authentication
- Sign up with email and password
- One account per email
- Password must be more than 8 characters, with an uppercase letter, a lowercase letter and a special character
- Forgot password: reset link sent to the registered email
- Role-based access (admin, staff, customer)

### 2. Products
- Name, type, sales price, cost price, notes
- Variants with price add-ons (e.g. choosing the Odoo brand adds 560)

### 3. Plans
- Price and billing period: daily, weekly, monthly or yearly
- Minimum quantity
- Availability dates
- Per-plan options set by the admin: auto-close on end, close early, pause, renew

### 4. Quotation Templates
- Prefilled plan and product lines
- Valid for a set number of days
- Used by sales to create quotations quickly

### 5. Subscriptions
- Unique subscription number
- Customer, plan, start date, expiry date, payment terms
- Order lines: product, quantity, unit price, taxes, amount
- Status flow:

```
Draft -> Quotation -> Confirmed -> Active -> Closed
```

### 6. Invoices
- Created automatically from subscriptions with customer details, product lines, taxes and totals filled in
- Taxes calculated from rules set by the admin
- Staff can confirm, cancel, send or print any invoice
- Status flow:

```
Draft -> Confirmed -> Paid        (Cancel possible)
```

- Nothing is billed twice or skipped

### 7. Discounts (admin only)
- Fixed amount or percentage
- Minimum purchase or minimum quantity
- Start and end dates
- Usage limit
- Applies to specific products or whole subscriptions
- Appears automatically on the next invoice and stops when it expires or runs out

### 8. Payments
- Recorded with method, amount, date and note
- Linked to the correct invoice
- Team can see which invoices are paid and which are outstanding, so overdue ones can be chased
- Payments are recorded manually; no payment gateway is required

### 9. Finance Dashboard
- Active subscriptions
- Revenue received and amount still owed
- Payments
- Overdue invoices
- Filters and a summary view

### 10. Customer Portal
- Own subscriptions: plan, status, start and expiry dates, order lines
- Own invoices: status, totals, view and print
- Payment history and outstanding amount
- Pause, renew or close a subscription where the plan allows it
- Profile and password reset

---

## Workflow

### One-time setup
1. The first admin is created by a seed script (it cannot come from the signup page)
2. Admin logs in and sets up taxes and payment terms
3. Admin adds products with variants, then plans, discount rules and quotation templates
4. Admin creates staff accounts

### Customer onboarding
5. Customer signs up and logs in to the portal (empty at first)
6. Staff creates a quotation from a template (subscription in **Draft**, then **Quotation**)
7. After the customer agrees: **Confirmed**, then **Active** on the start date
8. The subscription appears in the customer's portal

### Monthly loop
9. **Billing day:** a scheduled job finds every Active subscription that is due and creates its invoice with lines, taxes and any valid discount
10. Staff confirm and send invoices; customers see them in the portal
11. Payment arrives; staff record it and the invoice becomes **Paid**
12. Unpaid invoices past their due date show as **overdue** and are chased
13. The finance lead reviews the dashboard
14. Repeat from step 9 until the subscription expires and closes, or is closed early, paused or renewed

---

## Key Design Decisions

- **Idempotent billing:** a unique constraint on subscription + billing period guarantees one invoice per period, even if the job runs twice
- **Money stored as integers** (paise or cents), never floats
- **Billing and discount logic** runs in Postgres functions or server code inside transactions, so discount usage limits and "never bill twice" are enforced reliably
- **Data isolation in the backend:** RLS ensures customers can only read their own subscriptions and invoices
- **Staff creation** runs on the server with the Supabase service-role key, never in the browser
- **Performance target:** every page responds in under 2 seconds with thousands of subscriptions (pagination, indexes, aggregate queries for the dashboard)
- A `profiles` table stores each user's role

---

## Getting Started

### Prerequisites
- Node.js
- A Supabase project
- An SMTP provider (e.g. Resend)

### Environment variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
CRON_SECRET=
```

### Run locally

```
npm install
npm run dev
```

### First admin

Run the seed script to create the first admin account, then log in and create staff from the admin panel.

---

## About Brightloop Software

Brightloop sells business software on subscription, billed monthly or yearly, with add-ons customers can switch on and off and products that come in variants. Before this system, subscriptions lived in a spreadsheet, renewals were missed, invoices were typed by hand, payments were matched by scrolling bank statements, and revenue reports were built manually each quarter. This platform replaces all of that.