"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { createStaffAccount, updateUserRole } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function StaffClient({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createStaffAccount(null, formData);
      if (res?.error) setError(res.error);
      else setIsModalOpen(false);
    });
  };

  const handleRoleChange = (userId: string, newRole: any) => {
    if (!confirm(`Update user role to ${newRole}?`)) return;
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Internal Staff & User Governance
          </h1>
          <p className="text-xs text-neutral-500">
            Admin privileged provisioning via service-role key &bull; Immutable
            role hierarchy
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Provision Staff Account</span>
        </Button>
      </div>

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4">User</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Company</th>
              <th className="py-2.5 px-4">Current Role</th>
              <th className="py-2.5 px-4 text-right">Assign Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                  {u.full_name || "—"}
                </td>
                <td className="py-3 px-4 font-mono text-neutral-500">
                  {u.email}
                </td>
                <td className="py-3 px-4 text-neutral-500">
                  {u.company_name || "—"}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] uppercase font-bold border ${
                      u.role === "admin"
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900"
                        : u.role === "staff"
                          ? "bg-neutral-200 text-neutral-800 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-200"
                          : "bg-neutral-50 text-neutral-500 border-neutral-300 dark:bg-neutral-950 dark:border-neutral-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="h-7 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 text-xs font-mono"
                  >
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Staff Member"
        description="Created securely on server using service-role key."
      >
        {error && (
          <div className="rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-2 text-xs mb-3">
            {error}
          </div>
        )}
        <form action={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Full Name"
            name="fullName"
            required
            placeholder="Sarah Connor"
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="sarah@brightloop.com"
          />
          <Input
            label="Initial Password"
            name="password"
            type="password"
            required
            placeholder="Minimum 9 characters..."
          />
          <Input
            label="Phone (Optional)"
            name="phone"
            placeholder="+91 98765 43211"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
