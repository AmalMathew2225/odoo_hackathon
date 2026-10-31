import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlansClient } from "./plans-client";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });

  return <PlansClient plans={(plans || []) as any[]} />;
}
