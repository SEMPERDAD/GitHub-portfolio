import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900">
          CaptionAI
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center text-center px-6 py-24 max-w-3xl mx-auto">
          <span className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full mb-6">
            AI-Powered Caption Generator
          </span>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Write captions that{" "}
            <span className="text-indigo-600">actually convert</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl">
            Generate engaging social media captions for Instagram, LinkedIn, and
            X in seconds. Powered by Claude AI.
          </p>
          <div className="flex gap-4">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  Start for free
                </Link>
                <Link
                  href="/pricing"
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  View pricing
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to grow on social
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Multi-platform",
                  desc: "Captions optimized for Instagram, LinkedIn, and X (Twitter)",
                  icon: "🌐",
                },
                {
                  title: "Multiple tones",
                  desc: "Engaging, professional, humorous, inspirational, educational",
                  icon: "🎭",
                },
                {
                  title: "Hashtag suggestions",
                  desc: "Pro users get AI-generated hashtag sets for maximum reach",
                  icon: "#",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 mb-12">Start free. Upgrade when you need more.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PricingCard
                name="Free"
                price={0}
                features={[
                  "5 captions per day",
                  "Instagram only",
                  "Engaging tone only",
                ]}
                cta="Get started free"
                href="/sign-up"
                highlight={false}
              />
              <PricingCard
                name="Pro"
                price={PRO_PRICE_MONTHLY}
                features={[
                  "Unlimited captions",
                  "All platforms (Instagram, LinkedIn, X)",
                  "All tones",
                  "Hashtag suggestions",
                ]}
                cta="Start Pro"
                href="/sign-up"
                highlight={true}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} CaptionAI. Built with Next.js & Claude AI.
      </footer>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  cta,
  href,
  highlight,
}: {
  name: string;
  price: number;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-8 text-left ${
        highlight
          ? "bg-indigo-600 text-white"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <h3
        className={`text-lg font-bold mb-1 ${
          highlight ? "text-white" : "text-gray-900"
        }`}
      >
        {name}
      </h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span
          className={`text-4xl font-bold ${
            highlight ? "text-white" : "text-gray-900"
          }`}
        >
          ${price}
        </span>
        {price > 0 && (
          <span
            className={`text-sm ${highlight ? "text-indigo-200" : "text-gray-500"}`}
          >
            /month
          </span>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className={highlight ? "text-indigo-200" : "text-indigo-600"}>
              ✓
            </span>
            <span className={highlight ? "text-indigo-100" : "text-gray-700"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
          highlight
            ? "bg-white text-indigo-600 hover:bg-indigo-50"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
