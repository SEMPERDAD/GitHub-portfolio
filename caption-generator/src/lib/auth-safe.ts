/**
 * Safe wrapper around Clerk's auth() for public pages.
 * Returns null userId when Clerk keys are not yet configured,
 * so the page renders the signed-out state instead of crashing.
 */
export async function safeAuth(): Promise<{ userId: string | null }> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    return await auth();
  } catch {
    return { userId: null };
  }
}
