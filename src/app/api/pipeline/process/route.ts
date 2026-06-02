import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { classifyTweet } from "@/lib/gemini";
import { guardCron } from "@/lib/cron-auth";
import { logActivity } from "@/lib/queries";

export const maxDuration = 300;

const IMPORTANCE_THRESHOLD = 5;
const BATCH_SIZE = 25;

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 2);
}
function titleSimilarity(a: string, b: string): number {
  const wa = new Set(tokenize(a));
  const wb = tokenize(b);
  if (!wa.size || !wb.length) return 0;
  const overlap = wb.filter(w => wa.has(w)).length;
  return overlap / Math.max(wa.size, wb.length);
}

async function classifyWithRetry(content: string, context?: { ecosystem?: string; category?: string }) {
  const result = await classifyTweet(content, context);
  if (result) return result;
  await new Promise(r => setTimeout(r, 2000));
  return classifyTweet(content, context);
}

async function runProcess(userId: string) {
  const { data: tweets } = await supabaseService
    .from("tweets").select("*")
    .eq("user_id", userId).eq("processed", false)
    .order("posted_at", { ascending: false }).limit(BATCH_SIZE);

  if (!tweets?.length) return { message: "No unprocessed tweets", events_created: 0 };

  let eventsCreated = 0, clustered = 0, belowThreshold = 0, failed = 0, processed = 0;

  for (const tweet of tweets) {
    if (!tweet.content) {
      await supabaseService.from("tweets").update({ processed: true }).eq("id", tweet.id);
      continue;
    }

    const ecosystem = (tweet.raw_data as Record<string, string> | null)?.account_ecosystem ?? undefined;
    const category = (tweet.raw_data as Record<string, string> | null)?.account_category ?? undefined;
    const classification = await classifyWithRetry(tweet.content, { ecosystem, category });

    await supabaseService.from("tweets").update({ processed: true }).eq("id", tweet.id);
    processed++;

    if (!classification) { failed++; continue; }
    if (!classification.important || classification.importance_score < IMPORTANCE_THRESHOLD) { belowThreshold++; continue; }

    const eventEcosystem = ecosystem ?? null;

    const { data: existingEvents } = await supabaseService
      .from("events").select("id, title, source_tweets, keywords")
      .eq("user_id", userId).eq("ecosystem", eventEcosystem).eq("category", classification.category)
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false }).limit(10);

    const clusterTarget = existingEvents?.find((e) => {
      const existingKeywords: string[] = (e.keywords as string[]) ?? [];
      const keywordOverlap = classification.keywords.filter(k => existingKeywords.includes(k)).length;
      const titleMatch = titleSimilarity(classification.summary, e.title as string) >= 0.5;
      return keywordOverlap >= 3 || titleMatch;
    });

    if (clusterTarget) {
      const sourceTweets = (clusterTarget.source_tweets as object[] | null) ?? [];
      await supabaseService.from("events").update({
        source_tweets: [...sourceTweets, { tweet_id: tweet.tweet_id, username: tweet.username, url: tweet.url, content: tweet.content }],
      }).eq("id", clusterTarget.id);
      await logActivity(userId, "event_clustered", `Tweet from @${tweet.username} clustered into: "${clusterTarget.title}"`, { event_id: clusterTarget.id });
      clustered++;
    } else {
      const { data: newEvent } = await supabaseService.from("events").insert({
        user_id: userId,
        title: classification.summary,
        summary: classification.summary,
        ecosystem: eventEcosystem,
        category: classification.category,
        importance_score: classification.importance_score,
        keywords: classification.keywords,
        source_tweets: [{ tweet_id: tweet.tweet_id, username: tweet.username, url: tweet.url, content: tweet.content }],
      }).select().single();

      if (newEvent) {
        eventsCreated++;
        await logActivity(userId, "event_detected",
          `New event [${eventEcosystem} | ${classification.category} | score ${classification.importance_score}]: ${classification.summary}`,
          { event_id: newEvent.id, score: classification.importance_score },
        );
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  return { processed, events_created: eventsCreated, clustered, below_threshold: belowThreshold, groq_failed: failed, tweets_total: tweets.length };
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
  return Response.json(await runProcess(user.id));
}

export function GET(request: Request) {
  return guardCron(request, async () => {
    const { data: rows } = await supabaseService
      .from("tweets").select("user_id").eq("processed", false).not("user_id", "is", null);
    const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
    const results = [];
    for (const userId of userIds) results.push(await runProcess(userId));
    return Response.json({ users_processed: userIds.length, results });
  });
}
