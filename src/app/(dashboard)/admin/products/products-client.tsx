"use client";

import { Plus, Tag } from "lucide-react";
import { useState, useTransition } from "react";
import { createProductAction, createVariantAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatPaiseToINR } from "@/lib/billing/pricing";

export function ProductsClient({ products }: { products: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProductSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createProductAction(null, formData);
      if (res?.error) setError(res.error);
      else setIsProductModalOpen(false);
    });
  };

  const handleVariantSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createVariantAction(null, formData);
      if (res?.error) setError(res.error);
      else setVariantProduct(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Catalog Products & Variants
          </h1>
          <p className="text-xs text-neutral-500">
            Configure software products and additive pricing attributes
          </p>
        </div>

        <Button
          onClick={() => setIsProductModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Product</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  {p.type}
                </span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {p.name}
                </h3>
              </div>
              <span className="font-mono text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                {formatPaiseToINR(p.sales_price)}
              </span>
            </div>

            {p.notes && <p className="text-xs text-neutral-500">{p.notes}</p>}

            {/* Variants Section */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                  Variants ({(p.product_variants || []).length})
                </span>
                <button
                  onClick={() => setVariantProduct(p)}
                  className="text-[11px] font-mono text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1"
                >
                  <Tag className="h-2.5 w-2.5" />+ Add Variant
                </button>
              </div>

              {(p.product_variants || []).length === 0 ? (
                <div className="text-[11px] text-neutral-400 font-mono">
                  No pricing variants defined
                </div>
              ) : (
                <div className="space-y-1">
                  {(p.product_variants || []).map((v: any) => (
                    <div
                      key={v.id}
                      className="flex justify-between items-center text-xs p-1.5 rounded bg-neutral-50 dark:bg-neutral-800/60 font-mono"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {v.name}:{" "}
                        <strong className="font-sans">{v.value}</strong>
                      </span>
                      <span className="text-neutral-500">
                        +{formatPaiseToINR(v.extra_price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Catalog Product"
        description="Define base product name, type, and standard pricing."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleProductSubmit} className="space-y-4 text-xs">
          <Input
            label="Product Name"
            name="name"
            required
            placeholder="Brightloop ERP"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Type"
              name="type"
              defaultValue="Software"
              required
            />
            <Input
              label="Sales Price (₹)"
              name="salesPrice"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="4999.00"
            />
          </div>
          <Input
            label="Cost Price (₹)"
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
          />
          <Input
            label="Notes"
            name="notes"
            placeholder="Enterprise business suite..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Variant Modal */}
      {variantProduct && (
        <Modal
          isOpen={!!variantProduct}
          onClose={() => setVariantProduct(null)}
          title={`Add Variant to ${variantProduct.name}`}
          description="E.g., Brand 'Odoo' adds ₹560 to base price."
        >
          {error && (
            <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
              {error}
            </div>
          )}
          <form action={handleVariantSubmit} className="space-y-4 text-xs">
            <input type="hidden" name="productId" value={variantProduct.id} />
            <Input
              label="Attribute Name"
              name="name"
              required
              placeholder="Brand / Edition / Tier"
            />
            <Input
              label="Attribute Value"
              name="value"
              required
              placeholder="Odoo Edition"
            />
            <Input
              label="Extra Surcharge (₹)"
              name="extraPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue="560.00"
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariantProduct(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isPending}>
                Add Variant
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
