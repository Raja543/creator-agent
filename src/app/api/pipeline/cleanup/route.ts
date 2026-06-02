import { supabase } from "@/lib/supabase";
import { guardCron } from "@/lib/cron-auth";
import { logActivity } from "@/lib/queries";

const RETENTION_DAYS = 7;

export async function POST() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [eventsResult, ideasResult] = await Promise.all([
    supabase.from("events").delete().lt("created_at", cutoff).select("id"),
    // Only delete ideas still in "idea" status — keep anything actively being worked on
    supabase.from("content_ideas").delete().lt("created_at", cutoff).eq("status", "idea").select("id"),
  ]);

  const eventsDeleted = eventsResult.data?.length ?? 0;
  const ideasDeleted = ideasResult.data?.length ?? 0;

  await logActivity(
    "system",
    `Auto-cleanup: removed ${eventsDeleted} events and ${ideasDeleted} stale ideas older than ${RETENTION_DAYS} days`,
    { events_deleted: eventsDeleted, ideas_deleted: ideasDeleted, cutoff },
  );

  return Response.json({
    events_deleted: eventsDeleted,
    ideas_deleted: ideasDeleted,
    cutoff,
    message: `Removed ${eventsDeleted} events and ${ideasDeleted} stale ideas older than ${RETENTION_DAYS} days`,
  });
}

export function GET(request: Request) {
  return guardCron(request, POST);
}
