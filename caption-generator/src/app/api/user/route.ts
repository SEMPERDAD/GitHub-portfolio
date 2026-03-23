import { auth } from "@clerk/nextjs/server";
import { getUser } from "@/lib/db";
import { FREE_DAILY_LIMIT } from "@/lib/constants";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = getUser(userId);

  return Response.json({
    tier: dbUser.tier,
    captionsUsedToday: dbUser.captionsUsedToday,
    dailyLimit: FREE_DAILY_LIMIT,
    remaining:
      dbUser.tier === "pro"
        ? null
        : Math.max(0, FREE_DAILY_LIMIT - dbUser.captionsUsedToday),
  });
}
