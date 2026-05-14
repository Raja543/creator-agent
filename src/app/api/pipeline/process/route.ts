import { supabase } from "@/lib/supabase";
import { classifyTweet } from "@/lib/gemini";
import { isCronAuthorized } from "@/lib/cron-auth";

export const maxDuration = 300;

const IMPORTANCE_THRESHOLD = 4;
const BATCH_SIZE = 15;

export function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST();
}

async function classifyWithRetry(content: string) {
  const result = await classifyTweet(content);
  if (result) return result;
  // One retry after a short pause
  await new Promise((r) => setTimeout(r, 2000));
  return classifyTweet(content);
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

    const classification = await classifyWithRetry(tweet.content);

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

    const ecosystem = (tweet.raw_data as Record<string, string> | null)?.account_ecosystem ?? null;

    const { data: existingEvents } = await supabase
      .from("events")
      .select("id, title, source_tweets, keywords")
      .eq("ecosystem", ecosystem)
      .eq("category", classification.category)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    const clusterTarget = existingEvents?.find((e) => {
      const existingKeywords: string[] = (e.keywords as string[]) ?? [];
      const overlap = classification.keywords.filter((k) => existingKeywords.includes(k));
      return overlap.length >= 2;
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

      await supabase.from("activities").insert({
        type: "event_clustered",
        message: `Tweet from @${tweet.username} clustered into: "${clusterTarget.title}"`,
        metadata: { event_id: clusterTarget.id, tweet_id: tweet.tweet_id },
      });
      clustered++;
    } else {
      const { data: newEvent } = await supabase
        .from("events")
        .insert({
          title: classification.summary,
          summary: classification.summary,
          ecosystem,
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
        await supabase.from("activities").insert({
          type: "event_detected",
          message: `New event [${ecosystem} | ${classification.category} | score ${classification.importance_score}]: ${classification.summary}`,
          metadata: { event_id: newEvent.id, score: classification.importance_score, ecosystem },
        });
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
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
