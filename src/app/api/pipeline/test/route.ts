import { classifyTweet } from "@/lib/gemini";

export async function GET() {
  try {
    const result = await classifyTweet(
      "Ronin launches 5M RON rewards program for game builders on the Proof of Distribution platform"
    );
    return Response.json({ success: !!result, classification: result });
  } catch (err) {
    return Response.json({ error: String(err) });
  }
}
