"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createPaymentTermAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function PaymentTermsClient({ terms }: { terms: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createPaymentTermAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Payment Terms & Due Intervals
          </h1>
          <p className="text-xs text-neutral-500">
            Defines due date calculation offset (Invoice Issue Date + Terms
            Days)
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Payment Term</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {terms.map((t) => (
          <div
            key={t.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-1 shadow-xs"
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Contract Terms
            </span>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              {t.name}
            </h3>
            <div className="text-2xl font-extrabold font-mono pt-1">
              {t.days}{" "}
              <span className="text-xs font-sans text-neutral-400 font-normal">
                days until due
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Payment Term"
        description="E.g., 'Immediate' (0 days), 'Net 15' (15 days), 'Net 30' (30 days)."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 text-xs">
          <Input label="Term Label" name="name" required placeholder="Net 30" />
          <Input
            label="Days Until Due"
            name="days"
            type="number"
            min="0"
            required
            placeholder="30"
          />

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
              Save Term
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
