export interface ScrapedTweet {
  tweet_id: string;
  username: string;
  content: string;
  url: string;
  posted_at: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
}

const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.tiekoetter.com",
  "https://nitter.1d4.us",
];

// Free proxy services — fetch Nitter on our behalf from non-datacenter IPs
const PROXY_PREFIXES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractTweetId(link: string): string {
  const match = link.match(/\/status\/(\d+)/);
  return match?.[1] ?? link;
}

function parseRssItem(item: string, username: string): ScrapedTweet | null {
  const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
    ?? item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
    ?? "";

  const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]
    ?? item.match(/<guid>([\s\S]*?)<\/guid>/)?.[1]
    ?? "";

  const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";

  if (!title || !link) return null;

  // Skip retweets
  if (title.startsWith("RT by @")) return null;

  const content = title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();

  const tweetId = extractTweetId(link);
  const tweetUrl = `https://x.com/${username}/status/${tweetId}`;

  return {
    tweet_id: tweetId,
    username,
    content,
    url: tweetUrl,
    posted_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    likes: 0,
    reposts: 0,
    replies: 0,
    views: 0,
  };
}

async function fetchUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("<item>") ? text : null;
  } catch {
    return null;
  }
}

async function fetchFromInstance(instance: string, username: string): Promise<string | null> {
  const rssUrl = `${instance}/${username}/rss`;

  // Try direct (works on local/residential IPs)
  const direct = await fetchUrl(rssUrl);
  if (direct) return direct;

  // Fall back to free proxies (works from cloud/datacenter IPs)
  for (const makeProxy of PROXY_PREFIXES) {
    const proxied = await fetchUrl(makeProxy(rssUrl));
    if (proxied) return proxied;
  }

  return null;
}

export async function scrapeUserTweets(username: string, count = 20): Promise<ScrapedTweet[]> {
  let xml: string | null = null;

  for (const instance of NITTER_INSTANCES) {
    xml = await fetchFromInstance(instance, username);
    if (xml && xml.includes("<item>")) break;
  }

  if (!xml) return [];

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const tweets: ScrapedTweet[] = [];

  for (const item of items.slice(0, count)) {
    const tweet = parseRssItem(item, username);
    if (tweet) tweets.push(tweet);
  }

  return tweets;
}
