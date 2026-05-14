import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("accounts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("activities").insert({
    type: "source_updated",
    message: `Updated source @${data.username}`,
    metadata: { id, username: data.username },
  });

  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: account } = await supabase.from("accounts").select("username").eq("id", id).single();

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (account) {
    await supabase.from("activities").insert({
      type: "source_updated",
      message: `Removed source @${account.username}`,
      metadata: { id },
    });
  }

  return Response.json({ success: true });
}
