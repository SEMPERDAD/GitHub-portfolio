import Link from "next/link";
import { safeAuth } from "@/lib/auth-safe";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";

export default async function PricingPage() {
  const { userId } = await safeAuth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900">
          CaptionAI
        </Link>
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-500">
            Start free. Upgrade to Pro when you&apos;re ready for more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free tier */}
          <div className="rounded-2xl p-8 bg-gray-50 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <Feature text="5 captions per day" />
              <Feature text="Instagram captions" />
              <Feature text="Engaging tone" />
              <Feature text="No credit card required" />
              <NoFeature text="LinkedIn & X captions" />
              <NoFeature text="Professional, humorous & more tones" />
              <NoFeature text="Hashtag suggestions" />
            </ul>
            <Link
              href={isSignedIn ? "/dashboard" : "/sign-up"}
              className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              {isSignedIn ? "Go to Dashboard" : "Get started free"}
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl p-8 bg-indigo-600 text-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold">Pro</h2>
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-500 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">${PRO_PRICE_MONTHLY}</span>
              <span className="text-indigo-300 text-sm">/month</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm">
              <FeaturePro text="Unlimited captions" />
              <FeaturePro text="Instagram, LinkedIn & X" />
              <FeaturePro text="All tones (5 options)" />
              <FeaturePro text="AI hashtag suggestions" />
              <FeaturePro text="Priority support" />
            </ul>
            {isSignedIn ? (
              <UpgradeButton />
            ) : (
              <Link
                href="/sign-up"
                className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-white text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Start Pro — ${PRO_PRICE_MONTHLY}/mo
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-gray-700">
      <span className="text-indigo-600 font-bold">✓</span> {text}
    </li>
  );
}

function NoFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-gray-400">
      <span>✕</span> {text}
    </li>
  );
}

function FeaturePro({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-indigo-100">
      <span className="text-white font-bold">✓</span> {text}
    </li>
  );
}

function UpgradeButton() {
  async function handleUpgrade() {
    "use server";
    const { redirect } = await import("next/navigation");
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { createCheckoutSession } = await import("@/lib/stripe");
    const { getUser, setStripeCustomerId } = await import("@/lib/db");

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
    const uid = userId as string;
    const dbUser = await getUser(uid);

    const session = await createCheckoutSession(uid, email, dbUser.stripeCustomerId);
    if (session.url) {
      if (session.customer && !dbUser.stripeCustomerId) {
        await setStripeCustomerId(uid, session.customer as string);
      }
      redirect(session.url);
    }
  }

  return (
    <form action={handleUpgrade}>
      <button
        type="submit"
        className="w-full py-3 rounded-xl font-semibold text-sm bg-white text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        Upgrade to Pro
      </button>
    </form>
  );
}
