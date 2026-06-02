import { supabaseService } from "@/lib/supabase-service";
import { InvitesClient } from "@/components/admin/InvitesClient";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const { data: invites } = await supabaseService
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="cos-page space-y-4">
      <div className="cos-page-head">
        <div className="cos-eyebrow">Admin · Beta</div>
        <h1 className="cos-page-title">Invites</h1>
        <p className="cos-page-sub">Manage beta access. Each invite is tied to an email and a unique code.</p>
      </div>
      <InvitesClient initialInvites={invites ?? []} />
    </div>
  );
}
