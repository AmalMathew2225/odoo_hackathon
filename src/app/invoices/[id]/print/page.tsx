import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { getCurrentSession } from "@/lib/auth/session";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const instant = false;

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePrintPage({ params }: PrintPageProps) {
  const session = await getCurrentSession();
  if (!session) {
    notFound();
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles(full_name, company_name, email, phone),
      subscriptions(subscription_number)
    `)
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  // Broken Access Control check: Customer can ONLY see their own invoice!
  if (session.role === "customer" && invoice.customer_id !== session.userId) {
    notFound(); // Return 404, never leak existence
  }

  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", id);

  const customer = invoice.profiles;
  const _isPaid =
    invoice.status === "paid" || invoice.amount_paid >= invoice.total_amount;

  return (
    <div className="min-h-screen bg-white text-black p-8 sm:p-12 font-sans max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print flex justify-between items-center pb-6 mb-6 border-b border-neutral-200">
        <span className="text-xs font-mono uppercase text-neutral-500">
          Print Preview / Browser PDF Engine
        </span>
        <PrintButton />
      </div>

      {/* Invoice Document Shell */}
      <div className="border border-neutral-300 p-8 sm:p-10 rounded-sm">
        {/* Header */}
        <div className="flex justify-between items-start pb-8 border-b-2 border-neutral-900">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase">
              BRIGHTLOOP SOFTWARE
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Enterprise Subscription & Operations Management
            </p>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Bangalore, Karnataka, India &bull; GSTIN: 29AABCU9603R1ZX
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono uppercase text-neutral-400 block">
              TAX INVOICE
            </span>
            <div className="text-xl font-bold font-mono">
              {invoice.invoice_number}
            </div>
            <div className="mt-1">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Client & Period Metadata */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-neutral-200 text-xs">
          <div>
            <span className="font-mono uppercase text-neutral-400 block mb-1">
              Billed To:
            </span>
            <div className="font-bold text-sm text-neutral-900">
              {customer?.company_name || customer?.full_name}
            </div>
            {customer?.company_name && customer?.full_name && (
              <div className="text-neutral-600">{customer.full_name}</div>
            )}
            <div className="text-neutral-600 font-mono">{customer?.email}</div>
            {customer?.phone && (
              <div className="text-neutral-600">{customer.phone}</div>
            )}
          </div>

          <div className="text-right space-y-1 font-mono">
            <div>
              <span className="text-neutral-400">Contract Reference: </span>
              <span className="font-semibold">
                {invoice.subscriptions?.subscription_number}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Issue Date: </span>
              <span>{invoice.issue_date}</span>
            </div>
            <div>
              <span className="text-neutral-400">Due Date: </span>
              <span className="font-semibold">{invoice.due_date}</span>
            </div>
            <div>
              <span className="text-neutral-400">Billing Period: </span>
              <span>
                {invoice.period_start} to {invoice.period_end}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs my-6 border-collapse">
          <thead>
            <tr className="border-b border-neutral-900 text-neutral-500 uppercase font-mono text-[10px]">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Rate</th>
              <th className="py-2 text-right">Discount</th>
              <th className="py-2 text-right">Tax (Rate)</th>
              <th className="py-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-mono">
            {(lines || []).map((l) => (
              <tr key={l.id}>
                <td className="py-3 font-sans">
                  <div className="font-bold text-neutral-900">
                    {l.product_name}
                  </div>
                  {l.variant_name && (
                    <div className="text-[11px] text-neutral-500">
                      {l.variant_name}
                    </div>
                  )}
                </td>
                <td className="py-3 text-center">{l.quantity}</td>
                <td className="py-3 text-right">
                  {formatPaiseToINR(l.unit_price)}
                </td>
                <td className="py-3 text-right">
                  {l.discount_amount > 0
                    ? `-${formatPaiseToINR(l.discount_amount)}`
                    : "—"}
                </td>
                <td className="py-3 text-right">
                  {formatPaiseToINR(l.tax_amount)} ({l.tax_rate}%)
                </td>
                <td className="py-3 text-right font-bold">
                  {formatPaiseToINR(l.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className="flex justify-end pt-4 border-t-2 border-neutral-900">
          <div className="w-72 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span>{formatPaiseToINR(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Discount Applied:</span>
                <span>-{formatPaiseToINR(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>GST Tax Amount:</span>
              <span>{formatPaiseToINR(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-300">
              <span>Total Amount:</span>
              <span>{formatPaiseToINR(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Amount Paid:</span>
              <span>{formatPaiseToINR(invoice.amount_paid)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base pt-2 border-t-2 border-neutral-900">
              <span>Balance Due:</span>
              <span>
                {formatPaiseToINR(invoice.total_amount - invoice.amount_paid)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-12 pt-6 border-t border-neutral-200 text-[11px] text-neutral-500 space-y-1">
          <p className="font-semibold text-neutral-700">
            Payment Terms & Instructions:
          </p>
          <p>
            Settlement accepted via direct Bank Transfer (NEFT/RTGS) or UPI to
            Brightloop Software.
          </p>
          <p>Computer generated invoice. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
