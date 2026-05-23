import { supabase } from "@/lib/supabase";
import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";

export const revalidate = 60;

export default async function AdminAccountsPage() {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
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
