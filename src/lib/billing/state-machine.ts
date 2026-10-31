/**
 * Finite State Machine for Subscriptions and Invoices
 * Enforces valid state transitions and rejects unauthorized or illogical state jumps.
 */

export type SubscriptionStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paused"
  | "closed";

export type InvoiceStatus = "draft" | "confirmed" | "paid" | "cancelled";

export const ALLOWED_SUBSCRIPTION_TRANSITIONS: Record<
  SubscriptionStatus,
  SubscriptionStatus[]
> = {
  draft: ["quotation", "closed"],
  quotation: ["confirmed", "closed"],
  confirmed: ["active", "closed"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [], // Terminal
};

export const ALLOWED_INVOICE_TRANSITIONS: Record<
  InvoiceStatus,
  InvoiceStatus[]
> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: [], // Terminal
  cancelled: [], // Terminal
};

/**
 * Validates whether a proposed subscription status transition is legal.
 */
export function isLegalSubscriptionTransition(
  current: SubscriptionStatus,
  target: SubscriptionStatus,
  options?: {
    canPause?: boolean;
    isQuotationExpired?: boolean;
  },
): { allowed: boolean; reason?: string } {
  if (current === target) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_SUBSCRIPTION_TRANSITIONS[current] || [];
  if (!allowedTargets.includes(target)) {
    return {
      allowed: false,
      reason: `Cannot transition subscription from "${current}" to "${target}".`,
    };
  }

  if (current === "active" && target === "paused" && options?.canPause === false) {
    return {
      allowed: false,
      reason: "The assigned subscription plan does not permit pausing.",
    };
  }

  if (current === "quotation" && target === "confirmed" && options?.isQuotationExpired) {
    return {
      allowed: false,
      reason: "This quotation has expired past its validity period.",
    };
  }

  return { allowed: true };
}

/**
 * Validates whether a proposed invoice status transition is legal.
 */
export function isLegalInvoiceTransition(
  current: InvoiceStatus,
  target: InvoiceStatus,
): { allowed: boolean; reason?: string } {
  if (current === target) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_INVOICE_TRANSITIONS[current] || [];
  if (!allowedTargets.includes(target)) {
    return {
      allowed: false,
      reason: `Cannot transition invoice from "${current}" to "${target}".`,
    };
  }

  return { allowed: true };
}
