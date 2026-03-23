@AGENTS.md

# CaptionAI — Project Overview

## Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk (`@clerk/nextjs` v7)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — uses `claude-haiku-4-5-20251001`
- **Payments**: Stripe (`stripe` + `@stripe/stripe-js`)
- **Deployment**: Vercel

## Key Commands
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

## Project Structure
```
src/
  app/
    page.tsx                     # Landing page
    layout.tsx                   # Root layout with ClerkProvider
    dashboard/page.tsx           # Protected caption generator
    pricing/page.tsx             # Pricing page
    sign-in/[[...sign-in]]/      # Clerk sign-in
    sign-up/[[...sign-up]]/      # Clerk sign-up
    api/
      captions/route.ts          # POST — generate caption
      user/route.ts              # GET — user status/usage
      stripe/
        checkout/route.ts        # POST — create Stripe checkout session
        portal/route.ts          # POST — Stripe billing portal
        webhook/route.ts         # POST — Stripe webhook handler
  components/
    CaptionGeneratorClient.tsx   # Client-side caption UI
  lib/
    constants.ts                 # Platforms, tones, limits
    db.ts                        # In-memory user store (replace with real DB)
    stripe.ts                    # Stripe helpers
  middleware.ts                  # Clerk auth middleware
```

## Environment Variables
Copy `.env.example` → `.env.local` and fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRO_PRICE_ID`

## Freemium Logic
- **Free**: 5 captions/day, Instagram only, Engaging tone only
- **Pro** ($12/mo): Unlimited captions, all 3 platforms, all 5 tones, hashtag suggestions

## Notes
- `src/lib/db.ts` uses an **in-memory store** — resets on server restart. Replace with Prisma + PostgreSQL for production.
- Stripe webhook at `/api/stripe/webhook` — register this URL in your Stripe dashboard.
- Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local webhook testing.
