import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { TemplatesClient } from "./templates-client";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const [templatesRes, plansRes, productsRes] = await Promise.all([
    supabase
      .from("quotation_templates")
      .select(`
        id, name, valid_days, notes, created_at,
        plans(name, billing_period),
        quotation_template_lines(quantity, products(name))
      `)
      .order("created_at", { ascending: false }),

    supabase.from("plans").select("id, name, billing_period").eq("is_active", true),
    supabase.from("products").select("id, name, sales_price").eq("is_active", true),
  ]);

  return (
    <TemplatesClient
      templates={(templatesRes.data || []) as any[]}
      plans={plansRes.data || []}
      products={productsRes.data || []}
    />
  );
}
