import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaiseToINR } from "@/lib/billing/pricing";
import { ProductsClient } from "./products-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, type, sales_price, cost_price, notes, is_active,
      product_variants(id, name, value, extra_price)
    `)
    .order("created_at", { ascending: false });

  return <ProductsClient products={(products || []) as any[]} />;
}
