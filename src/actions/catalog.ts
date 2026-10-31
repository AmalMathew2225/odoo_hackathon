"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// -----------------------------------------------------------------------------
// PRODUCTS & VARIANTS
// -----------------------------------------------------------------------------
const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").trim(),
  type: z.string().default("Software"),
  salesPrice: z.coerce.number().min(0, "Sales price cannot be negative"), // in rupees from UI
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"), // in rupees from UI
  notes: z.string().optional(),
});

export async function createProductAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireAuth(["admin"]);

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    salesPrice: formData.get("salesPrice"),
    costPrice: formData.get("costPrice"),
    notes: formData.get("notes"),
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const { name, type, salesPrice, costPrice, notes } = parsed.data;
  const adminClient = createAdminClient();

  // Convert rupees to paise
  const salesPaise = Math.round(salesPrice * 100);
  const costPaise = Math.round(costPrice * 100);

  const { error } = await adminClient.from("products").insert({
    name,
    type,
    sales_price: salesPaise,
    cost_price: costPaise,
    notes: notes || "",
    is_active: true,
  });

  if (error) return { error: error.message };

  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: "admin",
    action: "create_product",
    entity_type: "product",
    entity_id: name,
    new_values: { name, sales_price: salesPaise },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function createVariantAction(
  _prevState: unknown,
  formData: FormData,
) {
  await requireAuth(["admin"]);

  const productId = String(formData.get("productId") || "");
  const name = String(formData.get("name") || "").trim();
  const value = String(formData.get("value") || "").trim();
  const extraPriceRupees = Number(formData.get("extraPrice") || 0);

  if (!productId || !name || !value) {
    return { error: "Product, variant name, and variant value are required" };
  }

  const extraPaise = Math.round(extraPriceRupees * 100);
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("product_variants").insert({
    product_id: productId,
    name,
    value,
    extra_price: extraPaise,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  return { success: true };
}

// -----------------------------------------------------------------------------
// PLANS
// -----------------------------------------------------------------------------
const planSchema = z.object({
  name: z.string().min(2, "Plan name required").trim(),
  code: z.string().min(2, "Code required").toUpperCase().trim(),
  price: z.coerce.number().min(0), // in rupees
  billingPeriod: z.enum(["daily", "weekly", "monthly", "yearly"]),
  minQuantity: z.coerce.number().min(1).default(1),
  autoClose: z.boolean().default(false),
  canCloseEarly: z.boolean().default(true),
  canPause: z.boolean().default(true),
  canRenew: z.boolean().default(true),
});

export async function createPlanAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireAuth(["admin"]);

  const raw = {
    name: formData.get("name"),
    code: formData.get("code"),
    price: formData.get("price"),
    billingPeriod: formData.get("billingPeriod"),
    minQuantity: formData.get("minQuantity"),
    autoClose:
      formData.get("autoClose") === "true" ||
      formData.get("autoClose") === "on",
    canCloseEarly: formData.get("canCloseEarly") !== "false",
    canPause: formData.get("canPause") !== "false",
    canRenew: formData.get("canRenew") !== "false",
  };

  const parsed = planSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const d = parsed.data;
  const pricePaise = Math.round(d.price * 100);
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("plans").insert({
    name: d.name,
    code: d.code,
    price: pricePaise,
    billing_period: d.billingPeriod,
    min_quantity: d.minQuantity,
    auto_close: d.autoClose,
    can_close_early: d.canCloseEarly,
    can_pause: d.canPause,
    can_renew: d.canRenew,
    is_active: true,
  });

  if (error) return { error: error.message };

  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: "admin",
    action: "create_plan",
    entity_type: "plan",
    entity_id: d.code,
    new_values: { code: d.code, price: pricePaise },
  });

  revalidatePath("/admin/plans");
  return { success: true };
}

// -----------------------------------------------------------------------------
// PAYMENT TERMS & TAXES
// -----------------------------------------------------------------------------
export async function createPaymentTermAction(
  _prevState: unknown,
  formData: FormData,
) {
  await requireAuth(["admin"]);

  const name = String(formData.get("name") || "").trim();
  const days = Number(formData.get("days") || 0);

  if (!name) return { error: "Name is required" };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("payment_terms").insert({
    name,
    days: Math.max(0, days),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/payment-terms");
  return { success: true };
}

export async function createTaxAction(_prevState: unknown, formData: FormData) {
  await requireAuth(["admin"]);

  const name = String(formData.get("name") || "").trim();
  const ratePercent = Number(formData.get("ratePercent") || 0);

  if (!name || ratePercent < 0 || ratePercent > 100) {
    return { error: "Valid name and rate (0-100%) required" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("taxes").insert({
    name,
    rate_percent: ratePercent,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/taxes");
  return { success: true };
}

// -----------------------------------------------------------------------------
// DISCOUNTS
// -----------------------------------------------------------------------------
export async function createDiscountAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireAuth(["admin"]);

  const code = String(formData.get("code") || "")
    .toUpperCase()
    .trim();
  const description = String(formData.get("description") || "").trim();
  const type = String(formData.get("type") || "percentage");
  const valueInput = Number(formData.get("value") || 0);
  const usageLimit = formData.get("usageLimit")
    ? Number(formData.get("usageLimit"))
    : null;

  if (!code || valueInput <= 0) {
    return { error: "Code and positive value are required" };
  }

  // If fixed, convert rupees to paise
  const finalValue =
    type === "fixed" ? Math.round(valueInput * 100) : Math.round(valueInput);

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("discounts").insert({
    code,
    description,
    type,
    value: finalValue,
    usage_limit: usageLimit,
    times_used: 0,
    is_active: true,
  });

  if (error) return { error: error.message };

  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: "admin",
    action: "create_discount",
    entity_type: "discount",
    entity_id: code,
    new_values: { code, type, value: finalValue, usage_limit: usageLimit },
  });

  revalidatePath("/admin/discounts");
  return { success: true };
}

// -----------------------------------------------------------------------------
// QUOTATION TEMPLATES
// -----------------------------------------------------------------------------
export async function createTemplateAction(
  _prevState: unknown,
  formData: FormData,
) {
  await requireAuth(["admin"]);

  const name = String(formData.get("name") || "").trim();
  const planId = String(formData.get("planId") || "");
  const validDays = Number(formData.get("validDays") || 30);
  const notes = String(formData.get("notes") || "");
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));

  if (!name || !planId || !productId) {
    return { error: "Name, plan, and initial product are required" };
  }

  const adminClient = createAdminClient();
  const { data: template, error: tmplErr } = await adminClient
    .from("quotation_templates")
    .insert({
      name,
      plan_id: planId,
      valid_days: validDays,
      notes,
    })
    .select("id")
    .single();

  if (tmplErr || !template)
    return { error: tmplErr?.message || "Failed to create template" };

  await adminClient.from("quotation_template_lines").insert({
    template_id: template.id,
    product_id: productId,
    quantity,
  });

  revalidatePath("/admin/templates");
  return { success: true };
}
