import { supabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ecosystem = searchParams.get("ecosystem");
  const category = searchParams.get("category");
  const active = searchParams.get("active");

  let query = supabase.from("accounts").select("*").order("priority", { ascending: false });

  if (ecosystem) query = query.eq("ecosystem", ecosystem);
  if (category) query = query.eq("category", category);
  if (active !== null) query = query.eq("active", active === "true");

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      username: body.username,
      display_name: body.display_name ?? null,
      ecosystem: body.ecosystem ?? null,
      category: body.category ?? null,
      priority: body.priority ?? 5,
      active: body.active ?? true,
      notes: body.notes ?? null,
      follower_count: body.follower_count ?? null,
      avatar_url: body.avatar_url ?? null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from("activities").insert({
    type: "source_added",
    message: `Added source @${body.username} (${body.ecosystem ?? "unset"} · ${body.category ?? "unset"})`,
    metadata: { username: body.username },
  });

  return Response.json(data, { status: 201 });
}
