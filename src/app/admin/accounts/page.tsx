import { supabase } from "@/lib/supabase";
import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";

export default async function AdminAccountsPage() {
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Manage Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add and categorize all X accounts you want to track. Organize by ecosystem, type, and priority.
        </p>
      </div>
      <AdminAccountsClient initialAccounts={accounts ?? []} />
    </div>
  );
}
