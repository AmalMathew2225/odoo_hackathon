"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileFormProps {
  initialData: {
    email: string;
    fullName: string;
    companyName: string;
    phone: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (formData: FormData) => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await resetPasswordAction(null, formData);
      if (res?.error) {
        setStatusMsg(`Error: ${res.error}`);
      } else {
        setStatusMsg("Password updated successfully!");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Read-Only Account Identity */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs text-xs">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          Organization Profile
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase text-neutral-400 font-mono block mb-1">
              Registered Email
            </label>
            <div className="font-mono font-medium">{initialData.email}</div>
          </div>
          <div>
            <label className="text-[11px] uppercase text-neutral-400 font-mono block mb-1">
              Full Name
            </label>
            <div className="font-medium">{initialData.fullName || "—"}</div>
          </div>
          <div>
            <label className="text-[11px] uppercase text-neutral-400 font-mono block mb-1">
              Company Name
            </label>
            <div className="font-medium">{initialData.companyName || "—"}</div>
          </div>
          <div>
            <label className="text-[11px] uppercase text-neutral-400 font-mono block mb-1">
              Phone
            </label>
            <div className="font-mono">{initialData.phone || "—"}</div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xs">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          Update Login Password
        </h3>
        <p className="text-xs text-neutral-500">
          Must be at least 9 characters with uppercase, lowercase, and special
          characters.
        </p>

        {statusMsg && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200">
            {statusMsg}
          </div>
        )}

        <form
          action={handlePasswordSubmit}
          className="space-y-4 max-w-sm text-xs"
        >
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

          <Button type="submit" size="sm" isLoading={isPending}>
            Save New Password
          </Button>
        </form>
      </div>
    </div>
  );
}
