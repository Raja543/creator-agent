import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/queries";
import { errResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const potential = searchParams.get("potential");

  let query = supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (format) query = query.eq("format", format);
  if (potential) query = query.eq("potential", potential);

  const { data, error } = await query;
  if (error) return errResponse(error);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("content_ideas")
    .insert({
      title: body.title,
      description: body.description ?? null,
      format: body.format ?? null,
      angle: body.angle ?? null,
      potential: body.potential ?? "medium",
      source_events: body.source_events ?? null,
      status: body.status ?? "idea",
      notes: body.notes ?? null,
      priority: body.priority ?? 5,
    })
    .select()
    .single();

  if (error) return errResponse(error);

  await logActivity("idea_generated",
    `New content idea: "${body.title}"`,
    { idea_id: data.id, format: body.format },
  );

  return Response.json(data, { status: 201 });
}
