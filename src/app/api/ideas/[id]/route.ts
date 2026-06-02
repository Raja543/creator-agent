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
  const { data, error } = await supabase.from("content_ideas")
    .update(body).eq("id", id).eq("user_id", user.id).select().single();

  if (error) return errResponse(error);
  if (body.status) {
    await logActivity(user.id, "pipeline_moved",
      `Content idea moved to "${body.status}": ${data.title}`,
      { idea_id: id, status: body.status },
    );
  }
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { id } = await params;
  const { error } = await supabase.from("content_ideas").delete().eq("id", id).eq("user_id", user.id);
  if (error) return errResponse(error);
  return Response.json({ success: true });
}
