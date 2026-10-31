import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentTermsClient } from "./payment-terms-client";

export default async function AdminPaymentTermsPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: terms } = await supabase
    .from("payment_terms")
    .select("*")
    .order("days", { ascending: true });

  return <PaymentTermsClient terms={(terms || []) as any[]} />;
}
