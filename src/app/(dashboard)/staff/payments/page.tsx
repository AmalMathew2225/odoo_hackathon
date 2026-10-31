import { requireAuth } from "@/lib/auth/session";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface PaymentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  await requireAuth(["admin", "staff"]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 25;

  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: payments, count } = await supabase
    .from("payments")
    .select(
      `
      id, payment_number, amount, payment_method, payment_date, note, created_at,
      profiles(full_name, company_name, email),
      invoices(invoice_number)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const _totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Payment Settlements
        </h1>
        <p className="text-xs text-neutral-500">
          {(count || 0).toLocaleString()} manual settlement transactions on file
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Settlement Date</th>
                <th className="py-2.5 px-4">Note</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {(payments || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No payment records logged.
                  </td>
                </tr>
              ) : (
                (payments || []).map((p: any) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4 font-mono font-medium">
                      {p.payment_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {p.profiles?.company_name ||
                          p.profiles?.full_name ||
                          "—"}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {p.profiles?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {p.invoices?.invoice_number || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 font-mono text-[10px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {p.payment_date}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {p.note || "—"}
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
