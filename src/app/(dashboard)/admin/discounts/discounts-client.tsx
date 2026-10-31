"use client";

import React, { useState, useTransition } from "react";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createDiscountAction } from "@/actions/catalog";
import { Plus } from "lucide-react";

export function DiscountsClient({ discounts }: { discounts: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createDiscountAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Discount Coupons & Usage Quotas
          </h1>
          <p className="text-xs text-neutral-500">
            Atomic concurrency-safe discounts with automated release on invoice cancellation
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm" className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>New Discount Rule</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {discounts.map((d) => (
          <div
            key={d.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  {d.type} DISCOUNT
                </span>
                <h3 className="font-bold text-sm font-mono text-neutral-900 dark:text-neutral-100">
                  {d.code}
                </h3>
              </div>
              <span className="font-mono text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                {d.type === "fixed" ? formatPaiseToINR(d.value) : `${d.value}%`}
              </span>
            </div>

            {d.description && <p className="text-xs text-neutral-500">{d.description}</p>}

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs font-mono space-y-1">
              <div className="flex justify-between text-neutral-500">
                <span>Usage Limit:</span>
                <span>{d.usage_limit ? `${d.times_used} / ${d.usage_limit}` : `${d.times_used} (Unlimited)`}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Status:</span>
                <span className={d.is_active ? "text-neutral-900 dark:text-neutral-100 font-bold" : "text-neutral-400"}>
                  {d.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Discount Rule"
        description="Configure fixed paise or percentage deduction and usage limits."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 text-xs">
          <Input label="Coupon Code" name="code" required placeholder="SUMMER20" />
          <Input label="Description" name="description" placeholder="Summer 2026 onboarding incentive" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Discount Type
              </label>
              <select
                name="type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <Input
              label={discountType === "fixed" ? "Deduction Amount (₹)" : "Percentage Value (%)"}
              name="value"
              type="number"
              step={discountType === "fixed" ? "0.01" : "1"}
              min="1"
              required
              placeholder={discountType === "fixed" ? "500.00" : "15"}
            />
          </div>

          <Input
            label="Total Usage Limit (Optional)"
            name="usageLimit"
            type="number"
            min="1"
            placeholder="e.g. 500 redemptions"
            helperText="Leave empty for unlimited redemptions"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Discount
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
