"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createTaxAction } from "@/actions/catalog";
import { Plus } from "lucide-react";

export function TaxesClient({ taxes }: { taxes: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createTaxAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Tax Rules & GST Stacking
          </h1>
          <p className="text-xs text-neutral-500">
            Named tax rates applied automatically to quotation and invoice lines
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm" className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>New Tax Rule</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {taxes.map((t) => (
          <div
            key={t.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs"
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Tax Rule
            </span>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{t.name}</h3>
            <div className="text-2xl font-extrabold font-mono pt-1">{t.rate_percent}%</div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Tax Rate"
        description="E.g., 'GST 18%', 'CGST 9%', or 'SGST 9%'."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 text-xs">
          <Input label="Tax Name" name="name" required placeholder="GST 18%" />
          <Input label="Rate Percentage (%)" name="ratePercent" type="number" step="0.01" min="0" max="100" required placeholder="18.00" />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Tax Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
