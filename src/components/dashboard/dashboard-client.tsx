"use client";

import { Zap } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { formatPaiseToINR } from "@/lib/billing/pricing";

interface DashboardData {
  activeSubscriptionsCount: number;
  totalRevenuePaise: number;
  outstandingPaise: number;
  overdueInvoicesCount: number;
  overdueAmountPaise: number;
  subscriptionStatusDistribution: { name: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  recentPayments: {
    id: string;
    payment_number: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    invoice_number: string;
    customer_name: string;
  }[];
}

export function DashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [data, _setData] = useState<DashboardData>(initialData);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<string | null>(null);

  const handleRunBilling = async () => {
    setIsBillingRunning(true);
    setBillingResult(null);

    try {
      const res = await fetch("/api/billing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_date: new Date().toISOString().split("T")[0],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBillingResult(
          `Billing completed successfully! Processed: ${json.result.subscriptions_processed}, Invoices created: ${json.result.invoices_created}, Expired closed: ${json.result.subscriptions_closed}`,
        );
      } else {
        setBillingResult(`Billing error: ${json.error}`);
      }
    } catch (err: unknown) {
      setBillingResult(
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsBillingRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Finance & Subscriptions Overview
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time telemetry, automated billing runs, and revenue health
            metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunBilling}
            isLoading={isBillingRunning}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Run Billing Now</span>
          </Button>
        </div>
      </div>

      {billingResult && (
        <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/80 p-3 text-xs text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
          <span>{billingResult}</span>
          <button
            onClick={() => setBillingResult(null)}
            className="text-neutral-400 hover:text-neutral-900 text-xs font-mono ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Active Subscriptions
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
            {data.activeSubscriptionsCount.toLocaleString()}
          </div>
          <p className="text-xs text-neutral-500">Live recurring contracts</p>
        </div>

        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Revenue Received
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
            {formatPaiseToINR(data.totalRevenuePaise)}
          </div>
          <p className="text-xs text-neutral-500">
            Settled and confirmed payments
          </p>
        </div>

        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Amount Still Owed
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
            {formatPaiseToINR(data.outstandingPaise)}
          </div>
          <p className="text-xs text-neutral-500">Pending invoice balances</p>
        </div>

        <div className="rounded-md border border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-bold">
              Overdue Invoices
            </span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-900 dark:border-neutral-100">
              {data.overdueInvoicesCount} DUE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
            {formatPaiseToINR(data.overdueAmountPaise)}
          </div>
          <p className="text-xs text-neutral-500">Unpaid past terms deadline</p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Monthly Revenue Performance (₹)
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              Q3/Q4 2026
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth}>
                <XAxis
                  dataKey="month"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    formatPaiseToINR(Number(val) * 100),
                    "Revenue",
                  ]}
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#404040",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" fill="#262626" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Status Breakdown */}
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Subscription Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.subscriptionStatusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {data.subscriptionStatusDistribution.map((entry, index) => {
                    const grayscale = [
                      "#171717",
                      "#525252",
                      "#a3a3a3",
                      "#e5e5e5",
                    ][index % 4];
                    return (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={grayscale}
                        stroke="#000000"
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
            {data.subscriptionStatusDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{
                    backgroundColor: [
                      "#171717",
                      "#525252",
                      "#a3a3a3",
                      "#e5e5e5",
                    ][idx % 4],
                  }}
                />
                <span className="text-neutral-600 dark:text-neutral-400 capitalize">
                  {item.name}:
                </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments Feed */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Recent Manual Payment Settlements
            </h3>
            <p className="text-xs text-neutral-500">
              Direct ledger reconciliation records
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Invoice</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {data.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    No payment settlements logged yet.
                  </td>
                </tr>
              ) : (
                data.recentPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4 font-mono font-medium">
                      {p.payment_number}
                    </td>
                    <td className="py-3 px-4">{p.customer_name}</td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {p.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-[10px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {p.payment_date}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono">
                      {formatPaiseToINR(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
