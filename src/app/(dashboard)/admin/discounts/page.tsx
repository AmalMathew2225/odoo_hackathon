import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { DiscountsClient } from "./discounts-client";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: discounts } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  return <DiscountsClient discounts={(discounts || []) as any[]} />;
}

