import { getAuthContext } from "@/lib/supabase-server";
import { errResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase.from("events").update({
    title: body.title ?? null,
    summary: body.summary ?? null,
    ecosystem: body.ecosystem ?? null,
    category: body.category ?? null,
    importance_score: body.importance_score ?? null,
    keywords: body.keywords ?? null,
  }).eq("id", id).eq("user_id", user.id).select().single();

  if (error) return errResponse(error);
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { id } = await params;
  const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", user.id);
  if (error) return errResponse(error);
  return new Response(null, { status: 204 });
}
