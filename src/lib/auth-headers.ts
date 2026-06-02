import { headers } from "next/headers";

/** Read user_id injected by middleware — zero network calls. */
export async function getRequestUserId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-user-id");
}

export async function getRequestUserEmail(): Promise<string | null> {
  const h = await headers();
  return h.get("x-user-email");
}

/** True only for the account whose ID matches ADMIN_USER_ID env var. */
export async function getRequestIsAdmin(): Promise<boolean> {
  const h = await headers();
  return h.get("x-is-admin") === "1";
}
