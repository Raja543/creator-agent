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
    temperature: 0.3,
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

const CLASSIFICATION_PROMPT = `You are an intelligence analyst for Web3 gaming ecosystems (Ronin, Immutable, Abstract).

Analyze this tweet and return JSON:
{
  "important": true/false,
  "category": one of: campaign|launch|partnership|migration|staking|gameplay|tournament|funding|metrics|token|nft|patch|leaderboard|other,
  "importance_score": 1-10,
  "summary": "one sentence describing what happened",
  "keywords": ["up to 5 relevant keywords"]
}

Score guide:
- 9-10: Ecosystem-wide announcements, major launches, migrations
- 7-8: Game updates, campaigns, staking events, tournaments
- 5-6: Creator content, minor updates, noteworthy community posts
- 1-4: Engagement bait, giveaways, GM/GN posts, low-signal memes

Only mark important=true if score >= 5.

Tweet: `;

export async function classifyTweet(content: string): Promise<TweetClassification | null> {
  try {
    const data = await jsonChat(CLASSIFICATION_PROMPT + content);
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

const SUMMARY_PROMPT = `You are an intelligence analyst for a Web3 gaming content creator on X (Twitter).

Your job is to produce a detailed, actionable intelligence report from these ecosystem events.

Return JSON with this structure:
{
  "ronin": "detailed bullet points about Ronin ecosystem — include specific project names, what happened, why it matters for creators. Use - prefix for each bullet. At least 3-5 bullets if events exist.",
  "immutable": "same format for Immutable ecosystem",
  "abstract": "same format for Abstract ecosystem",
  "overall": "2-3 sentences about the dominant narrative. What is the biggest trend right now? What should a Web3 gaming creator focus on this week?"
}

Rules:
- Be specific — name the projects, games, campaigns, tokens involved
- Explain WHY each event matters for a content creator (audience interest, virality potential, educational opportunity)
- Flag high-importance events clearly (e.g. "🔥 High signal:")
- If an ecosystem has no events, write "No significant updates detected."
- Do NOT hallucinate — only use facts from the provided events

Events:
`;

export async function generateEcosystemSummary(
  events: Array<{ title: string; summary: string; ecosystem: string; importance_score: number; keywords?: string[] | null; category?: string }>
): Promise<EcosystemSummary | null> {
  try {
    const eventsText = events
      .map((e) => {
        const kw = e.keywords?.length ? ` [keywords: ${e.keywords.join(", ")}]` : "";
        return `[${e.ecosystem.toUpperCase()} | ${e.category ?? "general"} | score:${e.importance_score}] ${e.title}: ${e.summary}${kw}`;
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

const IDEAS_PROMPT = `You are a senior content strategist for a Web3 gaming creator on X (Twitter).

Analyze ALL these ecosystem events and generate EVERY genuinely good content idea you can find. Do not cap at 5 or 10 — if there are 20 great ideas, give 20. Only skip an idea if it is weak, generic, or repetitive.

Return JSON:
{
  "ideas": [
    {
      "title": "specific, punchy, engaging title a creator would actually use",
      "description": "2-3 sentences explaining exactly what to cover and why the audience will care",
      "format": "one of: thread|infographic|guide|comparison|analysis|narrative|breakdown",
      "angle": "the unique creator angle — what makes this timely, surprising, or contrarian RIGHT NOW",
      "potential": "high|medium|low"
    }
  ]
}

What makes a HIGH potential idea:
- Covers a trend that is actively happening (not old news)
- Has a unique angle that most creators haven't touched yet
- Appeals to both players AND investors in the audience
- Can be executed quickly (within 24-48 hours while it's still hot)

What makes a MEDIUM idea:
- Useful educational content, comparisons, or evergreen narratives tied to current events
- Good but not urgent

Skip LOW potential ideas entirely — do not include them.

Cover all content types:
- Breaking event threads (what happened + why it matters)
- Educational explainers (how X works, beginner guide to Y)
- Comparison threads (A vs B, which ecosystem is winning)
- Narrative analysis (the bigger story behind the events)
- Alpha/insight threads (what the data/signals are saying)
- Community-focused (player guides, rewards breakdowns)

Events to work from:
`;

export async function generateContentIdeas(
  events: Array<{ title: string; summary: string; ecosystem: string; category: string; importance_score?: number; keywords?: string[] | null }>
): Promise<ContentIdeas | null> {
  try {
    const eventsText = events
      .map((e) => {
        const kw = e.keywords?.length ? ` [keywords: ${e.keywords.join(", ")}]` : "";
        const score = e.importance_score ? ` | score:${e.importance_score}` : "";
        return `[${e.ecosystem} | ${e.category}${score}] ${e.title}: ${e.summary}${kw}`;
      })
      .join("\n");
    const data = await jsonChat(IDEAS_PROMPT + eventsText);
    return data as ContentIdeas;
  } catch {
    return null;
  }
}
