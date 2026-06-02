import { createClient } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/auth-headers";
import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const [userId, supabase] = await Promise.all([getRequestUserId(), createClient()]);

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId!)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">Admin · Sources</div>
        <h1 className="cos-page-title">Manage Accounts</h1>
        <p className="cos-page-sub">Add and categorize all X accounts you want to track. Organize by ecosystem, type, and priority.</p>
      </div>
      <AdminAccountsClient initialAccounts={accounts ?? []} />
    </div>
  );
}
