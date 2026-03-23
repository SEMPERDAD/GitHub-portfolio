import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUser, incrementUsage } from "@/lib/db";
import { FREE_DAILY_LIMIT, PLATFORMS, TONES } from "@/lib/constants";
import type { Platform, Tone } from "@/lib/constants";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { platform, tone, topic } = body as {
    platform: Platform;
    tone: Tone;
    topic: string;
  };

  if (!platform || !tone || !topic?.trim()) {
    return Response.json(
      { error: "platform, tone, and topic are required" },
      { status: 400 }
    );
  }

  const dbUser = getUser(userId);
  const isPro = dbUser.tier === "pro";

  // Check platform/tone access
  const platformInfo = PLATFORMS.find((p) => p.id === platform);
  const toneInfo = TONES.find((t) => t.id === tone);

  if (!platformInfo || !toneInfo) {
    return Response.json({ error: "Invalid platform or tone" }, { status: 400 });
  }

  if ((platformInfo.proOnly || toneInfo.proOnly) && !isPro) {
    return Response.json(
      { error: "This feature requires a Pro subscription." },
      { status: 403 }
    );
  }

  // Check daily limit for free users
  if (!isPro && dbUser.captionsUsedToday >= FREE_DAILY_LIMIT) {
    return Response.json(
      { error: "Daily limit reached. Upgrade to Pro for unlimited captions." },
      { status: 429 }
    );
  }

  const platformGuide: Record<Platform, string> = {
    instagram:
      "Instagram (casual, visual storytelling, conversational, 2200 char max, can include emojis)",
    linkedin:
      "LinkedIn (professional, thought leadership, engaging but business-appropriate, no excessive emojis)",
    twitter:
      "X/Twitter (concise, punchy, under 280 characters, witty or direct)",
  };

  const toneGuide: Record<Tone, string> = {
    engaging: "highly engaging and attention-grabbing",
    professional: "polished, authoritative, and professional",
    humorous: "fun, witty, and lighthearted",
    inspirational: "motivating, uplifting, and aspirational",
    educational: "informative, clear, and value-packed",
  };

  const prompt = `Write a social media caption for ${platformGuide[platform]}.

Tone: ${toneGuide[tone]}
Topic: ${topic}

Requirements:
- Write only the caption text (no explanations, no quotes around it)
- Make it feel authentic and human, not like a template
- Optimize for ${platformInfo.label} specifically
${isPro ? "- After the caption, on a new line write 'HASHTAGS:' followed by 5-8 relevant hashtags separated by spaces" : ""}

Caption:`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  let caption = raw.trim();
  let hashtags: string[] | undefined;

  if (isPro && raw.includes("HASHTAGS:")) {
    const parts = raw.split("HASHTAGS:");
    caption = parts[0].trim();
    hashtags = parts[1]
      .trim()
      .split(/\s+/)
      .filter((h) => h.startsWith("#"));
  }

  incrementUsage(userId);

  return Response.json({ caption, hashtags });
}
