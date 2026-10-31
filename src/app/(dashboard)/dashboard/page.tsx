import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  await requireAuth(["admin", "staff"]);
  const supabase = createAdminClient();

  const today = new Date().toISOString().split("T")[0];

  // Consolidated server-side aggregations avoiding N+1 queries
  const [
    activeSubsRes,
    allSubsStatusRes,
    revenueRes,
    outstandingRes,
    overdueRes,
    recentPaymentsRes,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabase.from("subscriptions").select("status"),

    supabase.from("payments").select("amount"),

    supabase
      .from("invoices")
      .select("total_amount, amount_paid")
      .eq("status", "confirmed"),

    supabase
      .from("invoices")
      .select("total_amount, amount_paid")
      .eq("status", "confirmed")
      .lt("due_date", today),

    supabase
      .from("payments")
      .select(`
        id, payment_number, amount, payment_method, payment_date,
        invoices(invoice_number),
        profiles(full_name, company_name)
      `)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const activeSubscriptionsCount = activeSubsRes.count || 0;

  // Compute total revenue
  const totalRevenuePaise = (revenueRes.data || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );

  // Compute outstanding balance
  const outstandingPaise = (outstandingRes.data || []).reduce(
    (sum, inv) =>
      sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)),
    0,
  );

  // Compute overdue count and amount
  const overdueInvoices = overdueRes.data || [];
  const overdueInvoicesCount = overdueInvoices.length;
  const overdueAmountPaise = overdueInvoices.reduce(
    (sum, inv) =>
      sum + (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)),
    0,
  );

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const s of allSubsStatusRes.data || []) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }
  const subscriptionStatusDistribution = Object.entries(statusCounts).map(
    ([name, count]) => ({
      name,
      count,
    }),
  );

  // Format recent payments
  const recentPayments = (recentPaymentsRes.data || []).map((p: any) => ({
    id: p.id,
    payment_number: p.payment_number,
    amount: p.amount,
    payment_method: p.payment_method,
    payment_date: p.payment_date,
    invoice_number: p.invoices?.invoice_number || "INV-—",
    customer_name:
      p.profiles?.company_name || p.profiles?.full_name || "Direct Client",
  }));

  // Demo revenue by month representation
  const revenueByMonth = [
    { month: "Jun", amount: Math.round(totalRevenuePaise * 0.12) / 100 },
    { month: "Jul", amount: Math.round(totalRevenuePaise * 0.18) / 100 },
    { month: "Aug", amount: Math.round(totalRevenuePaise * 0.22) / 100 },
    { month: "Sep", amount: Math.round(totalRevenuePaise * 0.26) / 100 },
    { month: "Oct", amount: Math.round(totalRevenuePaise * 0.22) / 100 },
  ];

  return (
    <DashboardClient
      initialData={{
        activeSubscriptionsCount,
        totalRevenuePaise,
        outstandingPaise,
        overdueInvoicesCount,
        overdueAmountPaise,
        subscriptionStatusDistribution,
        revenueByMonth,
        recentPayments,
      }}
    />
  );
}
