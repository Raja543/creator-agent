import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("events")
    .update({
      title: body.title ?? null,
      summary: body.summary ?? null,
      ecosystem: body.ecosystem ?? null,
      category: body.category ?? null,
      importance_score: body.importance_score ?? null,
      keywords: body.keywords ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
