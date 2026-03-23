import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/stripe";
import { getUser, setStripeCustomerId } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
  const dbUser = getUser(userId);

  const session = await createCheckoutSession(
    userId,
    email,
    dbUser.stripeCustomerId
  );

  if (session.customer && !dbUser.stripeCustomerId) {
    setStripeCustomerId(userId, session.customer as string);
  }

  return Response.json({ url: session.url });
}
