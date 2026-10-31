import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { timingSafeCompare } from "@/lib/security/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cloudflare Daily Billing Cron Webhook Endpoint
 * Secured strictly with CRON_SECRET via Bearer token.
 * Uses Node.js constant-time comparison to prevent timing attacks.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      // Plain 401 with no details
      return new NextResponse(null, { status: 401 });
    }

    const env = getEnv();
    const isSecretValid = timingSafeCompare(env.CRON_SECRET, token);

    if (!isSecretValid) {
      return new NextResponse(null, { status: 401 });
    }

    // Optional query param: target_date (defaults to CURRENT_DATE in DB)
    const url = new URL(request.url);
    const targetDate =
      url.searchParams.get("target_date") ||
      new Date().toISOString().split("T")[0];

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("run_billing", {
      p_target_date: targetDate,
    });

    if (error) {
      console.error("Billing engine RPC error:", error);
      return NextResponse.json(
        { success: false, error: "Internal billing error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: data,
    });
  } catch (err) {
    console.error("Unexpected cron execution error:", err);
    return new NextResponse(null, { status: 500 });
  }
}
