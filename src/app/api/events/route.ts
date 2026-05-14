import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ecosystem = searchParams.get("ecosystem");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  let query = supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ecosystem) query = query.eq("ecosystem", ecosystem);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: body.title,
      summary: body.summary ?? null,
      ecosystem: body.ecosystem ?? null,
      category: body.category ?? null,
      importance_score: body.importance_score ?? null,
      keywords: body.keywords ?? null,
      source_tweets: body.source_tweets ?? null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("activities").insert({
    type: "event_detected",
    message: `New event detected: ${body.title}`,
    metadata: { event_id: data.id, ecosystem: body.ecosystem },
  });

  return Response.json(data, { status: 201 });
}
