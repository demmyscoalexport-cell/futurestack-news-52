/**
 * DISCOVA Logo Generator
 * Generates 5 premium logo variations using WaveSpeed flux-dev
 * (higher quality than flux-schnell — slower but worth it for a logo)
 * then uploads each one to Cloudinary.
 *
 * Run from futurestack/:
 *   node scripts/generate-discova-logo.mjs
 */

import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env ─────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

const WAVESPEED_KEY   = process.env.WAVESPEED_API_KEY;
const CLD_CLOUD       = process.env.CLOUDINARY_CLOUD_NAME;
const CLD_API_KEY     = process.env.CLOUDINARY_API_KEY;
const CLD_API_SECRET  = process.env.CLOUDINARY_API_SECRET;

if (!WAVESPEED_KEY)  { console.error("❌  WAVESPEED_API_KEY not set"); process.exit(1); }
if (!CLD_CLOUD)      { console.error("❌  CLOUDINARY_CLOUD_NAME not set"); process.exit(1); }

// ── Prompts — 5 distinct luxury logo directions ──────────────────────────
const LOGO_PROMPTS = [
  {
    name: "compass-mark",
    label: "Compass Discovery Mark",
    prompt: [
      "Minimalist luxury logo icon for a global tech platform called DISCOVA.",
      "A perfect geometric compass rose merged with the letter D,",
      "ultra-clean vector illustration, deep midnight navy background,",
      "icon rendered in luminous gold and pure white,",
      "razor-sharp edges, jewellery-grade precision,",
      "Apple-level minimal aesthetic, no text, no gradients except subtle gold sheen,",
      "isolated on pure white background for presentation.",
      "Square format, brand mark only.",
    ].join(" "),
  },
  {
    name: "globe-africa",
    label: "Africa Globe Mark",
    prompt: [
      "Premium tech brand icon: a sleek stylised globe where the African continent",
      "is the focal point, subtly glowing with violet and electric indigo light,",
      "ultra-minimal flat vector mark, pure white background,",
      "single-colour silhouette with one luminous accent colour,",
      "the continent shape abstracted into clean geometric lines,",
      "luxury SaaS branding, no text, no gradients,",
      "Apple / Stripe level design quality, sharp corners, modern.",
      "Square format, icon only.",
    ].join(" "),
  },
  {
    name: "constellation-d",
    label: "Constellation Lettermark",
    prompt: [
      "High-end logo mark: the letter D formed from connected constellation stars",
      "and elegant thin lines, deep space dark background fading to pure white edges,",
      "platinum and violet accent stars, ultra-precise vector art,",
      "luxurious premium tech brand identity, Hermès meets Silicon Valley,",
      "no other letters, clean negative space,",
      "the constellation pattern is geometric and intentional not random,",
      "square format, isolated on white, brand mark only.",
    ].join(" "),
  },
  {
    name: "diamond-discovery",
    label: "Diamond Discovery Icon",
    prompt: [
      "Luxury brand mark: a perfect geometric diamond / rhombus shape",
      "with a subtle abstract globe grid pattern inside, rendered as a flat icon,",
      "deep indigo and gold colour palette, ultra-sharp vector precision,",
      "the diamond represents discovery, clarity, and premium quality,",
      "white background, single bold icon, no text, no gradients,",
      "premium fintech or global SaaS platform aesthetic,",
      "Amex Black Card meets Google level sophistication.",
      "Square format, icon only.",
    ].join(" "),
  },
  {
    name: "wordmark-minimal",
    label: "Minimal Wordmark",
    prompt: [
      "Premium wordmark logo for 'DISCOVA' — a global tools discovery platform.",
      "All-caps geometric sans-serif typography, ultra-thin letterforms,",
      "the letter O replaced with a minimal compass/globe circle icon,",
      "pure white background, single colour: deep indigo #3B0069,",
      "extreme precision, Chanel perfume label meets Apple product launch slide,",
      "no effects, no shadows, no gradients — pure clean typographic identity,",
      "wide lettertracking, luxury fashion brand meets tech platform.",
      "Horizontal wordmark format on white.",
    ].join(" "),
  },
];

// ── WaveSpeed: submit job ─────────────────────────────────────────────────
async function submitJob(prompt) {
  const res = await fetch("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-dev", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WAVESPEED_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
      num_inference_steps: 28,   // flux-dev quality setting (vs 4 for schnell)
      guidance_scale: 7.5,
      num_images: 1,
      seed: -1,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`WaveSpeed submit failed ${res.status}: ${txt}`);
  }

  const body = await res.json();
  const pollUrl = body?.data?.urls?.get;
  if (!pollUrl) throw new Error("No polling URL returned: " + JSON.stringify(body));
  return pollUrl;
}

// ── WaveSpeed: poll until done ────────────────────────────────────────────
async function pollJob(pollUrl, label) {
  const MAX = 40;
  for (let i = 0; i < MAX; i++) {
    await new Promise(r => setTimeout(r, i === 0 ? 5000 : 3000));
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${WAVESPEED_KEY}` },
    });
    if (!res.ok) continue;
    const body = await res.json();
    const status = body?.data?.status;
    process.stdout.write(`\r  ⏳  ${label}: ${status} (${i + 1}/${MAX})          `);
    if (status === "completed") {
      console.log("");
      const outputs = body?.data?.outputs ?? [];
      return outputs[0] ?? null;
    }
    if (status === "failed") {
      console.log("");
      console.error(`  ❌  ${label} generation failed`);
      return null;
    }
  }
  console.log("");
  console.error(`  ⏱️  ${label} timed out`);
  return null;
}

// ── Cloudinary upload ─────────────────────────────────────────────────────
async function uploadToCloudinary(imageUrl, publicId) {
  if (!CLD_API_KEY || !CLD_API_SECRET) {
    console.warn("  ⚠️  Cloudinary not configured — returning raw WaveSpeed URL");
    return imageUrl;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signStr = `public_id=${publicId}&timestamp=${timestamp}${CLD_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signStr).digest("hex");

  const body = new URLSearchParams({
    file: imageUrl,
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: CLD_API_KEY,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/image/upload`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() },
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("  ⚠️  Cloudinary upload failed:", txt.slice(0, 200));
    return imageUrl; // fallback to raw URL
  }
  const data = await res.json();
  return data?.secure_url ?? imageUrl;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🎨  DISCOVA Logo Generator — WaveSpeed flux-dev + Cloudinary\n");
  console.log(`   Generating ${LOGO_PROMPTS.length} premium logo variations...\n`);
  console.log("   ⚠️  flux-dev takes ~60-90s per image (much higher quality than schnell)\n");

  const results = [];

  for (const variation of LOGO_PROMPTS) {
    console.log(`\n→  ${variation.label} (${variation.name})`);
    try {
      const pollUrl = await submitJob(variation.prompt);
      console.log(`  ✅  Job submitted — polling...`);
      const imageUrl = await pollJob(pollUrl, variation.label);
      if (!imageUrl) {
        results.push({ ...variation, url: null, error: "generation failed" });
        continue;
      }
      console.log(`  📸  Generated: ${imageUrl.slice(0, 80)}...`);

      const publicId = `discova/logos/${variation.name}-${Date.now()}`;
      const finalUrl = await uploadToCloudinary(imageUrl, publicId);
      console.log(`  ☁️   Cloudinary: ${finalUrl}`);

      results.push({ ...variation, url: finalUrl, rawUrl: imageUrl });
    } catch (err) {
      console.error(`  ❌  ${variation.label} error: ${err.message}`);
      results.push({ ...variation, url: null, error: err.message });
    }

    // Brief pause between jobs to be polite to the API
    if (variation !== LOGO_PROMPTS.at(-1)) {
      console.log("  ⏸️   Waiting 2s before next job...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ── Results summary ───────────────────────────────────────────────────
  console.log("\n\n══════════════════════════════════════════════");
  console.log("  🏆  DISCOVA Logo Generation — Results");
  console.log("══════════════════════════════════════════════\n");

  const successes = results.filter(r => r.url);
  const failures  = results.filter(r => !r.url);

  for (const r of successes) {
    console.log(`✅  ${r.label}`);
    console.log(`    ${r.url}\n`);
  }

  if (failures.length > 0) {
    console.log("\nFailed variations:");
    for (const r of failures) {
      console.log(`❌  ${r.label}: ${r.error}`);
    }
  }

  console.log(`\n📊  ${successes.length}/${results.length} logos generated successfully`);
  console.log("\n💡  Open each URL in your browser to preview the logos.");
  console.log("    Pick your favourite, then tell me which one to use as the");
  console.log("    official DISCOVA logo (we'll add it to the header and favicon).\n");

  // Write results to a JSON file for easy access
  const outputPath = resolve(__dirname, "../.discova-logos.json");
  const fs = await import("fs");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄  Full results saved to futurestack/.discova-logos.json\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
