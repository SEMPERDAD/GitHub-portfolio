import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/db";
import { FREE_DAILY_LIMIT, PLATFORMS, TONES } from "@/lib/constants";
import CaptionGeneratorClient from "@/components/CaptionGeneratorClient";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const dbUser = await getUser(userId!);
  const params = await searchParams;

  const isPro = dbUser.tier === "pro";
  const remaining = isPro
    ? null
    : Math.max(0, FREE_DAILY_LIMIT - dbUser.captionsUsedToday);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">
          CaptionAI
        </Link>
        <div className="flex items-center gap-4">
          {!isPro && (
            <Link
              href="/pricing"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Upgrade to Pro
            </Link>
          )}
          <UserButton />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Welcome / upgrade banner */}
        {params.upgraded && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            You&apos;re now on Pro! Enjoy unlimited captions on all platforms.
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hi, {clerkUser?.firstName || "there"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isPro ? (
                <span className="text-indigo-600 font-medium">Pro Plan — Unlimited captions</span>
              ) : (
                <span>
                  Free Plan —{" "}
                  <span className={remaining === 0 ? "text-red-500 font-medium" : ""}>
                    {remaining} caption{remaining !== 1 ? "s" : ""} remaining today
                  </span>
                </span>
              )}
            </p>
          </div>
          {!isPro && (
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Upgrade — $12/mo
            </Link>
          )}
        </div>

        {/* Caption generator */}
        <CaptionGeneratorClient
          isPro={isPro}
          remaining={remaining}
          platforms={PLATFORMS}
          tones={TONES}
        />
      </main>
    </div>
  );
}
