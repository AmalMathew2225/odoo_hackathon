"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Password rule: > 8 chars (9+), 1 uppercase, 1 lowercase, 1 special char
const passwordSchema = z
  .string()
  .min(9, "Password must be at least 9 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const signupSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: passwordSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export async function signupAction(_prevState: unknown, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    phone: formData.get("phone"),
  };

  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { email, password, fullName, companyName, phone } = parsed.data;

  // Rate Limiting check on signup by email
  const adminClient = createAdminClient();
  const { data: allowed } = await adminClient.rpc("check_rate_limit", {
    p_key: `signup:${email}`,
    p_max_attempts: 5,
    p_window_seconds: 300, // 5 attempts per 5 minutes
  });

  if (allowed === false) {
    return {
      error: "Too many sign up attempts. Please try again in a few minutes.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName || "",
        phone: phone || "",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to portal or login
  redirect("/portal/subscriptions");
}

export async function loginAction(_prevState: unknown, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { email, password } = parsed.data;

  // Rate limiting on login
  const adminClient = createAdminClient();
  const { data: allowed } = await adminClient.rpc("check_rate_limit", {
    p_key: `login:${email}`,
    p_max_attempts: 5,
    p_window_seconds: 300,
  });

  if (allowed === false) {
    return {
      error:
        "Too many failed attempts. Account temporarily locked for 5 minutes.",
    };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return { error: "Invalid email or password" };
  }

  // Check user role for proper redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  const role = profile?.role || "customer";

  if (role === "admin" || role === "staff") {
    redirect("/dashboard");
  } else {
    redirect("/portal/subscriptions");
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: unknown,
  formData: FormData,
) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  // Rate limit password resets
  const adminClient = createAdminClient();
  await adminClient.rpc("check_rate_limit", {
    p_key: `reset:${email}`,
    p_max_attempts: 3,
    p_window_seconds: 600,
  });

  const supabase = await createClient();
  // Safe messaging: Always display the same text regardless of whether user exists
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
  });

  return {
    success: true,
    message:
      "If that email is registered in our system, a password reset link has been dispatched.",
  };
}

export async function resetPasswordAction(
  _prevState: unknown,
  formData: FormData,
) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const parseResult = passwordSchema.safeParse(password);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?reset=success");
}
