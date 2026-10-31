"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            Account Recovery
          </span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500">
            Enter your email to receive a single-use recovery link
          </p>
        </div>

        {state?.message && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200">
            {state.message}
          </div>
        )}

        {state?.error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="your-email@example.com"
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            Send Recovery Link
          </Button>
        </form>

        <div className="text-center text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
