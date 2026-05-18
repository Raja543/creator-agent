import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/queries";
import { errResponse } from "@/lib/utils";
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
  if (error) return errResponse(error);
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

  if (error) return errResponse(error);

  await logActivity("event_detected",
    `New event detected: ${body.title}`,
    { event_id: data.id, ecosystem: body.ecosystem },
  );

  return Response.json(data, { status: 201 });
}
