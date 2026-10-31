import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { TaxesClient } from "./taxes-client";

export const dynamic = "force-dynamic";

export default async function AdminTaxesPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: taxes } = await supabase
    .from("taxes")
    .select("*")
    .order("rate_percent", { ascending: true });

  return <TaxesClient taxes={(taxes || []) as any[]} />;
}
