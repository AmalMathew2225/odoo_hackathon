import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvoicesClient } from "./invoices-client";

export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  await requireAuth(["admin", "staff"]);
  const params = await searchParams;

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 25;
  const statusFilter = params.status || "";
  const searchQuery = params.search || "";

  const supabase = createAdminClient();

  let query = supabase
    .from("invoices")
    .select(`
      id, invoice_number, status, issue_date, due_date, period_start, period_end,
      subtotal, tax_amount, discount_amount, total_amount, amount_paid, sent_at,
      profiles(full_name, company_name, email),
      subscriptions(subscription_number)
    `, { count: "exact" });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.ilike("invoice_number", `%${searchQuery}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: invoices, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <InvoicesClient
      invoices={(invoices || []) as any[]}
      page={page}
      totalPages={totalPages}
      totalCount={count || 0}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
    />
  );
}
