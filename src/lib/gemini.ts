import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.3-70b-versatile";

async function jsonChat(prompt: string): Promise<unknown> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}

export interface TweetClassification {
  important: boolean;
  category: string;
  importance_score: number;
  summary: string;
  keywords: string[];
}

const CLASSIFICATION_SYSTEM = `You are an intelligence analyst for a Web3 gaming content creator tracking Ronin, Immutable, and Abstract ecosystems on X (Twitter).

Your job: decide whether a tweet represents a real, newsworthy ecosystem event worth tracking — and if so, extract the key facts precisely.

Return JSON:
{
  "important": true or false,
  "category": one of: campaign|launch|partnership|migration|staking|gameplay|tournament|funding|metrics|token|nft|patch|leaderboard|other,
  "importance_score": integer 1-10,
  "summary": "one precise sentence — WHO did WHAT with SPECIFIC details (numbers, dates, names if present)",
  "keywords": ["3-5 specific keywords — must be project/feature/person names, not generic words like 'update' or 'game'"]
}

SCORING GUIDE:
9-10 → Ecosystem-defining news: major protocol launches, cross-game migrations, large funding rounds, network-wide campaigns
7-8  → High-signal events: new game modes or features, tournament announcements with prizes, staking/reward campaigns, official partnerships
5-6  → Noteworthy updates: minor patches with specific changes, community milestones with real numbers, creator spotlights on specific topics
1-4  → Skip: price speculation, vague hype ("big things coming"), giveaways, engagement bait, GM/GN posts, "we're building" without substance

RULES:
- important=true ONLY if score >= 5
- summary must name the specific project/game/person and what concretely happened. BAD: "game announced update". GOOD: "Pixels launched fishing mini-game with 50 new items and double XP weekend"
- keywords must be specific: ["Pixels", "fishing", "double XP"] not ["game", "update", "announcement"]
- If an official game or ecosystem account makes an announcement, weight score up by 1 vs a community member saying the same thing
- Retweet content is still valid — score the underlying announcement, not the act of retweeting`;

export async function classifyTweet(
  content: string,
  context?: { ecosystem?: string; category?: string }
): Promise<TweetClassification | null> {
  const contextLine = context?.ecosystem || context?.category
    ? `\nSource context: ${context.ecosystem ? `${context.ecosystem.toUpperCase()} ecosystem` : ""}${context.category ? `, account type: ${context.category}` : ""}`
    : "";

  const prompt = `${CLASSIFICATION_SYSTEM}${contextLine}

Tweet to analyze:
"${content}"`;

  try {
    const data = await jsonChat(prompt);
    return data as TweetClassification;
  } catch {
    return null;
  }
}

export interface EcosystemSummary {
  ronin: string;
  immutable: string;
  abstract: string;
  overall: string;
}

const SUMMARY_PROMPT = `You are an intelligence analyst writing a briefing for a Web3 gaming content creator on X.

Produce a structured intelligence report from the events below. Be specific — cite project names, numbers, dates. The creator needs this to decide what to post about TODAY.

Return JSON:
{
  "ronin": "bullet-point summary of Ronin ecosystem events. Use '- ' prefix for each bullet. Include: what happened, which game/project, why it matters for content. Flag high-importance events with 🔥. Write 'No significant updates.' if nothing relevant.",
  "immutable": "same format for Immutable ecosystem",
  "abstract": "same format for Abstract ecosystem",
  "overall": "2-3 sentences: What is the single biggest narrative right now across all ecosystems? What should the creator post about in the next 24 hours and why?"
}

Rules:
- Name specific projects, games, campaigns, and tokens — never write vague sentences like "a game released an update"
- Explain the CREATOR OPPORTUNITY for each event (what angle, what audience reaction to expect)
- overall must be actionable: recommend a specific content angle, not just describe what happened
- Never invent facts not present in the events list

Events:
`;

export async function generateEcosystemSummary(
  events: Array<{ title: string; summary: string; ecosystem: string; importance_score: number; keywords?: string[] | null; category?: string }>
): Promise<EcosystemSummary | null> {
  try {
    const eventsText = events
      .map((e) => {
        const kw = e.keywords?.length ? ` [${e.keywords.join(", ")}]` : "";
        return `[${e.ecosystem.toUpperCase()} | ${e.category ?? "general"} | score:${e.importance_score}] ${e.title}${kw}`;
      })
      .join("\n");
    const data = await jsonChat(SUMMARY_PROMPT + eventsText);
    return data as EcosystemSummary;
  } catch {
    return null;
  }
}

export interface ContentIdeas {
  ideas: Array<{
    title: string;
    description: string;
    format: string;
    angle: string;
    potential: string;
  }>;
}

const IDEAS_PROMPT = `You are a senior content strategist for a Web3 gaming creator on X with an audience of players, investors, and ecosystem participants.

Analyze these ecosystem events and generate every genuinely strong content idea. Quality over quantity — only include ideas that are specific, timely, and executable. Skip anything generic ("Top 5 Web3 games") unless tied directly to current events.

Return JSON:
{
  "ideas": [
    {
      "title": "punchy, specific title the creator would actually use as a tweet or thread title",
      "description": "2-3 sentences: exactly what to cover, what data/facts to highlight, why the audience will engage",
      "format": "one of: thread|infographic|guide|comparison|analysis|narrative|breakdown",
      "angle": "the specific hook — what makes this timely, contrarian, or surprising RIGHT NOW that other creators haven't covered yet",
      "potential": "high or medium"
    }
  ]
}

HIGH potential = covers something actively happening NOW, unique angle not yet saturated, appeals to both players and investors, can be posted within 24-48h while still relevant.
MEDIUM potential = useful educational or evergreen content tied to current events.
DO NOT include low-potential ideas.

Content types to consider:
- Breaking news threads (what happened + why it matters for players/holders)
- Alpha threads (what the signals suggest is coming)
- Comparison threads (ecosystem A vs B right now)
- Beginner guides tied to something that just launched
- "You should know about X" educational threads
- Community spotlights / player reward breakdowns
- Contrarian takes backed by event data
`;

export async function generateContentIdeas(
  events: Array<{ title: string; summary: string; ecosystem: string; category: string; importance_score?: number; keywords?: string[] | null }>,
  existingTitles?: string[],
): Promise<ContentIdeas | null> {
  try {
    const eventsText = events
      .map((e) => {
        const kw = e.keywords?.length ? ` [${e.keywords.join(", ")}]` : "";
        const score = e.importance_score ? ` | score:${e.importance_score}` : "";
        return `[${e.ecosystem.toUpperCase()} | ${e.category}${score}] ${e.title}: ${e.summary}${kw}`;
      })
      .join("\n");

    const alreadyCovered = existingTitles?.length
      ? `\nAlready covered in the last 48h — do NOT generate ideas similar to these:\n${existingTitles.map(t => `- ${t}`).join("\n")}\n`
      : "";

    const data = await jsonChat(IDEAS_PROMPT + alreadyCovered + "\nEvents:\n" + eventsText);
    return data as ContentIdeas;
  } catch {
    return null;
  }
}
