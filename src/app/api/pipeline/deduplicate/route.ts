import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { guardCron } from "@/lib/cron-auth";

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 2);
}
function similarity(a: string, b: string): number {
  const wa = new Set(tokenize(a));
  const wb = tokenize(b);
  if (!wa.size || !wb.length) return 0;
  return wb.filter(w => wa.has(w)).length / Math.max(wa.size, wb.length);
}
function findDuplicates<T extends { id: string; title: string }>(items: T[], scoreKey?: keyof T, threshold = 0.55): string[] {
  const toDelete = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    if (toDelete.has(items[i].id)) continue;
    for (let j = i + 1; j < items.length; j++) {
      if (toDelete.has(items[j].id)) continue;
      if (similarity(items[i].title, items[j].title) >= threshold) {
        const scoreI = scoreKey ? (items[i][scoreKey] as number ?? 0) : 0;
        const scoreJ = scoreKey ? (items[j][scoreKey] as number ?? 0) : 0;
        toDelete.add(scoreI >= scoreJ ? items[j].id : items[i].id);
      }
    }
  }
  return [...toDelete];
}

async function runDeduplicate(userId: string) {
  const { data: events } = await supabaseService
    .from("events").select("id, title, importance_score, ecosystem, category")
    .eq("user_id", userId).order("created_at", { ascending: false });

  let eventsDeleted = 0;
  if (events?.length) {
    const groups = new Map<string, typeof events>();
    for (const e of events) {
      const key = `${e.ecosystem ?? "null"}|${e.category ?? "null"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    for (const group of groups.values()) {
      const ids = findDuplicates(group.map(e => ({ id: e.id as string, title: e.title as string, score: e.importance_score as number })), "score");
      if (ids.length) { await supabaseService.from("events").delete().in("id", ids); eventsDeleted += ids.length; }
    }
  }

  const { data: ideas } = await supabaseService
    .from("content_ideas").select("id, title, priority")
    .eq("user_id", userId).order("created_at", { ascending: false });

  let ideasDeleted = 0;
  if (ideas?.length) {
    const ids = findDuplicates(ideas.map(i => ({ id: i.id as string, title: i.title as string, priority: i.priority as number })), "priority");
    if (ids.length) { await supabaseService.from("content_ideas").delete().in("id", ids); ideasDeleted = ids.length; }
  }

  return { events_deleted: eventsDeleted, ideas_deleted: ideasDeleted,
    message: `Removed ${eventsDeleted} duplicate events and ${ideasDeleted} duplicate ideas` };
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
  return Response.json(await runDeduplicate(user.id));
}

export function GET(request: Request) {
  return guardCron(request, async () => {
    const { data: rows } = await supabaseService.from("events").select("user_id").not("user_id", "is", null);
    const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
    const results = [];
    for (const userId of userIds) results.push(await runDeduplicate(userId));
    return Response.json({ users_processed: userIds.length, results });
  });
}
