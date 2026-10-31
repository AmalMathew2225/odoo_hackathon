import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/badge";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { SubscriptionsClient } from "./subscriptions-client";

export const dynamic = "force-dynamic";

interface SubscriptionsPageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  await requireAuth(["admin", "staff"]);
  const params = await searchParams;

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 25;
  const statusFilter = params.status || "";
  const searchQuery = params.search || "";

  const supabase = createAdminClient();

  // Fetch dropdown options for modal
  const [customersRes, plansRes, productsRes, termsRes, taxesRes, discountsRes] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, company_name, email").eq("role", "customer").limit(50),
      supabase.from("plans").select("id, name, code, price, billing_period").eq("is_active", true),
      supabase.from("products").select("id, name, sales_price, product_variants(id, name, value, extra_price)").eq("is_active", true),
      supabase.from("payment_terms").select("id, name, days").eq("is_active", true),
      supabase.from("taxes").select("id, name, rate_percent").eq("is_active", true),
      supabase.from("discounts").select("id, code, description, type, value").eq("is_active", true),
    ]);

  // Build paginated subscription query
  let query = supabase
    .from("subscriptions")
    .select(`
      id, subscription_number, status, start_date, expiry_date, next_billing_date,
      profiles(full_name, company_name, email),
      plans(name, billing_period),
      subscription_lines(unit_price, quantity, amount, products(name))
    `, { count: "exact" });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.ilike("subscription_number", `%${searchQuery}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: subscriptions, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <SubscriptionsClient
      subscriptions={(subscriptions || []) as any[]}
      page={page}
      totalPages={totalPages}
      totalCount={count || 0}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
      customers={customersRes.data || []}
      plans={plansRes.data || []}
      products={productsRes.data || []}
      terms={termsRes.data || []}
      taxes={taxesRes.data || []}
      discounts={discountsRes.data || []}
    />
  );
}
