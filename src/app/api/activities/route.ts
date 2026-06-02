import { getAuthContext } from "@/lib/supabase-server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { user, supabase } = ctx;

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const type = searchParams.get("type");

  let query = supabase.from("activities").select("*")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
