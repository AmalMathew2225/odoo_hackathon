"use client";

import React, { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            Security Update
          </span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Set New Password
          </h1>
          <p className="text-xs text-neutral-500">
            Minimum 9 characters with uppercase, lowercase, and special character
          </p>
        </div>

        {state?.error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            required
            placeholder="••••••••••••"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••••••"
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
