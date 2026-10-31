import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireAuth(["admin", "staff"]);
  const supabase = createAdminClient();

  const { data: customers, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Customer Directory
        </h1>
        <p className="text-xs text-neutral-500">
          Registered customer accounts for contract assignment
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Customer Name</th>
              <th className="py-2.5 px-4">Company</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Phone</th>
              <th className="py-2.5 px-4">Member Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {(customers || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  No registered customers yet.
                </td>
              </tr>
            ) : (
              (customers || []).map((c: any) => (
                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    {c.full_name || "—"}
                  </td>
                  <td className="py-3 px-4">{c.company_name || "—"}</td>
                  <td className="py-3 px-4 font-mono text-neutral-500">{c.email}</td>
                  <td className="py-3 px-4 font-mono text-neutral-500">{c.phone || "—"}</td>
                  <td className="py-3 px-4 font-mono text-neutral-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
