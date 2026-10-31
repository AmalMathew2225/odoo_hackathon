"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import type { BillingPeriod } from "@/lib/billing/dates";
import { formatDateISO, getAnchorPeriodDate } from "@/lib/billing/dates";
import { createAdminClient } from "@/lib/supabase/admin";

const createSubSchema = z.object({
  customerId: z.string().uuid("Customer required"),
  planId: z.string().uuid("Plan required"),
  paymentTermsId: z.string().uuid("Payment terms required"),
  discountId: z.string().uuid().optional().nullable(),
  startDate: z.string().min(1, "Start date required"),
  productId: z.string().uuid("Product required"),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  taxId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

export async function createSubscriptionAction(
  _prevState: unknown,
  formData: FormData,
) {
  // Staff or Admin only
  const session = await requireAuth(["admin", "staff"]);

  const raw = {
    customerId: formData.get("customerId"),
    planId: formData.get("planId"),
    paymentTermsId: formData.get("paymentTermsId"),
    discountId: formData.get("discountId") ? formData.get("discountId") : null,
    startDate: formData.get("startDate") || formatDateISO(new Date()),
    productId: formData.get("productId"),
    variantId: formData.get("variantId") ? formData.get("variantId") : null,
    quantity: formData.get("quantity") || 1,
    taxId: formData.get("taxId") ? formData.get("taxId") : null,
    notes: formData.get("notes") || "",
  };

  const parsed = createSubSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const d = parsed.data;
  const adminClient = createAdminClient();

  // Fetch plan details to calculate expiry date
  const { data: plan, error: planErr } = await adminClient
    .from("plans")
    .select("*")
    .eq("id", d.planId)
    .single();

  if (planErr || !plan) return { error: "Plan not found" };

  // Fetch product and optional variant prices
  const { data: product } = await adminClient
    .from("products")
    .select("sales_price")
    .eq("id", d.productId)
    .single();

  let variantExtra = 0;
  if (d.variantId) {
    const { data: variant } = await adminClient
      .from("product_variants")
      .select("extra_price")
      .eq("id", d.variantId)
      .single();
    if (variant) variantExtra = variant.extra_price;
  }

  const basePrice = product?.sales_price || 0;
  const unitPrice = basePrice + variantExtra;
  const lineAmount = unitPrice * d.quantity;

  // Calculate 1-term initial expiry
  const expiryDate = formatDateISO(
    getAnchorPeriodDate(d.startDate, plan.billing_period as BillingPeriod, 1),
  );

  // Generate SUB/2026/XXXXX
  const { data: subNum } = await adminClient.rpc("next_document_number", {
    p_type: "subscription",
  });

  // Insert subscription
  const { data: newSub, error: subErr } = await adminClient
    .from("subscriptions")
    .insert({
      subscription_number: subNum,
      customer_id: d.customerId,
      plan_id: d.planId,
      status: "active",
      start_date: d.startDate,
      expiry_date: expiryDate,
      next_billing_date: d.startDate, // Due for billing on start date
      payment_terms_id: d.paymentTermsId,
      discount_id: d.discountId,
      notes: d.notes || "",
    })
    .select("id")
    .single();

  if (subErr || !newSub) {
    return { error: subErr?.message || "Failed to create subscription" };
  }

  // Insert subscription line
  const { data: newLine, error: lineErr } = await adminClient
    .from("subscription_lines")
    .insert({
      subscription_id: newSub.id,
      product_id: d.productId,
      variant_id: d.variantId,
      quantity: d.quantity,
      unit_price: unitPrice,
      amount: lineAmount,
    })
    .select("id")
    .single();

  if (lineErr || !newLine) {
    return {
      error: "Created subscription shell but failed to add product line",
    };
  }

  // Attach Tax if selected
  if (d.taxId) {
    await adminClient.from("subscription_line_taxes").insert({
      line_id: newLine.id,
      tax_id: d.taxId,
    });
  }

  // Audit log
  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: session.role,
    action: "create_subscription",
    entity_type: "subscription",
    entity_id: newSub.id,
    new_values: {
      subscription_number: subNum,
      customer_id: d.customerId,
      plan: plan.name,
    },
  });

  revalidatePath("/staff/subscriptions");
  return { success: true };
}

/**
 * Transitions a subscription status.
 * Customers can only transition their own subscription (e.g. pause, renew, close).
 * Staff/Admin can transition any subscription.
 */
export async function transitionSubscriptionAction(
  subscriptionId: string,
  newStatus:
    | "draft"
    | "quotation"
    | "confirmed"
    | "active"
    | "paused"
    | "closed",
) {
  const session = await requireAuth();
  const adminClient = createAdminClient();

  // If customer, verify ownership
  if (session.role === "customer") {
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("customer_id")
      .eq("id", subscriptionId)
      .single();

    if (!sub || sub.customer_id !== session.userId) {
      throw new Error("Not found");
    }

    // Customers can only pause, renew (handled separately), or close
    if (!["paused", "active", "closed"].includes(newStatus)) {
      throw new Error("Action not permitted for customer");
    }
  }

  const { error } = await adminClient.rpc("transition_subscription_status", {
    p_sub_id: subscriptionId,
    p_new_status: newStatus,
    p_actor_id: session.userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff/subscriptions");
  revalidatePath("/portal/subscriptions");
  return { success: true };
}

/**
 * Renews a subscription by extending its expiry date by one term.
 */
export async function renewSubscriptionAction(subscriptionId: string) {
  const session = await requireAuth();
  const adminClient = createAdminClient();

  const { data: sub, error: subErr } = await adminClient
    .from("subscriptions")
    .select("*, plans(billing_period, can_renew)")
    .eq("id", subscriptionId)
    .single();

  if (subErr || !sub) throw new Error("Subscription not found");

  if (session.role === "customer" && sub.customer_id !== session.userId) {
    throw new Error("Not found");
  }

  const plan = sub.plans as {
    billing_period: BillingPeriod;
    can_renew: boolean;
  };
  if (!plan.can_renew) {
    throw new Error("This plan does not permit renewals");
  }

  const currentExpiry = sub.expiry_date || formatDateISO(new Date());
  const newExpiry = formatDateISO(
    getAnchorPeriodDate(currentExpiry, plan.billing_period, 1),
  );

  const { error: updateErr } = await adminClient
    .from("subscriptions")
    .update({
      expiry_date: newExpiry,
      status: "active",
    })
    .eq("id", subscriptionId);

  if (updateErr) throw new Error(updateErr.message);

  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: session.role,
    action: "renew_subscription",
    entity_type: "subscription",
    entity_id: subscriptionId,
    new_values: { previous_expiry: currentExpiry, new_expiry: newExpiry },
  });

  revalidatePath("/staff/subscriptions");
  revalidatePath("/portal/subscriptions");
  return { success: true };
}
