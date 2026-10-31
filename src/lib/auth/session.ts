import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
}

/**
 * Retrieves the currently authenticated user and their profile record.
 * Cached per-request using React's cache().
 */
export const getCurrentSession = cache(
  async (): Promise<AuthSession | null> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return null;
      }

      // Fetch user profile to read the immutable database role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        // Default to customer role if profile not yet loaded
        return {
          userId: user.id,
          email: user.email?.toLowerCase() || "",
          role: "customer",
          profile: null,
        };
      }

      return {
        userId: user.id,
        email: user.email?.toLowerCase() || profile.email,
        role: profile.role as UserRole,
        profile: profile as Profile,
      };
    } catch (error) {
      console.error("Failed to resolve user session:", error);
      return null;
    }
  },
);

/**
 * Asserts the current user is authenticated and possesses one of the required roles.
 * Throws an Error if unauthorized (Zero-Trust authorization check).
 */
export async function requireAuth(
  allowedRoles?: UserRole[],
): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Unauthorized: Authentication required");
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(session.role)
  ) {
    throw new Error(`Forbidden: Access denied for role "${session.role}"`);
  }

  return session;
}
