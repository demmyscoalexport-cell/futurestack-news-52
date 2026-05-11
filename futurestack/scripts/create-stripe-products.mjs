/**
 * Run this ONCE after adding your STRIPE_SECRET_KEY to .env.local:
 * node scripts/create-stripe-products.mjs
 *
 * It will create all 4 prices and print the IDs to paste into .env.local
 */

import Stripe from "stripe";
import { config } from "dotenv";
config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

async function main() {
  console.log("🔧 Creating FutureStack Stripe products & prices...\n");

  // ── PRO PLAN ──────────────────────────────────────────────
  const proProduct = await stripe.products.create({
    name: "FutureStack Pro",
    description:
      "Unlimited stacks, full radar archive, unlimited AI comparisons.",
    metadata: { plan: "pro" },
  });
  console.log(`✅ Pro product created: ${proProduct.id}`);

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1200, // $12.00
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Pro Monthly",
  });

  const proAnnual = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 9900, // $99.00
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Pro Annual",
  });

  // ── TEAM PLAN ──────────────────────────────────────────────
  const teamProduct = await stripe.products.create({
    name: "FutureStack Team",
    description:
      "Everything in Pro plus team sharing, API access, and Slack alerts.",
    metadata: { plan: "team" },
  });
  console.log(`✅ Team product created: ${teamProduct.id}`);

  const teamMonthly = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 4900, // $49.00
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Team Monthly",
  });

  const teamAnnual = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 39900, // $399.00
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Team Annual",
  });

  console.log("\n📋 Add these to your .env.local:\n");
  console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}`);
  console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
  console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnual.id}`);
  console.log(`STRIPE_TEAM_MONTHLY_PRICE_ID=${teamMonthly.id}`);
  console.log(`STRIPE_TEAM_ANNUAL_PRICE_ID=${teamAnnual.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_PRO_MONTHLY=${proMonthly.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_PRO_ANNUAL=${proAnnual.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_TEAM_MONTHLY=${teamMonthly.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_TEAM_ANNUAL=${teamAnnual.id}`);

  console.log(
    "\n✅ Done! Paste those values into your .env.local and on Vercel.",
  );
}

main().catch(console.error);
