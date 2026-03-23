import { createClient } from "@supabase/supabase-js";
import { FREE_DAILY_LIMIT } from "./constants";

// Use service role key — this runs server-side only, never exposed to clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserRecord {
  userId: string;
  tier: "free" | "pro";
  captionsUsedToday: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Ensure a user row exists, return it with today's usage count
export async function getUser(userId: string): Promise<UserRecord> {
  // Upsert user row (no-op if already exists)
  await supabase
    .from("users")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { data: user } = await supabase
    .from("users")
    .select("tier, stripe_customer_id, stripe_subscription_id")
    .eq("id", userId)
    .single();

  const { data: usage } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", new Date().toISOString().split("T")[0])
    .single();

  return {
    userId,
    tier: user?.tier ?? "free",
    captionsUsedToday: usage?.count ?? 0,
    stripeCustomerId: user?.stripe_customer_id ?? undefined,
    stripeSubscriptionId: user?.stripe_subscription_id ?? undefined,
  };
}

// Atomically increment today's usage using upsert
export async function incrementUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_usage")
    .select("id, count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_usage")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("daily_usage")
      .insert({ user_id: userId, date: today, count: 1 });
  }
}

export async function upgradeToProByStripeCustomerId(
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<void> {
  await supabase
    .from("users")
    .update({ tier: "pro", stripe_subscription_id: stripeSubscriptionId })
    .eq("stripe_customer_id", stripeCustomerId);
}

export async function downgradeToFreeByStripeCustomerId(
  stripeCustomerId: string
): Promise<void> {
  await supabase
    .from("users")
    .update({ tier: "free", stripe_subscription_id: null })
    .eq("stripe_customer_id", stripeCustomerId);
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await supabase
    .from("users")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", userId);
}

// Check if free user is within daily limit (used in API route for fast check)
export function isWithinFreeLimit(captionsUsedToday: number): boolean {
  return captionsUsedToday < FREE_DAILY_LIMIT;
}
