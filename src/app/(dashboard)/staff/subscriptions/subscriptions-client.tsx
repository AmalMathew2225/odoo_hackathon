"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import {
  createSubscriptionAction,
  transitionSubscriptionAction,
  renewSubscriptionAction,
} from "@/actions/subscriptions";
import { Plus, Search, ChevronLeft, ChevronRight, Pause, Play, XCircle, RotateCcw } from "lucide-react";

interface SubscriptionsClientProps {
  subscriptions: any[];
  page: number;
  totalPages: number;
  totalCount: number;
  statusFilter: string;
  searchQuery: string;
  customers: any[];
  plans: any[];
  products: any[];
  terms: any[];
  taxes: any[];
  discounts: any[];
}

export function SubscriptionsClient({
  subscriptions,
  page,
  totalPages,
  totalCount,
  statusFilter,
  searchQuery,
  customers,
  plans,
  products,
  terms,
  taxes,
  discounts,
}: SubscriptionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState(searchQuery);

  // Form states for creation
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [modalError, setModalError] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === selectedProduct);
  const activeVariants = activeProduct?.product_variants || [];

  const handleFilterChange = (newStatus: string) => {
    const params = new URLSearchParams();
    if (newStatus) params.set("status", newStatus);
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/staff/subscriptions?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/staff/subscriptions?${params.toString()}`);
  };

  const handleTransition = async (id: string, status: any) => {
    startTransition(async () => {
      try {
        await transitionSubscriptionAction(id, status);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleRenew = async (id: string) => {
    startTransition(async () => {
      try {
        await renewSubscriptionAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleCreateSubmit = async (formData: FormData) => {
    setModalError(null);
    startTransition(async () => {
      const res = await createSubscriptionAction(null, formData);
      if (res?.error) {
        setModalError(res.error);
      } else {
        setIsModalOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Subscription Contracts
          </h1>
          <p className="text-xs text-neutral-500">
            {totalCount.toLocaleString()} total contracts on file &bull; Server-side paginated
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Subscription</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SUB/2026/..."
              className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            <Search className="h-3 w-3" />
          </Button>
        </form>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["", "active", "confirmed", "paused", "closed"].map((st) => (
            <button
              key={st}
              onClick={() => handleFilterChange(st)}
              className={`px-2.5 py-1 text-xs rounded uppercase font-mono tracking-wider transition-colors ${
                statusFilter === st
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {st || "ALL"}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Contract #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Plan / Cycle</th>
                <th className="py-2.5 px-4">Product Line</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Next Billing</th>
                <th className="py-2.5 px-4">Expiry</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No subscriptions match this filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => {
                  const line = s.subscription_lines?.[0];
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3 px-4 font-mono font-medium">{s.subscription_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {s.profiles?.company_name || s.profiles?.full_name || "—"}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {s.profiles?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{s.plans?.name}</span>
                        <span className="block text-[11px] text-neutral-400 capitalize">
                          {s.plans?.billing_period}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {line?.products?.name || "Standard Unit"}
                        <span className="block text-[11px] text-neutral-400 font-mono">
                          Qty {line?.quantity || 1} &bull; {formatPaiseToINR(line?.amount || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500">
                        {s.next_billing_date || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-500">
                        {s.expiry_date || "Continuous"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.status === "active" && (
                            <button
                              onClick={() => handleTransition(s.id, "paused")}
                              title="Pause Subscription"
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {s.status === "paused" && (
                            <button
                              onClick={() => handleTransition(s.id, "active")}
                              title="Resume Subscription"
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {s.status === "active" && (
                            <button
                              onClick={() => handleRenew(s.id)}
                              title="Renew Subscription (+1 Term)"
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {s.status !== "closed" && (
                            <button
                              onClick={() => {
                                if (confirm(`Close contract ${s.subscription_number}?`)) {
                                  handleTransition(s.id, "closed");
                                }
                              }}
                              title="Close Contract"
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
            Page {page} of {Math.max(1, totalPages)} &bull; Showing {subscriptions.length} rows
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams(window.location.search);
                p.set("page", String(page - 1));
                router.push(`/staff/subscriptions?${p.toString()}`);
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
                router.push(`/staff/subscriptions?${p.toString()}`);
              }}
              className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription Contract"
        description="Provision an active recurring contract with product lines, taxes, and terms."
      >
        {modalError && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs text-neutral-800 dark:text-neutral-200 mb-3">
            {modalError}
          </div>
        )}

        <form action={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
              Customer Account
            </label>
            <select
              name="customerId"
              required
              className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name ? `${c.company_name} (${c.full_name})` : c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Plan
              </label>
              <select
                name="planId"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                required
                className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billing_period})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Payment Terms
              </label>
              <select
                name="paymentTermsId"
                required
                className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.days} days)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Product
              </label>
              <select
                name="productId"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({formatPaiseToINR(pr.sales_price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Variant
              </label>
              <select
                name="variantId"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="">None (Standard)</option>
                {activeVariants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}: {v.value} (+{formatPaiseToINR(v.extra_price)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Quantity
              </label>
              <Input
                name="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Tax
              </label>
              <select
                name="taxId"
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="">No Tax</option>
                {taxes.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.name} ({tx.rate_percent}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Discount
              </label>
              <select
                name="discountId"
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="">None</option>
                {discounts.map((dc) => (
                  <option key={dc.id} value={dc.id}>
                    {dc.code} ({dc.type === "fixed" ? formatPaiseToINR(dc.value) : `${dc.value}%`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
