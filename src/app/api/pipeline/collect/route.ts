import { supabaseService } from "@/lib/supabase-service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { scrapeUserTweets } from "@/lib/scraper";
import { guardCron } from "@/lib/cron-auth";
import { logActivity } from "@/lib/queries";

export const maxDuration = 300;

const NOISE_PATTERNS = [
  /^gm\b/i, /\bgiveaway\b/i, /\bfollow\s+(&|and)\s+rt\b/i,
  /\bRT\s+to\s+win\b/i, /\blike\s+(&|and)\s+(follow|rt)\b/i, /^gn\b/i,
];
function isNoise(content: string) {
  return content.length < 30 || NOISE_PATTERNS.some((p) => p.test(content));
}
function extractHashtags(c: string) { return (c.match(/#\w+/g) ?? []).map(t => t.toLowerCase()); }
function extractMentions(c: string) { return (c.match(/@\w+/g) ?? []).map(t => t.toLowerCase()); }

async function runCollect(userId: string) {
  const startedAt = Date.now();
  let collected = 0, skipped = 0, failed = 0;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: accounts } = await supabaseService
    .from("accounts").select("*")
    .eq("user_id", userId).eq("active", true)
    .order("priority", { ascending: false });

  if (!accounts?.length) return { message: "No active accounts to scrape", collected: 0 };

  for (const account of accounts) {
    try {
      const tweets = await scrapeUserTweets(account.username);
      for (const tweet of tweets) {
        if (isNoise(tweet.content) || new Date(tweet.posted_at) < cutoff) { skipped++; continue; }
        const { error } = await supabaseService.from("tweets").upsert(
          {
            user_id: userId,
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
          { onConflict: "tweet_id", ignoreDuplicates: true },
        );
        if (!error) collected++;
      }
      await supabaseService.from("accounts").update({ last_checked: new Date().toISOString() }).eq("id", account.id);
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 300));
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  await logActivity(userId, "tweet_collected",
    `Collection complete: ${collected} new tweets from ${accounts.length} accounts (${skipped} filtered, ${failed} failed) in ${duration}s`,
    { collected, skipped, failed, accounts: accounts.length, duration_seconds: duration },
  );
  return { collected, skipped, failed, accounts: accounts.length, duration_seconds: duration };
}

// Called from dashboard (user session via cookies)
export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await runCollect(user.id));
}

// Called by cron — runs for ALL users
export function GET(request: Request) {
  return guardCron(request, async () => {
    const { data: rows } = await supabaseService
      .from("accounts").select("user_id").eq("active", true).not("user_id", "is", null);
    const userIds = [...new Set(rows?.map(r => r.user_id).filter(Boolean) as string[])];
    let totalCollected = 0;
    for (const userId of userIds) {
      const result = await runCollect(userId);
      totalCollected += result.collected ?? 0;
    }
    return Response.json({ total_collected: totalCollected, users_processed: userIds.length });
  });
}
