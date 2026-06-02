import { getAuthContext } from "@/lib/supabase-server";
import { logActivity } from "@/lib/queries";
import { errResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase
    .from("accounts").update(body).eq("id", id).eq("user_id", user.id).select().single();

  if (error) return errResponse(error);
  await logActivity(user.id, "source_updated", `Updated source @${data.username}`, { id, username: data.username });
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { id } = await params;
  const { data: account } = await supabase.from("accounts").select("username").eq("id", id).eq("user_id", user.id).single();
  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return errResponse(error);
  if (account) await logActivity(user.id, "source_updated", `Removed source @${account.username}`, { id });
  return Response.json({ success: true });
}
