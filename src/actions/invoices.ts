"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvoiceEmail } from "@/lib/email/mailer";
import type { Invoice, InvoiceLine, Profile } from "@/types/database";

export async function transitionInvoiceAction(
  invoiceId: string,
  newStatus: "draft" | "confirmed" | "paid" | "cancelled",
) {
  const session = await requireAuth(["admin", "staff"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("transition_invoice_status", {
    p_inv_id: invoiceId,
    p_new_status: newStatus,
    p_actor_id: session.userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff/invoices");
  revalidatePath("/portal/invoices");
  return { success: true };
}

export async function sendInvoiceAction(invoiceId: string) {
  await requireAuth(["admin", "staff"]);
  const adminClient = createAdminClient();

  // Fetch invoice, lines, customer
  const { data: invoice, error: invErr } = await adminClient
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invErr || !invoice) throw new Error("Invoice not found");

  const { data: customer } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", invoice.customer_id)
    .single();

  if (!customer) throw new Error("Customer profile not found");

  const { data: lines } = await adminClient
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId);

  const emailResult = await sendInvoiceEmail({
    invoice: invoice as Invoice,
    lines: (lines || []) as InvoiceLine[],
    customer: customer as Profile,
  });

  if (!emailResult.success) {
    throw new Error(emailResult.error || "Failed to deliver email");
  }

  // Update sent_at timestamp
  await adminClient
    .from("invoices")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", invoiceId);

  revalidatePath("/staff/invoices");
  return { success: true };
}
