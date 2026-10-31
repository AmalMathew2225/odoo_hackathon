import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    if (session.role === "admin" || session.role === "staff") {
      redirect("/dashboard");
    } else {
      redirect("/portal/subscriptions");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 sm:px-12 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wider uppercase">
            BRIGHTLOOP
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            / SUBSCRIPTION MANAGEMENT
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-3xl space-y-6">
          <span className="inline-block rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 font-mono text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
            Odoo Hackathon 2026 Production System
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-neutral-950 dark:text-neutral-50">
            One Unified Platform for Subscription Billing
          </h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 dark:text-neutral-400 sm:text-lg">
            Manage product variants, automated recurring billing runs,
            quotations, immutable taxed invoices, manual payment reconciliation,
            and real-time finance metrics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded bg-neutral-900 dark:bg-neutral-100 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
            >
              Customer Portal Sign Up
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded border border-neutral-300 dark:border-neutral-700 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              Internal Staff Login &rarr;
            </Link>
          </div>
        </div>

        {/* System Capabilities Grid */}
        <div className="mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-2">
            <span className="font-mono text-xs text-neutral-400">
              01 / ARCHITECTURE
            </span>
            <h3 className="font-semibold text-sm">
              Deterministic Paise Currency
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Monetary values stored as whole numbers in paise. Zero
              floating-point drift with half-up rounding.
            </p>
          </div>
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-2">
            <span className="font-mono text-xs text-neutral-400">
              02 / AUTOMATION
            </span>
            <h3 className="font-semibold text-sm">Atomic Billing Engine</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              PostgreSQL <code className="font-mono">run_billing()</code>{" "}
              function with <code className="font-mono">SKIP LOCKED</code> and
              unique period constraints for zero double-billing.
            </p>
          </div>
          <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-2">
            <span className="font-mono text-xs text-neutral-400">
              03 / PERFORMANCE
            </span>
            <h3 className="font-semibold text-sm">10,000+ Record Sub-2s SLA</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Targeted partial indexes on active contracts and overdue invoices
              ensure instantaneous dashboard aggregations.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-400 font-mono">
        Brightloop Software &bull; 24-Hour Odoo Hackathon Track &bull; 31
        October 2026
      </footer>
    </div>
  );
}
