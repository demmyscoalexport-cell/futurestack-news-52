/**
 * Seed sample reviews for all tools that have no reviews yet.
 * Run from: futurestack/
 *   node scripts/seed-reviews.mjs
 */
import pg from "pg";
import { randomUUID } from "crypto";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("amazonaws") ? { rejectUnauthorized: false } : false,
});

const REVIEWERS = [
  { name: "Amara Osei",      location: "Accra, Ghana" },
  { name: "Chidera Eze",     location: "Lagos, Nigeria" },
  { name: "Fatima Al-Rashid",location: "Nairobi, Kenya" },
  { name: "Marcus Webb",     location: "Cape Town, South Africa" },
  { name: "Priya Nair",      location: "London, UK" },
  { name: "Kofi Mensah",     location: "Kumasi, Ghana" },
  { name: "Zara Ibrahim",    location: "Abuja, Nigeria" },
  { name: "David Okonkwo",   location: "Port Harcourt, Nigeria" },
  { name: "Sofia Adeyemi",   location: "Ibadan, Nigeria" },
  { name: "James Mutuku",    location: "Mombasa, Kenya" },
  { name: "Aisha Diallo",    location: "Dakar, Senegal" },
  { name: "Emeka Nwosu",     location: "Enugu, Nigeria" },
];

const REVIEWS_BY_CATEGORY = {
  default: [
    { rating: 5, content: "This tool has completely transformed how I work. The automation features alone save me hours every week. Highly recommended for any serious professional." },
    { rating: 5, content: "Exceptional product. I've tried many alternatives but nothing comes close to the quality and reliability here. Worth every penny." },
    { rating: 4, content: "Really solid tool with a great feature set. A few minor UX quirks but nothing deal-breaking. The support team is very responsive." },
    { rating: 4, content: "Great value for money. Does exactly what it promises. I use it daily for my freelance work and clients love the output quality." },
    { rating: 5, content: "I was skeptical at first but after 3 months of use I'm completely sold. The AI features are genuinely useful, not just gimmicks." },
    { rating: 3, content: "Good tool with solid fundamentals. The free tier is quite generous. Upgrading to paid unlocks a lot more but the free version alone is useful." },
    { rating: 5, content: "Perfect for small businesses and agencies in Africa. The pricing is fair and the tool works reliably even with slower internet connections." },
    { rating: 4, content: "Very intuitive interface. Onboarded my whole team within a day. The integrations with other tools we use are seamless." },
    { rating: 5, content: "Best in class for what it does. I've recommended it to dozens of colleagues and they all agree — it just works beautifully." },
    { rating: 4, content: "Solid product that keeps getting better. The team releases updates frequently and actually listens to user feedback. That's rare." },
  ],
};

function pickReview(toolName, idx) {
  const pool = REVIEWS_BY_CATEGORY.default;
  return pool[idx % pool.length];
}

function pickReviewer(idx) {
  return REVIEWERS[idx % REVIEWERS.length];
}

async function main() {
  const client = await pool.connect();

  try {
    // Get all tools
    const { rows: tools } = await client.query(
      "SELECT id, name FROM tools ORDER BY created_at DESC"
    );

    console.log(`Found ${tools.length} tools. Seeding reviews...`);

    let seeded = 0;
    let skipped = 0;

    for (const tool of tools) {
      // Check if tool already has reviews
      const { rows: existing } = await client.query(
        "SELECT COUNT(*) as cnt FROM reviews WHERE tool_id = $1",
        [tool.id]
      );

      const count = parseInt(existing[0].cnt, 10);
      if (count >= 2) {
        skipped++;
        continue;
      }

      // Add 2-3 reviews per tool
      const numReviews = 2 + (Math.floor(Math.random() * 2)); // 2 or 3
      const start = Math.floor(Math.random() * 5); // offset into review pool

      for (let i = 0; i < numReviews; i++) {
        const reviewer = pickReviewer(start + i + tools.indexOf(tool));
        const review = pickReview(tool.name, start + i);
        // Random date between 5 and 120 days ago
        const daysAgo = 5 + Math.floor(Math.random() * 115);

        await client.query(
          `INSERT INTO reviews (id, tool_id, user_name, rating, content, location, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${daysAgo} days')
           ON CONFLICT DO NOTHING`,
          [randomUUID(), tool.id, reviewer.name, review.rating, review.content, reviewer.location]
        );
      }

      seeded++;
    }

    console.log(`✅ Done. Seeded reviews for ${seeded} tools. Skipped ${skipped} (already had reviews).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
