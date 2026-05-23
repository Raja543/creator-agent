import { supabase } from "@/lib/supabase";
import { guardCron } from "@/lib/cron-auth";

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 2);
}

function similarity(a: string, b: string): number {
  const wa = new Set(tokenize(a));
  const wb = tokenize(b);
  if (!wa.size || !wb.length) return 0;
  const overlap = wb.filter(w => wa.has(w)).length;
  return overlap / Math.max(wa.size, wb.length);
}

/** Returns IDs of duplicates to delete, keeping the best item in each group. */
function findDuplicates<T extends { id: string; title: string }>(
  items: T[],
  scoreKey?: keyof T,
  threshold = 0.55,
): string[] {
  const toDelete = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    if (toDelete.has(items[i].id)) continue;
    for (let j = i + 1; j < items.length; j++) {
      if (toDelete.has(items[j].id)) continue;
      if (similarity(items[i].title, items[j].title) >= threshold) {
        // Keep the one with higher score, or the newer one (lower index = newer because sorted desc)
        const scoreI = scoreKey ? (items[i][scoreKey] as number ?? 0) : 0;
        const scoreJ = scoreKey ? (items[j][scoreKey] as number ?? 0) : 0;
        toDelete.add(scoreI >= scoreJ ? items[j].id : items[i].id);
      }
    }
  }

  return [...toDelete];
}

export async function POST() {
  // --- Deduplicate events ---
  const { data: events } = await supabase
    .from("events")
    .select("id, title, importance_score, ecosystem, category")
    .order("created_at", { ascending: false });

  let eventsDeleted = 0;
  if (events?.length) {
    // Group by ecosystem+category, deduplicate within each group
    const groups = new Map<string, typeof events>();
    for (const e of events) {
      const key = `${e.ecosystem ?? "null"}|${e.category ?? "null"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }

    for (const group of groups.values()) {
      const idsToDelete = findDuplicates(
        group.map(e => ({ id: e.id as string, title: e.title as string, score: e.importance_score as number })),
        "score",
      );
      if (idsToDelete.length) {
        await supabase.from("events").delete().in("id", idsToDelete);
        eventsDeleted += idsToDelete.length;
      }
    }
  }

  // --- Deduplicate content_ideas ---
  const { data: ideas } = await supabase
    .from("content_ideas")
    .select("id, title, priority")
    .order("created_at", { ascending: false });

  let ideasDeleted = 0;
  if (ideas?.length) {
    const idsToDelete = findDuplicates(
      ideas.map(i => ({ id: i.id as string, title: i.title as string, priority: i.priority as number })),
      "priority",
    );
    if (idsToDelete.length) {
      await supabase.from("content_ideas").delete().in("id", idsToDelete);
      ideasDeleted = idsToDelete.length;
    }
  }

  return Response.json({
    events_deleted: eventsDeleted,
    ideas_deleted: ideasDeleted,
    message: `Removed ${eventsDeleted} duplicate events and ${ideasDeleted} duplicate ideas`,
  });
}

export function GET(request: Request) {
  return guardCron(request, POST);
}
