import { Printer } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth/session";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PortalInvoicesPage() {
  const session = await requireAuth();
  const supabase = createAdminClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, status, issue_date, due_date, period_start, period_end,
      total_amount, amount_paid,
      subscriptions(subscription_number)
    `)
    .eq("customer_id", session.userId)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          My Invoices
        </h1>
        <p className="text-xs text-neutral-500">
          Billing statements and official tax invoice downloads
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Invoice #</th>
              <th className="py-2.5 px-4">Contract</th>
              <th className="py-2.5 px-4">Billing Range</th>
              <th className="py-2.5 px-4">Due Date</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Total</th>
              <th className="py-2.5 px-4 text-right">Balance Due</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {(invoices || []).length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-neutral-400">
                  No invoices issued yet.
                </td>
              </tr>
            ) : (
              (invoices || []).map((inv: any) => {
                const isOverdue =
                  inv.status === "confirmed" &&
                  inv.due_date < today &&
                  inv.total_amount > inv.amount_paid;
                const remaining = inv.total_amount - inv.amount_paid;

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4 font-mono font-medium">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {inv.subscriptions?.subscription_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                      {inv.period_start} &rarr; {inv.period_end}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {inv.due_date}
                    </td>
                    <td className="py-3 px-4">
                      {isOverdue ? (
                        <StatusBadge status="overdue" />
                      ) : (
                        <StatusBadge status={inv.status} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatPaiseToINR(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {remaining > 0 ? (
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {formatPaiseToINR(remaining)}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Paid</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/invoices/${inv.id}/print`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-xs font-mono hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Print</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
