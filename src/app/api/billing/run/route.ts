import { type NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-Only Manual Billing Trigger Endpoint
 * Allows testing and running the billing engine on demand from the admin dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetDate =
      body.target_date || new Date().toISOString().split("T")[0];

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("run_billing", {
      p_target_date: targetDate,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
