"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            Brightloop Operations
          </span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Sign In to System
          </h1>
          <p className="text-xs text-neutral-500">
            Access subscription contracts, billing, and invoices
          </p>
        </div>

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
            placeholder="alex@brightloop.com"
          />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-xs font-semibold tracking-wide text-neutral-700 dark:text-neutral-300 uppercase"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="•••••••••"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
          Need a customer portal account?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
          >
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
