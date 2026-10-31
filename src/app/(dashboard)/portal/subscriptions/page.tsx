import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalSubscriptionsClient } from "./portal-subscriptions-client";

export default async function PortalSubscriptionsPage() {
  const session = await requireAuth();
  const supabase = createAdminClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`
      id, subscription_number, status, start_date, expiry_date, next_billing_date,
      plans(name, billing_period, can_pause, can_renew, can_close_early),
      subscription_lines(unit_price, quantity, amount, products(name))
    `)
    .eq("customer_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <PortalSubscriptionsClient subscriptions={(subscriptions || []) as any[]} />
  );
}
