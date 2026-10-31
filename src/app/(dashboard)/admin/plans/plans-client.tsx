"use client";

import React, { useState, useTransition } from "react";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createPlanAction } from "@/actions/catalog";
import { Plus, Check, X } from "lucide-react";

export function PlansClient({ plans }: { plans: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createPlanAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Subscription Plans & Policy Rules
          </h1>
          <p className="text-xs text-neutral-500">
            Billing cycles, minimum commitments, pausing rules, and renewal terms
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Plan</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  {p.code} &bull; {p.billing_period}
                </span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {p.name}
                </h3>
              </div>
              <span className="font-mono text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatPaiseToINR(p.price)}
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Min Quantity:</span>
                <span className="font-mono font-medium">{p.min_quantity}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Can Be Paused:</span>
                <span>{p.can_pause ? "✓ Yes" : "✕ No"}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Can Be Renewed:</span>
                <span>{p.can_renew ? "✓ Yes" : "✕ No"}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Auto-Close on Expiry:</span>
                <span>{p.auto_close ? "✓ Active" : "✕ Disabled"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
        description="Configure pricing, interval, and contract management rules."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 text-xs">
          <Input label="Plan Name" name="name" required placeholder="Growth Monthly" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" name="code" required placeholder="GROWTH-M" />
            <Input label="Base Price (₹)" name="price" type="number" step="0.01" min="0" required placeholder="9999.00" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Billing Cycle
              </label>
              <select
                name="billingPeriod"
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <Input label="Min Quantity" name="minQuantity" type="number" min="1" defaultValue="1" required />
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
            <span className="font-semibold uppercase text-[11px] text-neutral-500 block">
              Contract Lifecycle Flags
            </span>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="canPause" defaultChecked className="rounded" />
              <span>Allow customer/staff to pause contract</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="canRenew" defaultChecked className="rounded" />
              <span>Allow contract renewal (+1 term extension)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="autoClose" className="rounded" />
              <span>Automatically close contract when expiry date is reached</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
