"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createTemplateAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function TemplatesClient({
  templates,
  plans,
  products,
}: {
  templates: any[];
  plans: any[];
  products: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createTemplateAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Quotation Templates
          </h1>
          <p className="text-xs text-neutral-500">
            Pre-configured offer packages with custom expiration day limits
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Quotation Template</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3 shadow-xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  {t.plans?.name} ({t.plans?.billing_period})
                </span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {t.name}
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
                {t.valid_days} Days Valid
              </span>
            </div>

            {t.notes && <p className="text-xs text-neutral-500">{t.notes}</p>}

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase block">
                Included Products
              </span>
              {(t.quotation_template_lines || []).map((line: any) => (
                <div
                  key={`${t.id}-${line.products?.name}`}
                  className="text-xs font-mono text-neutral-600 dark:text-neutral-300 flex justify-between"
                >
                  <span>&bull; {line.products?.name}</span>
                  <span>Qty {line.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Quotation Template"
        description="Bind plans and product lines with quotation validity days."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Template Name"
            name="name"
            required
            placeholder="Standard Cloud Onboarding"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Plan
              </label>
              <select
                name="planId"
                required
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billing_period})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Validity (Days)"
              name="validDays"
              type="number"
              min="1"
              defaultValue="30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-neutral-500 mb-1">
                Initial Product
              </label>
              <select
                name="productId"
                required
                className="h-9 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2"
              >
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              required
            />
          </div>

          <Input
            label="Notes"
            name="notes"
            placeholder="Standard 30-day corporate package..."
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
              Save Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
