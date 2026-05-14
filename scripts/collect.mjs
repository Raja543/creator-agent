#!/usr/bin/env node
// Runs directly in GitHub Actions (Azure IPs) — no Vercel, no proxies needed
// Requires Node 18+ (native fetch). No npm install needed.

// Load .env file if running locally
import { readFileSync } from "fs";
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.tiekoetter.com",
  "https://nitter.1d4.us",
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const NOISE = [
  /^gm\b/i, /^gn\b/i,
  /\bgiveaway\b/i,
  /\bfollow\s+(&|and)\s+rt\b/i,
  /\bRT\s+to\s+win\b/i,
  /\blike\s+(&|and)\s+(follow|rt)\b/i,
];

const isNoise = (t) => t.length < 30 || NOISE.some((p) => p.test(t));

// --- Supabase REST helpers ---
const headers = (extra = {}) => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

async function sbGet(table, qs) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: headers() });
  return r.json();
}

async function sbUpsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=ignore-duplicates" }),
    body: JSON.stringify(body),
  });
  return r.ok;
}

async function sbInsert(table, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
}

async function sbPatch(table, id, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
}

// --- RSS helpers ---
function extractId(link) {
  return link.match(/\/status\/(\d+)/)?.[1] ?? link;
}

function parseItem(item, username) {
  const title =
    item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
    item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
  const link =
    item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ??
    item.match(/<guid>([\s\S]*?)<\/guid>/)?.[1] ?? "";
  const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";

  if (!title || !link || title.startsWith("RT by @")) return null;

  const content = title
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .trim();

  const id = extractId(link);
  return {
    tweet_id: id,
    username,
    content,
    url: `https://x.com/${username}/status/${id}`,
    posted_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  };
}

async function fetchRss(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const text = await r.text();
    return text.includes("<item>") ? text : null;
  } catch {
    return null;
  }
}

async function getTweets(username) {
  for (const instance of NITTER_INSTANCES) {
    const xml = await fetchRss(`${instance}/${username}/rss`);
    if (!xml) continue;
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    const tweets = items.slice(0, 20).map((i) => parseItem(i, username)).filter(Boolean);
    if (tweets.length > 0) return tweets;
  }
  return [];
}

// --- Main ---
async function main() {
  const start = Date.now();
  const accounts = await sbGet("accounts", "active=eq.true&order=priority.desc");
  console.log(`Collecting from ${accounts.length} accounts...`);

  let collected = 0, skipped = 0, failed = 0;

  for (const account of accounts) {
    try {
      const tweets = await getTweets(account.username);
      for (const tweet of tweets) {
        if (isNoise(tweet.content)) { skipped++; continue; }
        const ok = await sbUpsert("tweets", {
          tweet_id: tweet.tweet_id,
          username: tweet.username,
          display_name: account.display_name ?? account.username,
          content: tweet.content,
          url: tweet.url,
          posted_at: tweet.posted_at,
          processed: false,
          raw_data: {
            account_ecosystem: account.ecosystem,
            account_category: account.category,
            account_priority: account.priority,
          },
        });
        if (ok) collected++;
      }
      await sbPatch("accounts", account.id, { last_checked: new Date().toISOString() });
    } catch (e) {
      console.error(`  ✗ ${account.username}: ${e.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  const duration = Math.round((Date.now() - start) / 1000);
  const result = { collected, skipped, failed, accounts: accounts.length, duration_seconds: duration };
  console.log(JSON.stringify(result));

  await sbInsert("activities", {
    type: "tweet_collected",
    message: `Collection run — ${collected} new tweets from ${accounts.length} accounts (${skipped} noise filtered, ${failed} failed) in ${duration}s`,
    metadata: result,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
