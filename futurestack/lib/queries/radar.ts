import { createClient } from "@/lib/supabase/server";

export async function getLatestRadar() {
  const supabase = await createClient();
  // Mock logic - in a real DB it connects to `radar_items`
  // We'll return dummy items simulating the payload until DB is seeded.
  return {
    week: "Week 28",
    year: 2026,
    items: [
      {
        id: 1,
        tool: { name: "Devin", slug: "devin", logo: null },
        category: "rising_star",
        ai_summary:
          "Devin has dominated developer workflows this week with major updates. It is trending highly across all AI tracking metrics.",
        signal_strength: 5,
      },
      {
        id: 2,
        tool: { name: "Cursor", slug: "cursor", logo: null },
        category: "watch_out",
        ai_summary:
          "Usage appears to be fracturing following server outages. Monitor for stability in the upcoming week.",
        signal_strength: 4,
      },
      {
        id: 3,
        tool: { name: "v0.dev", slug: "v0", logo: null },
        category: "underrated_gem",
        ai_summary:
          "Their new prompt caching drastically reduces costs but few have realized it. An absolute steal right now.",
        signal_strength: 4,
      },
      {
        id: 4,
        tool: { name: "Perplexity", slug: "perplexity", logo: null },
        category: "new_feature",
        ai_summary:
          'Launched "Pages" allowing entire dynamic articles to be built automatically. Massive SEO implications.',
        signal_strength: 5,
      },
      {
        id: 5,
        tool: { name: "Midjourney", slug: "midjourney", logo: null },
        category: "price_drop",
        ai_summary:
          "They have fundamentally altered their API tiers to attract enterprise developers.",
        signal_strength: 3,
      },
    ],
  };
}

export async function getPreviousRadars(count: number) {
  // Returns previous weeks metadata
  return [
    { week: "Week 27", year: 2026 },
    { week: "Week 26", year: 2026 },
    { week: "Week 25", year: 2026 },
    { week: "Week 24", year: 2026 },
  ];
}

export async function getRadarByWeek(week: number, year: number) {
  return []; // Implemented identical to getLatestRadar later.
}
