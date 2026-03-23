import { auth } from "@clerk/nextjs/server";
import { createPortalSession } from "@/lib/stripe";
import { getUser } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getUser(userId);

  if (!dbUser.stripeCustomerId) {
    return Response.json(
      { error: "No Stripe customer found" },
      { status: 404 }
    );
  }

  const session = await createPortalSession(dbUser.stripeCustomerId);

  return Response.json({ url: session.url });
}
