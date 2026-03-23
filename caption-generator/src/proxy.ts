import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/captions(.*)",
  "/api/stripe/checkout",
  "/api/stripe/portal",
]);

// Check whether real Clerk keys are present (not the placeholder values)
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkConfigured =
  clerkKey.startsWith("pk_") && !clerkKey.includes("your_clerk");

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export function proxy(request: NextRequest) {
  if (!clerkConfigured) {
    // Clerk not set up yet — pass all traffic through so the UI is still viewable
    return NextResponse.next();
  }
  return clerkProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
