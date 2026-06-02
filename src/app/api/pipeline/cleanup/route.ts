import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { guardCron } from "@/lib/cron-auth";
import { logActivity } from "@/lib/queries";

const RETENTION_DAYS = 7;

async function runCleanup(userId: string) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [eventsResult, ideasResult] = await Promise.all([
    supabaseService.from("events").delete().eq("user_id", userId).lt("created_at", cutoff).select("id"),
    supabaseService.from("content_ideas").delete().eq("user_id", userId).lt("created_at", cutoff).eq("status", "idea").select("id"),
  ]);

  const eventsDeleted = eventsResult.data?.length ?? 0;
  const ideasDeleted = ideasResult.data?.length ?? 0;

  await logActivity(userId, "system",
    `Auto-cleanup: removed ${eventsDeleted} events and ${ideasDeleted} stale ideas older than ${RETENTION_DAYS} days`,
    { events_deleted: eventsDeleted, ideas_deleted: ideasDeleted, cutoff },
  );

  return { events_deleted: eventsDeleted, ideas_deleted: ideasDeleted, cutoff,
    message: `Removed ${eventsDeleted} events and ${ideasDeleted} stale ideas older than ${RETENTION_DAYS} days` };
}

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await runCleanup(user.id));
}

export function GET(request: Request) {
  return guardCron(request, async () => {
    const { data: rows } = await supabaseService
      .from("events").select("user_id").not("user_id", "is", null);
    const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
    const results = [];
    for (const userId of userIds) results.push(await runCleanup(userId));
    return Response.json({ users_processed: userIds.length, results });
  });
}
