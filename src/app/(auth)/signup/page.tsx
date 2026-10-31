"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);
  const [password, setPassword] = useState("");

  const hasLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            Brightloop Software
          </span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Create Customer Account
          </h1>
          <p className="text-xs text-neutral-500">
            View quotations, manage active subscriptions and track invoices
          </p>
        </div>

        {state?.error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Input
            label="Full Name"
            name="fullName"
            type="text"
            required
            placeholder="Arthur Pendelton"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              name="companyName"
              type="text"
              placeholder="Acme Corp Ltd"
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="arthur@acmecorp.com"
            helperText="One account per email. Case-insensitive."
          />

          <div className="space-y-1">
            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            {/* Live Password Rules Indicator */}
            <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 mt-2 space-y-1 text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-[11px] uppercase tracking-wider block mb-1">
                Security Requirements:
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasLength ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-400"}`}>
                  <span>{hasLength ? "✓" : "○"}</span>
                  <span>9+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-400"}`}>
                  <span>{hasUpper ? "✓" : "○"}</span>
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-400"}`}>
                  <span>{hasLower ? "✓" : "○"}</span>
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-400"}`}>
                  <span>{hasSpecial ? "✓" : "○"}</span>
                  <span>Special character</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={!isPasswordValid || isPending}
            isLoading={isPending}
          >
            Create Customer Account
          </Button>
        </form>

        <div className="text-center text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
