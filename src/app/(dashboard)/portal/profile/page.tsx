import { requireAuth } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function PortalProfilePage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Account Profile & Credentials
        </h1>
        <p className="text-xs text-neutral-500">
          Manage your organization information and update your login password
        </p>
      </div>

      <ProfileForm
        initialData={{
          email: session.email,
          fullName: session.profile?.full_name || "",
          companyName: session.profile?.company_name || "",
          phone: session.profile?.phone || "",
        }}
      />
    </div>
  );
}

