import { getAuthContext } from "@/lib/supabase-server";
import { logActivity } from "@/lib/queries";
import { errResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { searchParams } = request.nextUrl;
  const ecosystem = searchParams.get("ecosystem");
  const category = searchParams.get("category");
  const active = searchParams.get("active");

  let query = supabase.from("accounts").select("*").eq("user_id", user.id).order("priority", { ascending: false });
  if (ecosystem) query = query.eq("ecosystem", ecosystem);
  if (category) query = query.eq("category", category);
  if (active !== null) query = query.eq("active", active === "true");

  const { data, error } = await query;
  if (error) return errResponse(error);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const body = await request.json();
  const { data, error } = await supabase.from("accounts").insert({
    user_id: user.id,
    username: body.username,
    display_name: body.display_name ?? null,
    ecosystem: body.ecosystem ?? null,
    category: body.category ?? null,
    priority: body.priority ?? 5,
    active: body.active ?? true,
    notes: body.notes ?? null,
    follower_count: body.follower_count ?? null,
    avatar_url: body.avatar_url ?? null,
  }).select().single();

  if (error) return errResponse(error);
  await logActivity(user.id, "source_added",
    `Added source @${body.username} (${body.ecosystem ?? "unset"} · ${body.category ?? "unset"})`,
    { username: body.username },
  );
  return Response.json(data, { status: 201 });
}
