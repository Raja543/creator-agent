import { supabase } from "@/lib/supabase";
import { scrapeUserTweets } from "@/lib/scraper";
import { guardCron } from "@/lib/cron-auth";
import { logActivity } from "@/lib/queries";

export const maxDuration = 300; // 5 min — requires Vercel Pro; on hobby runs locally fine

// Noise patterns to filter out before storing
const NOISE_PATTERNS = [
  /^gm\b/i,
  /\bgiveaway\b/i,
  /\bfollow\s+(&|and)\s+rt\b/i,
  /\bRT\s+to\s+win\b/i,
  /\blike\s+(&|and)\s+(follow|rt)\b/i,
  /^gn\b/i,
];

function isNoise(content: string): boolean {
  if (content.length < 30) return true;
  return NOISE_PATTERNS.some((p) => p.test(content));
}

function extractHashtags(content: string): string[] {
  return (content.match(/#\w+/g) ?? []).map((t) => t.toLowerCase());
}

function extractMentions(content: string): string[] {
  return (content.match(/@\w+/g) ?? []).map((t) => t.toLowerCase());
}

export function GET(request: Request) { return guardCron(request, POST); }

export async function POST() {
  const startedAt = Date.now();
  let collected = 0;
  let skipped = 0;
  let failed = 0;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all active accounts ordered by priority
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (!accounts?.length) {
    return Response.json({ message: "No active accounts to scrape", collected: 0 });
  }

  for (const account of accounts) {
    try {
      const tweets = await scrapeUserTweets(account.username);

      for (const tweet of tweets) {
        if (isNoise(tweet.content)) {
          skipped++;
          continue;
        }

        // Skip tweets older than 7 days
        if (new Date(tweet.posted_at) < cutoff) {
          skipped++;
          continue;
        }

        // Upsert — skip if tweet_id already stored
        const { error } = await supabase.from("tweets").upsert(
          {
            tweet_id: tweet.tweet_id,
            username: tweet.username,
            display_name: account.display_name,
            content: tweet.content,
            url: tweet.url,
            posted_at: tweet.posted_at,
            processed: false,
            raw_data: {
              hashtags: extractHashtags(tweet.content),
              mentions: extractMentions(tweet.content),
              account_ecosystem: account.ecosystem,
              account_category: account.category,
              account_priority: account.priority,
            },
          },
          { onConflict: "tweet_id", ignoreDuplicates: true }
        );

        if (!error) collected++;
      }

      // Update last_checked timestamp
      await supabase
        .from("accounts")
        .update({ last_checked: new Date().toISOString() })
        .eq("id", account.id);

    } catch {
      failed++;
    }

    // Small delay between accounts
    await new Promise((r) => setTimeout(r, 300));
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);

  await logActivity("tweet_collected",
    `Collection run complete — ${collected} new tweets from ${accounts.length} accounts (${skipped} noise filtered, ${failed} failed) in ${duration}s`,
    { collected, skipped, failed, accounts: accounts.length, duration_seconds: duration },
  );

  return Response.json({ collected, skipped, failed, accounts: accounts.length, duration_seconds: duration });
}
