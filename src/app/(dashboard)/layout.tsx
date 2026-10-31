import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar
        role={session.role}
        userEmail={session.email}
        userName={session.profile?.full_name || ""}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={session.role} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
