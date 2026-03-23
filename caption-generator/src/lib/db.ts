// Simple in-memory database for usage tracking
// In production, replace with a real database (e.g., Prisma + PostgreSQL)

interface UserRecord {
  userId: string;
  tier: "free" | "pro";
  captionsUsedToday: number;
  lastResetDate: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// In-memory store (resets on server restart)
const userStore = new Map<string, UserRecord>();

export function getUser(userId: string): UserRecord {
  if (!userStore.has(userId)) {
    userStore.set(userId, {
      userId,
      tier: "free",
      captionsUsedToday: 0,
      lastResetDate: new Date().toDateString(),
    });
  }

  const user = userStore.get(userId)!;

  // Reset daily count if it's a new day
  if (user.lastResetDate !== new Date().toDateString()) {
    user.captionsUsedToday = 0;
    user.lastResetDate = new Date().toDateString();
    userStore.set(userId, user);
  }

  return user;
}

export function incrementUsage(userId: string): void {
  const user = getUser(userId);
  user.captionsUsedToday += 1;
  userStore.set(userId, user);
}

export function upgradeToProByStripeCustomerId(
  stripeCustomerId: string,
  stripeSubscriptionId: string
): void {
  for (const [userId, user] of userStore.entries()) {
    if (user.stripeCustomerId === stripeCustomerId) {
      user.tier = "pro";
      user.stripeSubscriptionId = stripeSubscriptionId;
      userStore.set(userId, user);
      return;
    }
  }
}

export function downgradeToFreeByStripeCustomerId(
  stripeCustomerId: string
): void {
  for (const [userId, user] of userStore.entries()) {
    if (user.stripeCustomerId === stripeCustomerId) {
      user.tier = "free";
      user.stripeSubscriptionId = undefined;
      userStore.set(userId, user);
      return;
    }
  }
}

export function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): void {
  const user = getUser(userId);
  user.stripeCustomerId = stripeCustomerId;
  userStore.set(userId, user);
}
