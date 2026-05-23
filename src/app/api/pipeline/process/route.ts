import { supabase } from "@/lib/supabase";
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

export function GET(request: Request) { return guardCron(request, POST); }

async function classifyWithRetry(content: string, context?: { ecosystem?: string; category?: string }) {
  const result = await classifyTweet(content, context);
  if (result) return result;
  await new Promise((r) => setTimeout(r, 2000));
  return classifyTweet(content, context);
}

export async function POST() {
  const { data: tweets } = await supabase
    .from("tweets")
    .select("*")
    .eq("processed", false)
    .order("posted_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (!tweets?.length) {
    return Response.json({ message: "No unprocessed tweets", events_created: 0 });
  }

  let eventsCreated = 0;
  let clustered = 0;
  let belowThreshold = 0;
  let failed = 0;
  let processed = 0;

  for (const tweet of tweets) {
    if (!tweet.content) {
      await supabase.from("tweets").update({ processed: true }).eq("id", tweet.id);
      continue;
    }

    const ecosystem = (tweet.raw_data as Record<string, string> | null)?.account_ecosystem ?? undefined;
    const category = (tweet.raw_data as Record<string, string> | null)?.account_category ?? undefined;
    const classification = await classifyWithRetry(tweet.content, { ecosystem, category });

    await supabase.from("tweets").update({ processed: true }).eq("id", tweet.id);
    processed++;

    if (!classification) {
      failed++;
      continue;
    }

    if (!classification.important || classification.importance_score < IMPORTANCE_THRESHOLD) {
      belowThreshold++;
      continue;
    }

    const eventEcosystem = ecosystem ?? null;

    const { data: existingEvents } = await supabase
      .from("events")
      .select("id, title, source_tweets, keywords")
      .eq("ecosystem", eventEcosystem)
      .eq("category", classification.category)
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    const clusterTarget = existingEvents?.find((e) => {
      const existingKeywords: string[] = (e.keywords as string[]) ?? [];
      const keywordOverlap = classification.keywords.filter((k) => existingKeywords.includes(k)).length;
      const titleMatch = titleSimilarity(classification.summary, e.title as string) >= 0.5;
      return keywordOverlap >= 3 || titleMatch;
    });

    if (clusterTarget) {
      const sourceTweets = (clusterTarget.source_tweets as object[] | null) ?? [];
      await supabase
        .from("events")
        .update({
          source_tweets: [
            ...sourceTweets,
            { tweet_id: tweet.tweet_id, username: tweet.username, url: tweet.url, content: tweet.content },
          ],
        })
        .eq("id", clusterTarget.id);

      await logActivity("event_clustered",
        `Tweet from @${tweet.username} clustered into: "${clusterTarget.title}"`,
        { event_id: clusterTarget.id, tweet_id: tweet.tweet_id },
      );
      clustered++;
    } else {
      const { data: newEvent } = await supabase
        .from("events")
        .insert({
          title: classification.summary,
          summary: classification.summary,
          ecosystem: eventEcosystem,
          category: classification.category,
          importance_score: classification.importance_score,
          keywords: classification.keywords,
          source_tweets: [
            { tweet_id: tweet.tweet_id, username: tweet.username, url: tweet.url, content: tweet.content },
          ],
        })
        .select()
        .single();

      if (newEvent) {
        eventsCreated++;
        await logActivity("event_detected",
          `New event [${eventEcosystem} | ${classification.category} | score ${classification.importance_score}]: ${classification.summary}`,
          { event_id: newEvent.id, score: classification.importance_score, ecosystem: eventEcosystem },
        );
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return Response.json({
    processed,
    events_created: eventsCreated,
    clustered,
    below_threshold: belowThreshold,
    groq_failed: failed,
    tweets_total: tweets.length,
  });
}
