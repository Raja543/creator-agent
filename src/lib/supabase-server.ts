import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

/**
 * Reads the validated user ID from the x-user-id header injected by the proxy.
 * The proxy calls getUser() (full JWT validation) so this is secure with zero
 * extra network calls.
 */
export async function getAuthContext() {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return null;

  const supabase = await createClient();
  const user = { id: userId, email: h.get("x-user-email") ?? "" };
  return { user, supabase };
}
