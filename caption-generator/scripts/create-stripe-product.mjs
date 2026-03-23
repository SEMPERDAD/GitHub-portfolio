/**
 * Creates the CaptionAI Pro product and monthly price in Stripe.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-product.mjs
 *
 * Or set STRIPE_SECRET_KEY in .env.local and run:
 *   node -e "require('dotenv').config({path:'.env.local'})" scripts/create-stripe-product.mjs
 *
 * After running, copy the printed Price ID into .env.local as STRIPE_PRO_PRICE_ID
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key || key.startsWith("sk_test_your")) {
  console.error(
    "❌  Set a real STRIPE_SECRET_KEY before running this script.\n" +
      "    export STRIPE_SECRET_KEY=sk_test_..."
  );
  process.exit(1);
}

const stripe = new Stripe(key);

const product = await stripe.products.create({
  name: "CaptionAI Pro",
  description:
    "Unlimited AI captions on Instagram, LinkedIn & X — all tones, hashtag suggestions.",
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1200, // $12.00
  currency: "usd",
  recurring: { interval: "month" },
  nickname: "Pro Monthly",
});

console.log("\n✅  Stripe product created!");
console.log(`   Product ID : ${product.id}`);
console.log(`   Price ID   : ${price.id}`);
console.log(
  "\n👉  Add this to your .env.local:\n   STRIPE_PRO_PRICE_ID=" + price.id
);
