"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const createStaffSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase().trim(),
  password: z.string().min(9, "Password must be at least 9 characters"),
  fullName: z.string().min(2, "Full name required").trim(),
  phone: z.string().optional(),
});

/**
 * Creates an internal Staff account.
 * Enforces: ONLY an Admin can perform this mutation using service_role key.
 */
export async function createStaffAccount(
  _prevState: unknown,
  formData: FormData,
) {
  // Step 1: Zero-Trust Auth Verification (Must be Admin)
  const session = await requireAuth(["admin"]);

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  };

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const { email, password, fullName, phone } = parsed.data;
  const adminClient = createAdminClient();

  // Create Auth User
  const { data: userData, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || "",
      },
    });

  if (createError || !userData.user) {
    return { error: createError?.message || "Failed to create user" };
  }

  // Update profile role to 'staff'
  const { error: roleError } = await adminClient
    .from("profiles")
    .update({
      role: "staff",
      full_name: fullName,
      phone: phone || "",
    })
    .eq("id", userData.user.id);

  if (roleError) {
    return { error: "Created user but failed to assign staff role" };
  }

  // Record audit log
  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: "admin",
    action: "create_staff_account",
    entity_type: "staff",
    entity_id: userData.user.id,
    new_values: { email, full_name: fullName, role: "staff" },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function updateUserRole(
  userId: string,
  newRole: "customer" | "staff" | "admin",
) {
  const session = await requireAuth(["admin"]);
  const adminClient = createAdminClient();

  const { data: current } = await adminClient
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .single();

  const { error } = await adminClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await adminClient.from("audit_logs").insert({
    actor_id: session.userId,
    actor_role: "admin",
    action: "update_role",
    entity_type: "profile",
    entity_id: userId,
    old_values: { role: current?.role },
    new_values: { role: newRole },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}
