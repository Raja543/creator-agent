import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/queries";
import { errResponse } from "@/lib/utils";
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

  if (error) return errResponse(error);

  await logActivity("source_updated",
    `Updated source @${data.username}`,
    { id, username: data.username },
  );

  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: account } = await supabase.from("accounts").select("username").eq("id", id).single();

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return errResponse(error);

  if (account) {
    await logActivity("source_updated",
      `Removed source @${account.username}`,
      { id },
    );
  }

  return Response.json({ success: true });
}
