import { supabaseService } from "@/lib/supabase-service";
import { getRequestUserId, getRequestIsAdmin } from "@/lib/auth-headers";
import { nanoid } from "nanoid";

export async function GET() {
  if (!(await getRequestIsAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseService
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const userId = await getRequestUserId();
  if (!userId || !(await getRequestIsAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const code = nanoid(10).toUpperCase();

  const { data, error } = await supabaseService
    .from("invites")
    .insert({ email: email.toLowerCase(), code, invited_by: userId })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await getRequestIsAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabaseService.from("invites").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
