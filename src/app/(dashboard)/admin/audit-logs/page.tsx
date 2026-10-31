import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireAuth(["admin"]);
  const supabase = createAdminClient();

  const { data: logs, count } = await supabase
    .from("audit_logs")
    .select(`
      id, action, entity_type, entity_id, old_values, new_values, created_at,
      profiles(email, full_name, role)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Security & Operations Audit Trail
        </h1>
        <p className="text-xs text-neutral-500">
          Append-only cryptographic audit record &bull; {(count || 0).toLocaleString()} actions recorded
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Actor</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">Entity</th>
              <th className="py-2.5 px-4">Audit Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-[11px]">
            {(logs || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400 font-sans">
                  No audit events recorded yet.
                </td>
              </tr>
            ) : (
              (logs || []).map((l: any) => (
                <tr key={l.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="py-2.5 px-4 text-neutral-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {l.profiles?.email || "system"}
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      [{l.profiles?.role || "system"}]
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                    {l.action}
                  </td>
                  <td className="py-2.5 px-4 text-neutral-500">
                    {l.entity_type}:{l.entity_id.substring(0, 8)}...
                  </td>
                  <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300 max-w-md truncate">
                    {JSON.stringify(l.new_values || l.old_values || {})}
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
