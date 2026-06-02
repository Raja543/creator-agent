import { supabaseService } from "@/lib/supabase-service";

// POST — validate email + invite code before signup
export async function POST(request: Request) {
  const { email, invite_code } = await request.json();

  if (!email || !invite_code) {
    return Response.json({ error: "Email and invite code are required" }, { status: 400 });
  }

  const { data: invite } = await supabaseService
    .from("invites")
    .select("id, used_at")
    .eq("email", email.toLowerCase())
    .eq("code", invite_code)
    .maybeSingle();

  if (!invite) {
    return Response.json({ error: "Invalid invite code for this email" }, { status: 403 });
  }

  if (invite.used_at) {
    return Response.json({ error: "This invite has already been used" }, { status: 403 });
  }

  return Response.json({ valid: true });
}

// PATCH — mark invite as used after successful signup
export async function PATCH(request: Request) {
  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  await supabaseService
    .from("invites")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());

  return Response.json({ ok: true });
}
