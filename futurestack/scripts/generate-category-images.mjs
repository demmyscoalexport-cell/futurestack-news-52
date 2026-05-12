#!/usr/bin/env node
/**
 * Generates small AI images for each tool category using WaveSpeed + Cloudinary.
 * Run: node scripts/generate-category-images.mjs
 */
import { readFileSync } from "fs";
import https from "https";
import { URL as NURL } from "url";
import crypto from "crypto";

// Load .env.local
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const t = line.trim().replace(/\r$/, "");
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

const WS_KEY        = process.env.WAVESPEED_API_KEY;
const CL_CLOUD      = process.env.CLOUDINARY_CLOUD_NAME || "dxizihlmo";
const CL_KEY        = process.env.CLOUDINARY_API_KEY;
const CL_SECRET     = process.env.CLOUDINARY_API_SECRET;

if (!WS_KEY)   { console.error("❌ Missing WAVESPEED_API_KEY"); process.exit(1); }
if (!CL_KEY)   { console.error("❌ Missing CLOUDINARY_API_KEY"); process.exit(1); }

const CATEGORIES = [
  {
    id: "writing",
    prompt: "Minimalist app icon: glowing AI quill pen writing on dark background, electric blue light trails, clean geometric shapes, no text, no letters, flat vector, rounded square icon",
  },
  {
    id: "code",
    prompt: "Minimalist app icon: glowing code brackets with neon green matrix lines on dark background, clean flat vector, geometric, no text, no letters, rounded square icon",
  },
  {
    id: "design",
    prompt: "Minimalist app icon: colorful geometric shapes — circle triangle square — floating on dark background, vivid purple gradient palette, no text, no letters, flat vector, rounded square icon",
  },
  {
    id: "video",
    prompt: "Minimalist app icon: glowing film play button with cinematic light burst on dark background, warm orange red gradient, clean flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "audio",
    prompt: "Minimalist app icon: glowing sound wave lines forming a waveform on dark background, vibrant teal cyan gradient, clean flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "automation",
    prompt: "Minimalist app icon: interlocking glowing gears with flowing arrows on dark background, bright yellow amber gradient, flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "productivity",
    prompt: "Minimalist app icon: glowing lightning bolt with checkmark inside on dark background, energetic orange gradient, clean flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "data",
    prompt: "Minimalist app icon: glowing bar chart columns rising on dark background, cool blue purple gradient, clean flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "marketing",
    prompt: "Minimalist app icon: glowing megaphone with signal ripple waves on dark background, hot pink magenta gradient, clean flat vector, no text, no letters, rounded square icon",
  },
  {
    id: "analytics",
    prompt: "Minimalist app icon: glowing upward trending line chart with data points on dark background, emerald green gradient, clean flat vector, no text, no letters, rounded square icon",
  },
];

function httpReq(urlStr, opts = {}) {
  return new Promise((res, rej) => {
    const url = new NURL(urlStr);
    const lib = https;
    const req = https.request(url, { method: opts.method || "GET", headers: opts.headers || {} }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => {
        try { res({ status: r.statusCode, body: JSON.parse(d) }); }
        catch { res({ status: r.statusCode, body: d }); }
      });
    });
    req.on("error", rej);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function generateWaveSpeed(prompt) {
  const r = await httpReq("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-schnell", {
    method: "POST",
    headers: { Authorization: `Bearer ${WS_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, width: 256, height: 256, num_inference_steps: 4, guidance_scale: 3.5, num_images: 1 }),
  });
  if (r.status !== 200) throw new Error(`WaveSpeed ${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);

  const requestId = r.body?.data?.id;
  if (!requestId) throw new Error("No request ID in WaveSpeed response");

  // Poll /result endpoint
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const poll = await httpReq(`https://api.wavespeed.ai/api/v2/predictions/${requestId}/result`, {
      headers: { Authorization: `Bearer ${WS_KEY}` },
    });
    const status = poll.body?.data?.status;
    if (status === "completed") {
      const url = poll.body?.data?.outputs?.[0];
      if (url) return url;
      throw new Error("Completed but no output URL");
    }
    if (status === "failed") throw new Error(`WaveSpeed failed: ${poll.body?.data?.error}`);
  }
  throw new Error("WaveSpeed timeout after 60s");
}

async function uploadCloudinary(imageUrl, publicId) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "futurestack/categories";
  const fullPublicId = `${folder}/${publicId}`;
  const toSign = `public_id=${fullPublicId}&timestamp=${timestamp}&transformation=w_64,h_64,c_fill${CL_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  // Use fetch_url upload (upload from URL)
  const formData = [
    `file=${encodeURIComponent(imageUrl)}`,
    `public_id=${encodeURIComponent(fullPublicId)}`,
    `timestamp=${timestamp}`,
    `api_key=${CL_KEY}`,
    `signature=${signature}`,
    `transformation=w_64,h_64,c_fill`,
  ].join("&");

  const r = await httpReq(`https://api.cloudinary.com/v1_1/${CL_CLOUD}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (r.status !== 200) throw new Error(`Cloudinary ${r.status}: ${JSON.stringify(r.body).slice(0, 100)}`);
  return r.body.secure_url;
}

async function generateCategory(cat) {
  process.stdout.write(`  ${cat.id.padEnd(14)} `);
  try {
    const imgUrl = await generateWaveSpeed(cat.prompt);
    const cdnUrl = await uploadCloudinary(imgUrl, cat.id);
    console.log(`✅  ${cdnUrl}`);
    return { id: cat.id, url: cdnUrl };
  } catch (e) {
    console.log(`❌  ${e.message}`);
    return { id: cat.id, url: null };
  }
}

async function main() {
  console.log("\n🎨 Generating category images (256×256 via WaveSpeed → Cloudinary)…\n");

  // Generate 3 at a time to avoid rate limiting
  const results = [];
  for (let i = 0; i < CATEGORIES.length; i += 3) {
    const batch = CATEGORIES.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map(generateCategory));
    results.push(...batchResults);
    if (i + 3 < CATEGORIES.length) await sleep(1000);
  }

  const succeeded = results.filter((r) => r.url);
  console.log(`\n✅  Generated ${succeeded.length}/${CATEGORIES.length} category images\n`);

  console.log("// Paste this into tools-content.tsx CATEGORY_IMAGES:");
  console.log("const CATEGORY_IMAGES: Record<string, string> = {");
  for (const r of results) {
    if (r.url) console.log(`  ${r.id}: "${r.url}",`);
  }
  console.log("};");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
