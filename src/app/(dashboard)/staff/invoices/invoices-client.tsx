"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Mail,
  Printer,
  Search,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { sendInvoiceAction, transitionInvoiceAction } from "@/actions/invoices";
import { recordPaymentAction } from "@/actions/payments";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatPaiseToINR } from "@/lib/billing/pricing";

interface InvoicesClientProps {
  invoices: any[];
  page: number;
  totalPages: number;
  totalCount: number;
  statusFilter: string;
  searchQuery: string;
}

export function InvoicesClient({
  invoices,
  page,
  totalPages,
  totalCount,
  statusFilter,
  searchQuery,
}: InvoicesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);

  // Payment Modal state
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const handleFilterChange = (newStatus: string) => {
    const params = new URLSearchParams();
    if (newStatus) params.set("status", newStatus);
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/staff/invoices?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/staff/invoices?${params.toString()}`);
  };

  const handleConfirm = async (id: string) => {
    startTransition(async () => {
      try {
        await transitionInvoiceAction(id, "confirmed");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleCancel = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to cancel this invoice? Discount quotas will be restored.",
      )
    )
      return;
    startTransition(async () => {
      try {
        await transitionInvoiceAction(id, "cancelled");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleSend = async (id: string) => {
    startTransition(async () => {
      try {
        await sendInvoiceAction(id);
        alert("Invoice successfully dispatched via SMTP!");
      } catch (err: any) {
        alert(`Failed to send email: ${err.message}`);
      }
    });
  };

  const openPaymentModal = (inv: any) => {
    const remainingRupees = (inv.total_amount - inv.amount_paid) / 100;
    setPaymentInvoice(inv);
    setPaymentAmount(remainingRupees);
    setPaymentError(null);
  };

  const handlePaymentSubmit = async (formData: FormData) => {
    setPaymentError(null);
    startTransition(async () => {
      const res = await recordPaymentAction(null, formData);
      if (res?.error) {
        setPaymentError(res.error);
      } else {
        setPaymentInvoice(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Billing Invoices
          </h1>
          <p className="text-xs text-neutral-500">
            {totalCount.toLocaleString()} invoices on ledger &bull;
            Point-in-time pricing snapshots
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search INV/2026/..."
            className="h-8 w-full sm:w-64 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs focus:outline-none"
          />
          <Button type="submit" size="sm" variant="secondary">
            <Search className="h-3 w-3" />
          </Button>
        </form>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["", "draft", "confirmed", "paid", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => handleFilterChange(st)}
              className={`px-2.5 py-1 text-xs rounded uppercase font-mono tracking-wider transition-colors ${
                statusFilter === st
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {st || "ALL"}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Contract</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Billing Range</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400">
                    No invoices match this query.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
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
                        <Link
                          href={`/invoices/${inv.id}/print`}
                          target="_blank"
                          className="hover:underline flex items-center gap-1 text-neutral-900 dark:text-neutral-100"
                        >
                          {inv.invoice_number}
                          <Printer className="h-3 w-3 text-neutral-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500">
                        {inv.subscriptions?.subscription_number || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {inv.profiles?.company_name ||
                            inv.profiles?.full_name ||
                            "—"}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {inv.profiles?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
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
                      <td className="py-3 px-4 text-right font-semibold font-mono">
                        {formatPaiseToINR(inv.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {remaining > 0 ? (
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatPaiseToINR(remaining)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Settled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === "draft" && (
                            <button
                              onClick={() => handleConfirm(inv.id)}
                              title="Confirm Invoice"
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {inv.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => openPaymentModal(inv)}
                                title="Record Payment"
                                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleSend(inv.id)}
                                title="Dispatch Invoice Email via SMTP"
                                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {["draft", "confirmed"].includes(inv.status) && (
                            <button
                              onClick={() => handleCancel(inv.id)}
                              title="Cancel Invoice"
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-black dark:hover:text-white"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <span className="text-neutral-500">
            Page {page} of {Math.max(1, totalPages)} &bull; Showing{" "}
            {invoices.length} rows
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams(window.location.search);
                p.set("page", String(page - 1));
                router.push(`/staff/invoices?${p.toString()}`);
              }}
              className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                const p = new URLSearchParams(window.location.search);
                p.set("page", String(page + 1));
                router.push(`/staff/invoices?${p.toString()}`);
              }}
              className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Record Payment for ${paymentInvoice.invoice_number}`}
          description={`Customer: ${paymentInvoice.profiles?.company_name || paymentInvoice.profiles?.full_name}`}
        >
          {paymentError && (
            <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs text-neutral-800 dark:text-neutral-200 mb-3">
              {paymentError}
            </div>
          )}

          <form action={handlePaymentSubmit} className="space-y-4 text-xs">
            <input type="hidden" name="invoiceId" value={paymentInvoice.id} />

            <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Invoice Amount:</span>
                <span className="font-mono">
                  {formatPaiseToINR(paymentInvoice.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Already Paid:</span>
                <span className="font-mono">
                  {formatPaiseToINR(paymentInvoice.amount_paid)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">
                  {formatPaiseToINR(
                    paymentInvoice.total_amount - paymentInvoice.amount_paid,
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                  Payment Amount (₹)
                </label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={
                    (paymentInvoice.total_amount - paymentInvoice.amount_paid) /
                    100
                  }
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                  Settlement Date
                </label>
                <Input
                  name="paymentDate"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                  Reference / Note
                </label>
                <Input
                  name="note"
                  type="text"
                  placeholder="NEFT transaction ref #..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentInvoice(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isPending}>
                Record Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
