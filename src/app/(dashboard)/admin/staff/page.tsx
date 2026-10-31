import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffClient } from "./staff-client";

export default async function AdminStaffPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: false });

  return <StaffClient users={(users || []) as any[]} />;
}
