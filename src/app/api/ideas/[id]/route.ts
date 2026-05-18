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
    .from("content_ideas")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return errResponse(error);

  if (body.status) {
    await logActivity("pipeline_moved",
      `Content idea moved to "${body.status}": ${data.title}`,
      { idea_id: id, status: body.status },
    );
  }

  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("content_ideas").delete().eq("id", id);
  if (error) return errResponse(error);
  return Response.json({ success: true });
}
