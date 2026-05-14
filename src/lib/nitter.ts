import { XMLParser } from "fast-xml-parser";

// Verified working instances — must use RSS reader User-Agent
const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.42l.fr",
  "https://nitter.it",
  "https://tw.artemislena.eu",
  "https://nitter.poast.org",
];

// nitter.net requires RSS reader UA to return feed data
const RSS_USER_AGENT = "Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)";

export interface NitterTweet {
  tweet_id: string;
  username: string;
  content: string;
  url: string;
  posted_at: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

async function fetchRSS(instance: string, username: string): Promise<NitterTweet[]> {
  const res = await fetch(`${instance}/${username}/rss`, {
    headers: { "User-Agent": RSS_USER_AGENT },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  if (!xml.includes("<rss") && !xml.includes("<?xml")) throw new Error("Not RSS");

  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const list = Array.isArray(items) ? items : [items];

  return list
    .map((item: Record<string, string>) => {
      const link: string = item.link ?? "";
      const idMatch = link.match(/\/status\/(\d+)/);
      const tweet_id = idMatch ? idMatch[1] : link;

      // Use title for content (cleaner than description which has HTML)
      const rawContent: string = item.title ?? "";
      const content = rawContent.replace(/<[^>]*>/g, "").trim();

      return {
        tweet_id,
        username,
        content,
        url: link.replace(/^https?:\/\/[^/]+/, "https://x.com"),
        posted_at: item.pubDate ?? new Date().toISOString(),
      };
    })
    .filter((t) => t.tweet_id && t.content.length > 0);
}

export async function scrapeUserTweets(username: string): Promise<NitterTweet[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const tweets = await fetchRSS(instance, username);
      if (tweets.length > 0) return tweets;
    } catch {
      // try next instance
    }
  }
  return [];
}
