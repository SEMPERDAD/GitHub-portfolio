import { stripe } from "@/lib/stripe";
import {
  upgradeToProByStripeCustomerId,
  downgradeToFreeByStripeCustomerId,
} from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return Response.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      if (subscription.status === "active") {
        await upgradeToProByStripeCustomerId(
          subscription.customer as string,
          subscription.id
        );
      } else if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid"
      ) {
        await downgradeToFreeByStripeCustomerId(subscription.customer as string);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await downgradeToFreeByStripeCustomerId(subscription.customer as string);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
