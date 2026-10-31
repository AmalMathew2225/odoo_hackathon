"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const paymentSchema = z.object({
  invoiceId: z.string().uuid("Invoice ID required"),
  amount: z.coerce
    .number()
    .positive("Payment amount must be greater than zero"), // in rupees
  paymentMethod: z.enum(["Bank Transfer", "Cash", "Cheque", "UPI", "Other"]),
  paymentDate: z.string().min(1, "Payment date required"),
  note: z.string().optional(),
});

export async function recordPaymentAction(
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireAuth(["admin", "staff"]);

  const raw = {
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    paymentDate:
      formData.get("paymentDate") || new Date().toISOString().split("T")[0],
    note: formData.get("note") || "",
  };

  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const d = parsed.data;
  const amountPaise = Math.round(d.amount * 100);
  const adminClient = createAdminClient();

  const { data: paymentId, error } = await adminClient.rpc(
    "record_invoice_payment",
    {
      p_invoice_id: d.invoiceId,
      p_amount: amountPaise,
      p_method: d.paymentMethod,
      p_date: d.paymentDate,
      p_note: d.note || "",
      p_actor_id: session.userId,
    },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff/invoices");
  revalidatePath("/staff/payments");
  revalidatePath("/portal/invoices");
  revalidatePath("/portal/payments");
  return { success: true, paymentId };
}
