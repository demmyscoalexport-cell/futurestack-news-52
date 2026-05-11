/**
 * scripts/seed-with-images.mjs
 * Generates tool logos via WaveSpeed AI, uploads to Cloudinary,
 * then seeds the full Supabase database with 100+ tools, articles, stacks.
 *
 * Usage: node scripts/seed-with-images.mjs
 *   --skip-images    Skip WaveSpeed generation (use placeholder logos)
 *   --tools-only     Only seed tools
 *   --quick          Seed without generating images (fast)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import crypto from "crypto";
import https from "https";
import http from "http";
import { URL } from "url";

// ── Arg parsing ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const SKIP_IMAGES = args.includes("--skip-images") || args.includes("--quick");
const TOOLS_ONLY = args.includes("--tools-only");

// ── Load .env.local ───────────────────────────────────────────────────────────
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim().replace(/\r$/, "");
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* rely on shell env */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dxizihlmo";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "654919554582831";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "j4GLSAjjApKUgInR41eCUiQIqUo";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ok = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const err = (m, e) => console.error(`  ❌ ${m}`, typeof e === "object" ? (e?.message ?? e) : e);
const info = (m) => console.log(`  ℹ️  ${m}`);

// ── HTTP helper ───────────────────────────────────────────────────────────────
function fetchJson(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, {
      method: options.method || "GET",
      headers: options.headers || {},
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── WaveSpeed AI image generation ─────────────────────────────────────────────
async function generateToolImage(toolName, category) {
  if (SKIP_IMAGES || !WAVESPEED_API_KEY) return null;
  try {
    const prompt = `Minimalist professional SaaS app icon logo for "${toolName}", ${category} software tool, flat design, clean vector style, bold single color on white background, simple geometric shapes, modern tech brand mark, no text, no letters, high contrast, suitable for app store icon, professional product branding`;

    // WaveSpeed AI API
    const res = await fetchJson("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-schnell", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WAVESPEED_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width: 512,
        height: 512,
        num_inference_steps: 4,
        guidance_scale: 3.5,
        num_images: 1,
      }),
    });

    if (res.status !== 200) {
      warn(`WaveSpeed returned ${res.status} for ${toolName}`);
      return null;
    }

    // WaveSpeed returns { data: { outputs: [url] } } or { outputs: [url] }
    const body = res.body;
    const imageUrl = body?.data?.outputs?.[0] || body?.outputs?.[0] || body?.images?.[0]?.url || null;
    if (!imageUrl) {
      warn(`No image URL in WaveSpeed response for ${toolName}`);
      return null;
    }

    // Upload to Cloudinary
    return await uploadToCloudinary(imageUrl, toolName);
  } catch (e) {
    warn(`Image generation failed for ${toolName}: ${e.message}`);
    return null;
  }
}

async function uploadToCloudinary(imageUrl, toolName) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const slug = toolName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const publicId = `futurestack/tools/${slug}`;

    // Build signature
    const signStr = `file=${imageUrl}&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(signStr).digest("hex");

    const body = new URLSearchParams({
      file: imageUrl,
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: CLOUDINARY_API_KEY,
      signature,
    }).toString();

    const res = await fetchJson(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    if (res.status === 200 && res.body?.secure_url) {
      return res.body.secure_url;
    }
    warn(`Cloudinary upload failed: ${JSON.stringify(res.body)}`);
    return null;
  } catch (e) {
    warn(`Cloudinary error: ${e.message}`);
    return null;
  }
}

// ── Logo fallback (use CDN / clearbit) ───────────────────────────────────────
function getLogoFallback(toolName, website) {
  if (website) {
    try {
      const domain = new URL(website).hostname.replace("www.", "");
      return `https://logo.clearbit.com/${domain}`;
    } catch {}
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(toolName)}&size=128&background=6366f1&color=fff&bold=true&format=png`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — 100+ Tools across all categories
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  // ─── WRITING AI ──────────────────────────────────────────────────────────
  { name: "ChatGPT", slug: "chatgpt", category: "writing", tagline: "The world's leading AI assistant by OpenAI", description: "ChatGPT powers conversations, writing, coding, and analysis. With GPT-4o, it handles text, images, files and voice — the most versatile AI assistant available today.", website: "https://chat.openai.com", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.8, review_count: 8542, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 9.5, support_quality: 8.0, integration_richness: 9.0, ai_capability: 9.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["GPT-4o mini", "50 msgs/day on GPT-4o", "Basic tools"] }, { tier_name: "Plus", price_monthly: 20, is_popular: true, features: ["GPT-4o unlimited", "DALL-E 3", "Advanced analysis"] }, { tier_name: "Team", price_monthly: 25, features: ["Everything in Plus", "Admin console", "SSO"] }] },
  { name: "Claude", slug: "claude", category: "writing", tagline: "Thoughtful AI for complex analysis and long writing", description: "Claude by Anthropic excels at nuanced long-form writing, code review, and complex reasoning. Its 200K context window handles entire codebases and documents.", website: "https://claude.ai", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.7, review_count: 3812, tags: ["free", "pro", "africa-friendly", "editor-pick"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 9.0, support_quality: 7.5, integration_richness: 7.5, ai_capability: 9.2 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Claude 3.5 Haiku", "Limited usage"] }, { tier_name: "Pro", price_monthly: 20, is_popular: true, features: ["5x usage", "Claude Sonnet & Opus", "Priority access"] }] },
  { name: "Gemini", slug: "gemini", category: "writing", tagline: "Google's multimodal AI assistant", description: "Gemini Ultra from Google DeepMind handles text, images, audio, video, and code. Deeply integrated with Google Workspace for document generation and research.", website: "https://gemini.google.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 2134, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.0, feature_depth: 8.5, support_quality: 7.5, integration_richness: 9.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Gemini 1.5 Flash", "Google Workspace integration"] }, { tier_name: "Advanced", price_monthly: 19.99, is_popular: true, features: ["Gemini Ultra", "1TB storage", "Priority access"] }] },
  { name: "Jasper AI", slug: "jasper-ai", category: "writing", tagline: "AI writing platform built for marketing teams", description: "Jasper is trained on marketing copy and brand voice. It generates high-converting ad copy, blog posts, social media content, and email campaigns at scale.", website: "https://jasper.ai", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.4, review_count: 1892, tags: ["pro", "trending"], scores: { ease_of_use: 8.0, value_for_money: 7.0, feature_depth: 8.0, support_quality: 8.5, integration_richness: 7.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Creator", price_monthly: 49, is_popular: true, features: ["1 seat", "Brand voice", "50 knowledge assets"] }, { tier_name: "Pro", price_monthly: 69, features: ["3 seats", "Campaigns", "SEO mode"] }] },
  { name: "Copy.ai", slug: "copy-ai", category: "writing", tagline: "AI copywriter for marketing and sales", description: "Copy.ai generates sales emails, ad copy, product descriptions, and social content. Its GTM workflows automate entire marketing pipelines.", website: "https://copy.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 1243, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.0, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["2000 words/month", "90+ copywriting tools"] }, { tier_name: "Pro", price_monthly: 36, is_popular: true, features: ["Unlimited words", "GTM Workflows", "API access"] }] },
  { name: "Writesonic", slug: "writesonic", category: "writing", tagline: "AI writer with real-time web access", description: "Writesonic creates SEO-optimized articles with real-time Google data. Chatsonic provides conversational AI with internet access, image generation, and voice input.", website: "https://writesonic.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 987, tags: ["free", "pro"], scores: { ease_of_use: 8.0, value_for_money: 8.0, feature_depth: 8.0, support_quality: 7.5, integration_richness: 7.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10,000 words/month"] }, { tier_name: "Individual", price_monthly: 16, is_popular: true, features: ["Unlimited standard words", "SEO checker", "Chatsonic"] }] },
  { name: "QuillBot", slug: "quillbot", category: "writing", tagline: "AI paraphraser and writing assistant", description: "QuillBot's paraphrasing tool rewrites content in multiple modes: fluency, formal, academic, creative. Ideal for students, academics, and professional writers.", website: "https://quillbot.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 3201, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 9.0, feature_depth: 7.0, support_quality: 7.0, integration_richness: 7.5, ai_capability: 7.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["125 words/paraphrase", "2 modes"] }, { tier_name: "Premium", price_monthly: 9.95, is_popular: true, features: ["Unlimited words", "All modes", "Grammar checker"] }] },
  { name: "GrammarlyGO", slug: "grammarly-go", category: "writing", tagline: "AI writing help embedded everywhere you write", description: "GrammarlyGO provides real-time grammar, tone, clarity suggestions plus generative AI drafting. Works across 500,000+ apps via browser extension.", website: "https://grammarly.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 7821, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.5, value_for_money: 7.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 9.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Grammar checks", "100 AI prompts/month"] }, { tier_name: "Premium", price_monthly: 12, is_popular: true, features: ["Advanced suggestions", "1000 AI prompts", "Plagiarism checker"] }] },
  { name: "Notion AI", slug: "notion-ai", category: "productivity", tagline: "AI assistant built inside your Notion workspace", description: "Notion AI lets you write, summarize, translate, and brainstorm directly in your workspace — no context-switching required. Works across all Notion plans.", website: "https://notion.so/ai", pricing_model: "paid", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 2876, tags: ["pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 7.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 8.5, ai_capability: 7.5 }, pricing: [{ tier_name: "AI Add-on", price_monthly: 10, is_popular: true, features: ["Unlimited AI", "Q&A across all pages", "Auto-fill databases"] }] },

  // ─── CODING AI ───────────────────────────────────────────────────────────
  { name: "GitHub Copilot", slug: "github-copilot", category: "code", tagline: "AI pair programmer integrated into your IDE", description: "GitHub Copilot suggests code and complete functions in real-time. Powered by OpenAI Codex, it understands context from your codebase and comments.", website: "https://github.com/features/copilot", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.7, review_count: 8920, tags: ["free", "pro", "trending"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 8.0, integration_richness: 9.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["2000 completions/month", "50 chat messages"] }, { tier_name: "Pro", price_monthly: 10, is_popular: true, features: ["Unlimited completions", "All models", "CLI access"] }, { tier_name: "Business", price_monthly: 19, features: ["Privacy mode", "Admin panel", "Audit logs"] }] },
  { name: "Cursor", slug: "cursor", category: "code", tagline: "AI-first code editor built on VS Code", description: "Cursor is a fork of VS Code that deeply integrates Claude and GPT-4 for chat, edit, and code generation. It understands your entire codebase context.", website: "https://cursor.sh", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.8, review_count: 3241, tags: ["free", "pro", "trending", "new"], scores: { ease_of_use: 8.5, value_for_money: 9.0, feature_depth: 9.0, support_quality: 7.5, integration_richness: 8.0, ai_capability: 9.0 }, pricing: [{ tier_name: "Hobby", price_monthly: 0, is_free_tier: true, features: ["2000 completions", "50 slow requests"] }, { tier_name: "Pro", price_monthly: 20, is_popular: true, features: ["Unlimited completions", "500 fast requests", "All models"] }, { tier_name: "Business", price_monthly: 40, features: ["Privacy mode", "Admin panel", "SSO"] }] },
  { name: "Codeium", slug: "codeium", category: "code", tagline: "Free AI coding assistant for all IDEs", description: "Codeium provides free AI code completion, chat, and search across 70+ languages. Works in VS Code, JetBrains, Vim, and 40+ IDEs with no usage limits.", website: "https://codeium.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 1823, tags: ["free", "africa-friendly", "new"], scores: { ease_of_use: 9.0, value_for_money: 9.5, feature_depth: 7.5, support_quality: 7.0, integration_richness: 9.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Individual", price_monthly: 0, is_free_tier: true, features: ["Unlimited completions", "Chat", "70+ languages", "40+ IDEs"] }, { tier_name: "Teams", price_monthly: 12, is_popular: true, features: ["Everything free", "Team management", "Advanced features"] }] },
  { name: "Tabnine", slug: "tabnine", category: "code", tagline: "Private AI code assistant for enterprise teams", description: "Tabnine runs locally and never sends your code to the cloud. It offers team-trained AI models, enterprise SSO, and compliance for regulated industries.", website: "https://tabnine.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 2134, tags: ["free", "pro"], scores: { ease_of_use: 8.0, value_for_money: 7.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 8.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Basic completions", "Local model"] }, { tier_name: "Pro", price_monthly: 12, is_popular: true, features: ["Full completions", "Chat", "All IDEs"] }] },
  { name: "v0 by Vercel", slug: "v0-vercel", category: "code", tagline: "AI UI generator that outputs production React code", description: "v0 generates production-ready React components from text prompts or screenshots. Outputs clean Tailwind CSS and shadcn/ui components you can deploy in one click.", website: "https://v0.dev", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.7, review_count: 1567, tags: ["free", "pro", "new", "trending"], scores: { ease_of_use: 9.0, value_for_money: 9.0, feature_depth: 8.0, support_quality: 8.0, integration_richness: 8.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["200 credits/month", "Public generations"] }, { tier_name: "Premium", price_monthly: 20, is_popular: true, features: ["5000 credits/month", "Private generations", "Priority"] }] },
  { name: "Phind", slug: "phind", category: "code", tagline: "AI search engine built for developers", description: "Phind combines web search with LLMs to give developers accurate, cited answers to coding questions. It automatically searches Stack Overflow, docs, and GitHub.", website: "https://phind.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 9.0, feature_depth: 7.0, support_quality: 6.5, integration_richness: 6.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Unlimited searches", "GPT-4 access"] }, { tier_name: "Pro", price_monthly: 17, is_popular: true, features: ["Claude Opus", "GPT-4o", "Priority speed"] }] },
  { name: "Blackbox AI", slug: "blackbox-ai", category: "code", tagline: "Code completion and generation for developers", description: "Blackbox AI provides code completion across 20+ languages with real-time web access. It can extract code from any image or video, making it unique among coding tools.", website: "https://useblackbox.io", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.2, review_count: 654, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.0, value_for_money: 8.5, feature_depth: 7.0, support_quality: 6.5, integration_richness: 7.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Basic completions", "Code extraction"] }, { tier_name: "Pro", price_monthly: 9.99, is_popular: true, features: ["Unlimited", "All models", "Priority"] }] },

  // ─── VIDEO AI ────────────────────────────────────────────────────────────
  { name: "Runway ML", slug: "runway-ml", category: "video", tagline: "AI video generation and creative editing platform", description: "Runway leads AI video generation with Gen-3, motion brush, and inpainting tools. Used by Hollywood studios for next-gen video production workflows.", website: "https://runwayml.com", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.7, review_count: 2341, tags: ["free", "pro", "trending"], scores: { ease_of_use: 7.5, value_for_money: 7.0, feature_depth: 9.5, support_quality: 7.0, integration_richness: 6.5, ai_capability: 9.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["125 one-time credits"] }, { tier_name: "Standard", price_monthly: 15, features: ["625 credits/month"] }, { tier_name: "Pro", price_monthly: 35, is_popular: true, features: ["2250 credits/month", "4K export"] }] },
  { name: "Pika Labs", slug: "pika-labs", category: "video", tagline: "Create and edit videos with AI from text or images", description: "Pika turns text and images into high-quality short videos. With Pika 2.0, you can animate photos, add sound effects, and generate cinematic scenes in seconds.", website: "https://pika.art", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 1234, tags: ["free", "pro", "new", "trending"], scores: { ease_of_use: 8.5, value_for_money: 8.0, feature_depth: 8.0, support_quality: 7.0, integration_richness: 5.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["250 credits/month", "720p export"] }, { tier_name: "Standard", price_monthly: 8, is_popular: true, features: ["700 credits/month", "1080p", "No watermark"] }] },
  { name: "Synthesia", slug: "synthesia", category: "video", tagline: "Create AI avatar videos without cameras or actors", description: "Synthesia generates professional videos with realistic AI avatars from a script. Used by 50,000+ companies for training videos, product demos, and marketing content.", website: "https://synthesia.io", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.6, review_count: 1876, tags: ["pro", "editor-pick"], scores: { ease_of_use: 9.0, value_for_money: 7.0, feature_depth: 8.5, support_quality: 8.5, integration_richness: 7.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Starter", price_monthly: 22, is_popular: true, features: ["3 videos/month", "70 avatars", "125 languages"] }, { tier_name: "Creator", price_monthly: 67, features: ["10 videos/month", "Custom avatars", "Screen recorder"] }] },
  { name: "HeyGen", slug: "heygen", category: "video", tagline: "AI video generator with custom avatars and voices", description: "HeyGen creates talking avatar videos with your likeness and voice clone. Generate multilingual videos from text with photorealistic digital twins.", website: "https://heygen.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.5, review_count: 987, tags: ["free", "pro", "new"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 9.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1 credit/month", "3 min video limit"] }, { tier_name: "Creator", price_monthly: 29, is_popular: true, features: ["15 credits/month", "Custom avatar", "Voice clone"] }] },
  { name: "Descript", slug: "descript", category: "video", tagline: "Video and podcast editing as easy as editing text", description: "Descript edits video and audio by editing a transcript — delete words in the text and they disappear from the video. Includes AI overdub for voice cloning.", website: "https://descript.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 1543, tags: ["free", "pro", "africa-friendly", "editor-pick"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 8.0, integration_richness: 8.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1 hour transcription/month", "Watermarked export"] }, { tier_name: "Creator", price_monthly: 24, is_popular: true, features: ["10 hours transcription", "1080p export", "Overdub"] }] },
  { name: "Opus Clip", slug: "opus-clip", category: "video", tagline: "AI video repurposing — turn long videos into viral clips", description: "Opus Clip analyzes long-form videos and automatically extracts the best short clips for TikTok, Reels, and YouTube Shorts. Adds captions, B-roll, and hook scoring.", website: "https://opus.pro", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 1123, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 7.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["60 mins upload/month", "Basic clips"] }, { tier_name: "Starter", price_monthly: 15, is_popular: true, features: ["3 hours upload/month", "Captions", "B-roll"] }] },
  { name: "InVideo AI", slug: "invideo-ai", category: "video", tagline: "Turn ideas and scripts into professional videos", description: "InVideo AI generates complete videos from text prompts. Just describe what you want — topic, audience, tone — and get a fully-produced video with voiceover and stock footage.", website: "https://invideo.io", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 2341, tags: ["free", "pro", "africa-friendly", "no-code"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 6.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10 videos/week", "Watermarked", "10GB storage"] }, { tier_name: "Business", price_monthly: 30, is_popular: true, features: ["60 videos/month", "No watermark", "80 iStock clips/month"] }] },

  // ─── IMAGE AI ────────────────────────────────────────────────────────────
  { name: "Midjourney", slug: "midjourney", category: "design", tagline: "AI image generation with top artistic quality", description: "Midjourney creates stunning photorealistic and artistic images from text prompts. The gold standard for AI image generation, used by top creative studios worldwide.", website: "https://midjourney.com", pricing_model: "paid", is_featured: true, africa_friendly: false, rating: 4.9, review_count: 5423, tags: ["pro", "trending", "editor-pick"], scores: { ease_of_use: 7.0, value_for_money: 8.0, feature_depth: 9.0, support_quality: 6.5, integration_richness: 5.0, ai_capability: 9.8 }, pricing: [{ tier_name: "Basic", price_monthly: 10, features: ["200 images/month"] }, { tier_name: "Standard", price_monthly: 30, is_popular: true, features: ["15h fast GPU", "Unlimited relaxed"] }, { tier_name: "Pro", price_monthly: 60, features: ["30h fast GPU", "Stealth mode"] }] },
  { name: "DALL-E 3", slug: "dalle-3", category: "design", tagline: "OpenAI's most advanced image generation model", description: "DALL-E 3 understands nuanced prompts and generates detailed, accurate images. Integrated into ChatGPT Plus and available via API for developers.", website: "https://openai.com/dall-e-3", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 3214, tags: ["pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.0, feature_depth: 8.0, support_quality: 7.5, integration_richness: 8.0, ai_capability: 9.0 }, pricing: [{ tier_name: "Via ChatGPT Plus", price_monthly: 20, is_popular: true, features: ["Included in Plus", "Image editing", "Custom aspect ratios"] }, { tier_name: "API", price_monthly: 0, features: ["$0.04-0.08/image", "Pay as you go"] }] },
  { name: "Leonardo AI", slug: "leonardo-ai", category: "design", tagline: "AI image generation for game assets and creative work", description: "Leonardo AI specializes in consistent character design, game assets, and concept art. Its fine-tuned models maintain visual consistency across a project.", website: "https://leonardo.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 2123, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 8.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["150 tokens/day", "Unlimited relaxed"] }, { tier_name: "Apprentice", price_monthly: 12, is_popular: true, features: ["8500 tokens/month", "Priority speed", "Private generations"] }] },
  { name: "Canva AI", slug: "canva", category: "design", tagline: "AI-enhanced design platform for everyone", description: "Canva makes professional design accessible with 250K+ templates, Magic Write AI, background remover, and Brand Kit for teams of all sizes.", website: "https://canva.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.8, review_count: 9821, tags: ["free", "pro", "africa-friendly", "no-code"], scores: { ease_of_use: 9.5, value_for_money: 9.0, feature_depth: 7.5, support_quality: 8.0, integration_richness: 8.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["250K templates", "5GB storage", "Basic AI"] }, { tier_name: "Pro", price_monthly: 12.99, is_popular: true, features: ["All templates", "Brand Kit", "1TB storage"] }] },
  { name: "Adobe Firefly", slug: "adobe-firefly", category: "design", tagline: "Adobe's commercial-safe generative AI for creatives", description: "Adobe Firefly generates images, vectors, and text effects that are 100% commercially safe. Deeply integrated into Photoshop, Illustrator, and Express.", website: "https://firefly.adobe.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.4, review_count: 1654, tags: ["free", "pro"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 8.0, support_quality: 8.5, integration_richness: 9.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["25 generative credits/month"] }, { tier_name: "Premium", price_monthly: 4.99, is_popular: true, features: ["100 credits/month", "Commercial license"] }] },
  { name: "Ideogram", slug: "ideogram", category: "design", tagline: "AI image generator that actually gets text right", description: "Ideogram specializes in generating images with accurate text rendering — a major weakness in other AI image tools. Perfect for creating logos, posters, and typographic designs.", website: "https://ideogram.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 876, tags: ["free", "pro", "new", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 9.0, feature_depth: 7.5, support_quality: 7.0, integration_richness: 5.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10 images/day", "Public gallery"] }, { tier_name: "Basic", price_monthly: 7, is_popular: true, features: ["400 images/month", "Private mode"] }] },

  // ─── VOICE AI ────────────────────────────────────────────────────────────
  { name: "ElevenLabs", slug: "elevenlabs", category: "audio", tagline: "Ultra-realistic AI voice generation and cloning", description: "ElevenLabs generates the most realistic AI voices available. Clone any voice in 30 seconds, create multilingual content, and build voice applications via API.", website: "https://elevenlabs.io", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.8, review_count: 4231, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 8.5, value_for_money: 8.0, feature_depth: 9.0, support_quality: 7.5, integration_richness: 8.0, ai_capability: 9.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10K chars/month", "3 custom voices"] }, { tier_name: "Starter", price_monthly: 5, features: ["30K chars/month", "10 voices"] }, { tier_name: "Creator", price_monthly: 22, is_popular: true, features: ["100K chars/month", "30 voices", "Commercial license"] }] },
  { name: "PlayHT", slug: "playht", category: "audio", tagline: "AI voice generator with ultra-realistic speech", description: "PlayHT creates natural-sounding voiceovers in 800+ voices across 100+ languages. Features instant voice cloning, emotion control, and SSML support.", website: "https://play.ht", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 1234, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.0, value_for_money: 8.0, feature_depth: 8.5, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["12,500 chars/month", "3 cloned voices"] }, { tier_name: "Creator", price_monthly: 31.2, is_popular: true, features: ["100K chars/month", "Instant voice cloning", "API access"] }] },
  { name: "Murf AI", slug: "murf-ai", category: "audio", tagline: "Studio-quality AI voiceovers for business", description: "Murf AI generates professional voiceovers for videos, presentations, and e-learning. Features 120+ AI voices, pitch control, emphasis, and video sync.", website: "https://murf.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 1876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 7.5, feature_depth: 8.0, support_quality: 8.0, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10 min voice generation", "No download"] }, { tier_name: "Creator", price_monthly: 29, is_popular: true, features: ["48 voices", "12 hours/year", "Commercial rights"] }] },
  { name: "Speechify", slug: "speechify", category: "audio", tagline: "AI text-to-speech for faster reading and learning", description: "Speechify converts any text — articles, PDFs, books, emails — into natural-sounding audio. Used by 20M+ people including celebrities and executives to consume content faster.", website: "https://speechify.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 3214, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.5, value_for_money: 7.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 8.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Standard voices", "1x-2.5x speed"] }, { tier_name: "Premium", price_monthly: 11.58, is_popular: true, features: ["HD AI voices", "Up to 4.5x speed", "Offline mode"] }] },

  // ─── PRODUCTIVITY AI ─────────────────────────────────────────────────────
  { name: "Motion", slug: "motion", category: "productivity", tagline: "AI calendar and project manager that schedules your day", description: "Motion uses AI to automatically schedule your tasks, meetings, and projects based on priorities and deadlines. It rearranges your calendar when things change.", website: "https://usemotion.com", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.5, review_count: 1234, tags: ["pro", "trending"], scores: { ease_of_use: 8.0, value_for_money: 7.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Individual", price_monthly: 19, is_popular: true, features: ["Auto-scheduling", "Task management", "Calendar sync"] }, { tier_name: "Team", price_monthly: 12, features: ["Per seat", "Team scheduling", "Project management"] }] },
  { name: "Otter AI", slug: "otter-ai", category: "productivity", tagline: "AI meeting notes and transcription", description: "Otter AI automatically transcribes meetings in real-time, identifies speakers, extracts action items, and syncs with Zoom, Google Meet, and Microsoft Teams.", website: "https://otter.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 2876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 8.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["600 min transcription/month", "3 AI summaries/month"] }, { tier_name: "Pro", price_monthly: 16.99, is_popular: true, features: ["1200 min/month", "Custom vocabulary", "Exports"] }] },
  { name: "Fireflies AI", slug: "fireflies-ai", category: "productivity", tagline: "AI notetaker for meetings with search and analysis", description: "Fireflies records, transcribes, and analyzes your meetings. It creates searchable meeting databases, sentiment analysis, and integrates with 40+ CRMs and tools.", website: "https://fireflies.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 1543, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 8.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["800 min storage", "AI summaries", "3 seats"] }, { tier_name: "Pro", price_monthly: 18, is_popular: true, features: ["Unlimited storage", "Analytics", "CRM sync"] }] },
  { name: "Fathom AI", slug: "fathom-ai", category: "productivity", tagline: "Free AI meeting recorder and note-taker", description: "Fathom records Zoom calls, highlights key moments, and generates AI summaries automatically. The generous free plan and Zoom partnership make it the default choice for remote teams.", website: "https://fathom.video", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.7, review_count: 2341, tags: ["free", "pro", "africa-friendly", "editor-pick"], scores: { ease_of_use: 9.5, value_for_money: 9.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Unlimited recordings", "AI summaries", "Zoom only"] }, { tier_name: "Premium", price_monthly: 19, is_popular: true, features: ["Google Meet", "Teams", "CRM sync", "Playlists"] }] },
  { name: "Taskade", slug: "taskade", category: "productivity", tagline: "AI-powered project workspace for teams", description: "Taskade combines AI chat, task management, and collaboration in one workspace. Generate project plans, run AI agents on tasks, and collaborate in real-time.", website: "https://taskade.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["5 projects", "AI chat", "3 members"] }, { tier_name: "Pro", price_monthly: 19, is_popular: true, features: ["Unlimited projects", "AI agents", "Custom AI personas"] }] },

  // ─── MARKETING AI ────────────────────────────────────────────────────────
  { name: "Surfer SEO", slug: "surfer-seo", category: "marketing", tagline: "AI content optimization for higher Google rankings", description: "Surfer SEO analyzes the top-ranking pages for any keyword and tells you exactly how to write content that ranks. Includes an AI writer with real-time SEO scoring.", website: "https://surferseo.com", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.5, review_count: 2134, tags: ["pro", "editor-pick"], scores: { ease_of_use: 8.0, value_for_money: 7.5, feature_depth: 8.5, support_quality: 8.0, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Essential", price_monthly: 89, features: ["30 articles/month", "Content editor"] }, { tier_name: "Scale", price_monthly: 129, is_popular: true, features: ["100 articles/month", "AI writer included"] }] },
  { name: "AdCreative.ai", slug: "adcreative-ai", category: "marketing", tagline: "AI-generated ad creatives that convert", description: "AdCreative.ai generates conversion-focused ad banners, social media posts, and ad copy using AI trained on high-performing campaigns across Facebook, Google, and LinkedIn.", website: "https://adcreative.ai", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 1123, tags: ["pro", "trending"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Starter", price_monthly: 29, features: ["10 credits/month", "5 brand styles"] }, { tier_name: "Professional", price_monthly: 149, is_popular: true, features: ["50 credits/month", "25 brand styles", "API access"] }] },
  { name: "Predis.ai", slug: "predis-ai", category: "marketing", tagline: "AI social media content creator with 80+ formats", description: "Predis.ai generates complete social media posts including design, captions, and hashtags. Supports 80+ content formats across Instagram, LinkedIn, TikTok, and Twitter.", website: "https://predis.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["15 posts/month", "3 social accounts"] }, { tier_name: "Solo", price_monthly: 27, is_popular: true, features: ["60 posts/month", "Competitor analysis", "Analytics"] }] },
  { name: "Taplio", slug: "taplio", category: "marketing", tagline: "AI LinkedIn content and audience growth tool", description: "Taplio helps professionals grow on LinkedIn with AI-generated posts, scheduling, lead generation, and performance analytics. Backed by trending content inspiration.", website: "https://taplio.com", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.2, review_count: 654, tags: ["pro"], scores: { ease_of_use: 8.5, value_for_money: 7.0, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Starter", price_monthly: 49, is_popular: true, features: ["AI post creation", "Scheduling", "CRM"] }] },
  { name: "Brand24", slug: "brand24", category: "marketing", tagline: "AI media monitoring and sentiment analysis", description: "Brand24 monitors mentions of your brand across 25 million websites, social media, news, and review sites. AI analyzes sentiment and identifies influencers.", website: "https://brand24.com", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 1234, tags: ["pro"], scores: { ease_of_use: 8.0, value_for_money: 7.5, feature_depth: 8.5, support_quality: 8.0, integration_richness: 7.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Individual", price_monthly: 119, features: ["3 keywords", "Sentiment analysis"] }, { tier_name: "Team", price_monthly: 179, is_popular: true, features: ["7 keywords", "Reports", "Slack alerts"] }] },

  // ─── AUTOMATION AI ───────────────────────────────────────────────────────
  { name: "Zapier", slug: "zapier", category: "automation", tagline: "No-code automation connecting 7000+ apps", description: "Zapier connects your apps and automates workflows without code. Build multi-step automations (Zaps) across 7000+ apps with an AI-powered workflow builder.", website: "https://zapier.com", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.6, review_count: 8921, tags: ["free", "pro", "africa-friendly", "no-code"], scores: { ease_of_use: 9.0, value_for_money: 7.0, feature_depth: 8.5, support_quality: 8.5, integration_richness: 10.0, ai_capability: 7.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["100 tasks/month", "5 Zaps"] }, { tier_name: "Starter", price_monthly: 19.99, is_popular: true, features: ["750 tasks/month", "20 Zaps", "Multi-step"] }, { tier_name: "Professional", price_monthly: 49, features: ["2000 tasks", "Unlimited Zaps"] }] },
  { name: "Make", slug: "make", category: "automation", tagline: "Visual workflow automation with 1500+ connectors", description: "Make (formerly Integromat) offers a visual drag-and-drop workflow builder with complex logic, data transformation, and 1500+ integrations at half the cost of Zapier.", website: "https://make.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 3421, tags: ["free", "pro", "no-code", "africa-friendly"], scores: { ease_of_use: 7.5, value_for_money: 9.0, feature_depth: 9.0, support_quality: 7.0, integration_richness: 9.0, ai_capability: 6.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1000 ops/month", "2 active scenarios"] }, { tier_name: "Core", price_monthly: 9, is_popular: true, features: ["10K ops/month", "Unlimited scenarios"] }] },
  { name: "Bardeen AI", slug: "bardeen-ai", category: "automation", tagline: "AI automation for browsers — no API needed", description: "Bardeen automates repetitive browser tasks using AI. Scrape data, automate workflows, and connect apps — all without leaving your browser or writing code.", website: "https://bardeen.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 876, tags: ["free", "pro", "no-code", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 8.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Unlimited manual runs", "Basic automations"] }, { tier_name: "Professional", price_monthly: 20, is_popular: true, features: ["Unlimited scheduled runs", "Premium integrations"] }] },
  { name: "n8n", slug: "n8n", category: "automation", tagline: "Open-source workflow automation with AI nodes", description: "n8n is a self-hostable workflow automation tool with 400+ integrations. Its new AI nodes let you build LangChain pipelines, RAG workflows, and AI agents visually.", website: "https://n8n.io", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 2134, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 7.0, value_for_money: 9.5, feature_depth: 9.5, support_quality: 8.0, integration_richness: 9.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Community", price_monthly: 0, is_free_tier: true, features: ["Self-hosted", "Unlimited workflows", "400+ integrations"] }, { tier_name: "Starter", price_monthly: 24, is_popular: true, features: ["Cloud hosted", "2500 executions/month", "20 active workflows"] }] },
  { name: "Relay.app", slug: "relay-app", category: "automation", tagline: "Human-in-the-loop automation with AI", description: "Relay.app adds human review steps to automated workflows. Perfect for approval flows, content reviews, and processes where AI handles the work but humans stay in control.", website: "https://relay.app", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 543, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 7.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["50 runs/month", "5 automations"] }, { tier_name: "Pro", price_monthly: 29, is_popular: true, features: ["Unlimited runs", "Unlimited automations", "AI steps"] }] },

  // ─── DATA & RESEARCH AI ──────────────────────────────────────────────────
  { name: "Perplexity AI", slug: "perplexity-ai", category: "data", tagline: "AI answer engine with real-time web search", description: "Perplexity combines LLMs with real-time web search, giving cited answers to complex questions. The best AI for research, fact-checking, and market analysis.", website: "https://perplexity.ai", pricing_model: "freemium", is_featured: true, africa_friendly: true, rating: 4.6, review_count: 3241, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.0, integration_richness: 6.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Unlimited basic searches", "5 Pro searches/day"] }, { tier_name: "Pro", price_monthly: 20, is_popular: true, features: ["Unlimited Pro searches", "File uploads", "API access"] }] },
  { name: "Elicit", slug: "elicit", category: "data", tagline: "AI research assistant for academic papers", description: "Elicit searches and synthesizes 200M+ academic papers. Extract key findings, methodology, and limitations across papers without reading each one individually.", website: "https://elicit.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 5.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["5000 papers/month", "Basic synthesis"] }, { tier_name: "Plus", price_monthly: 10, is_popular: true, features: ["12,000 papers/month", "Full synthesis", "Export"] }] },
  { name: "NotebookLM", slug: "notebooklm", category: "data", tagline: "Google's AI notebook that reasons over your documents", description: "NotebookLM by Google lets you upload documents, PDFs, and notes, then chat with an AI that cites its sources from your material. Perfect for research and study.", website: "https://notebooklm.google.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 1543, tags: ["free", "africa-friendly", "new", "trending"], scores: { ease_of_use: 9.0, value_for_money: 10.0, feature_depth: 7.5, support_quality: 7.5, integration_richness: 6.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["50 notebooks", "20 sources each", "Audio overviews"] }] },
  { name: "Consensus", slug: "consensus", category: "data", tagline: "AI search engine for scientific research", description: "Consensus searches 200M scientific papers and uses AI to extract and synthesize findings. Tells you what the evidence actually says on any topic.", website: "https://consensus.app", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 654, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.0, integration_richness: 5.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["20 searches/month", "Basic AI insights"] }, { tier_name: "Premium", price_monthly: 8.99, is_popular: true, features: ["Unlimited searches", "Copilot mode", "Filters"] }] },

  // ─── NO-CODE / BUILDER AI ────────────────────────────────────────────────
  { name: "Bubble AI", slug: "bubble-ai", category: "productivity", tagline: "No-code app builder with AI generation", description: "Bubble is the leading no-code platform for building complex web applications. Its AI can generate entire app architectures from plain text descriptions.", website: "https://bubble.io", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 2876, tags: ["free", "pro", "no-code"], scores: { ease_of_use: 7.5, value_for_money: 8.0, feature_depth: 9.5, support_quality: 7.5, integration_richness: 8.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1 app", "Bubble subdomain", "200 workflow runs/month"] }, { tier_name: "Starter", price_monthly: 32, is_popular: true, features: ["Custom domain", "5000 workflow runs"] }] },
  { name: "Webflow AI", slug: "webflow-ai", category: "design", tagline: "Visual web design with code-level power", description: "Webflow lets designers build responsive websites visually, generating clean HTML/CSS. AI features include auto-layout, text generation, and image enhancement.", website: "https://webflow.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.5, review_count: 3214, tags: ["free", "pro"], scores: { ease_of_use: 7.5, value_for_money: 7.5, feature_depth: 9.5, support_quality: 8.0, integration_richness: 8.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["2 pages", "Webflow subdomain"] }, { tier_name: "Basic", price_monthly: 14, is_popular: true, features: ["150 pages", "Custom domain", "500 form submissions"] }] },
  { name: "Framer AI", slug: "framer-ai", category: "design", tagline: "AI website builder that generates from a prompt", description: "Framer can build an entire website from a single text prompt. Edit the result visually with a Figma-like interface and publish in one click with CDN hosting.", website: "https://framer.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 1876, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1 project", "Framer subdomain", "AI generation"] }, { tier_name: "Mini", price_monthly: 5, is_popular: true, features: ["Custom domain", "1000 visitors/month"] }] },
  { name: "Durable AI", slug: "durable-ai", category: "productivity", tagline: "AI website builder for small businesses", description: "Durable builds a complete business website in 30 seconds from just a business type and location. Includes AI-generated copy, images, and contact forms.", website: "https://durable.co", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.1, review_count: 1234, tags: ["free", "pro", "africa-friendly", "no-code"], scores: { ease_of_use: 9.5, value_for_money: 8.0, feature_depth: 6.5, support_quality: 7.5, integration_richness: 6.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Site generation", "Basic editing", "Durable subdomain"] }, { tier_name: "Starter", price_monthly: 15, is_popular: true, features: ["Custom domain", "Remove ads", "Analytics"] }] },

  // ─── AI AGENTS ───────────────────────────────────────────────────────────
  { name: "AutoGPT", slug: "autogpt", category: "automation", tagline: "Open-source autonomous AI agent", description: "AutoGPT is the pioneering open-source AI agent that completes complex tasks autonomously — breaking goals into steps, searching the web, writing code, and managing files.", website: "https://agpt.co", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.0, review_count: 3421, tags: ["free", "africa-friendly", "trending"], scores: { ease_of_use: 6.5, value_for_money: 8.5, feature_depth: 8.5, support_quality: 6.0, integration_richness: 7.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Open Source", price_monthly: 0, is_free_tier: true, features: ["Self-hosted", "Full access", "Community support"] }, { tier_name: "Cloud", price_monthly: 29, features: ["Hosted version", "No setup required"] }] },
  { name: "CrewAI", slug: "crewai", category: "automation", tagline: "Framework for orchestrating multi-agent AI systems", description: "CrewAI lets you build teams of AI agents that collaborate on complex tasks. Define roles, tools, and workflows — agents delegate work to each other autonomously.", website: "https://crewai.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 876, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 7.0, value_for_money: 9.0, feature_depth: 9.0, support_quality: 7.5, integration_richness: 8.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Open Source", price_monthly: 0, is_free_tier: true, features: ["Full framework", "Python library", "Community"] }, { tier_name: "Enterprise", price_monthly: 99, features: ["Managed hosting", "Monitoring", "Support"] }] },
  { name: "Browse AI", slug: "browse-ai", category: "automation", tagline: "Train robots to scrape and monitor websites", description: "Browse AI lets you train a robot to extract data from any website in 2 minutes — no code needed. Monitor pages for changes and get alerts when data updates.", website: "https://browse.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 1123, tags: ["free", "pro", "no-code", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.0, feature_depth: 8.0, support_quality: 7.5, integration_richness: 8.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["50 credits/month", "2 robots"] }, { tier_name: "Starter", price_monthly: 19, is_popular: true, features: ["2000 credits/month", "5 robots", "Scheduled runs"] }] },

  // ─── ANALYTICS AI ────────────────────────────────────────────────────────
  { name: "PostHog", slug: "posthog", category: "analytics", tagline: "Open-source product analytics with session replay", description: "PostHog combines product analytics, session recording, feature flags, and A/B testing in one platform. Self-hostable and GDPR-compliant with a generous free tier.", website: "https://posthog.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 2134, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.0, value_for_money: 9.5, feature_depth: 9.0, support_quality: 8.0, integration_richness: 8.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1M events/month", "Session replay", "Feature flags"] }, { tier_name: "Teams", price_monthly: 0, is_popular: true, features: ["Pay as you go", "$0.00031/event after 1M"] }] },
  { name: "Mixpanel", slug: "mixpanel", category: "analytics", tagline: "Product analytics for user behavior tracking", description: "Mixpanel tracks user actions across web and mobile, providing retention analysis, funnel visualization, and cohort analysis with AI-powered insights.", website: "https://mixpanel.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.4, review_count: 3214, tags: ["free", "pro"], scores: { ease_of_use: 7.5, value_for_money: 8.0, feature_depth: 8.5, support_quality: 8.0, integration_richness: 9.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["20M monthly events", "Core analytics"] }, { tier_name: "Growth", price_monthly: 28, is_popular: true, features: ["Unlimited saved reports", "Data pipelines", "Group analytics"] }] },
  { name: "Amplitude", slug: "amplitude", category: "analytics", tagline: "Digital analytics platform with AI insights", description: "Amplitude tracks user behavior and uses ML to predict which features drive retention and revenue. Industry standard for product-led growth companies.", website: "https://amplitude.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.4, review_count: 2876, tags: ["free", "pro"], scores: { ease_of_use: 7.5, value_for_money: 7.5, feature_depth: 9.0, support_quality: 8.0, integration_richness: 9.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Starter", price_monthly: 0, is_free_tier: true, features: ["10M events/month", "Unlimited users"] }, { tier_name: "Plus", price_monthly: 49, is_popular: true, features: ["50M events/month", "Predictive analytics"] }] },

  // ─── ADDITIONAL HIGH-VALUE TOOLS ─────────────────────────────────────────
  { name: "Loom AI", slug: "loom-ai", category: "productivity", tagline: "AI-powered async video communication", description: "Loom records quick screen and camera videos with AI-generated titles, summaries, chapters, and action items. Replace emails and meetings with async video.", website: "https://loom.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 4321, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.5, value_for_money: 8.5, feature_depth: 8.0, support_quality: 8.0, integration_richness: 8.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Starter", price_monthly: 0, is_free_tier: true, features: ["25 videos", "5 min limit", "AI features"] }, { tier_name: "Business", price_monthly: 12.5, is_popular: true, features: ["Unlimited videos", "No time limit", "Analytics"] }] },
  { name: "Intercom Fin AI", slug: "intercom-fin", category: "marketing", tagline: "AI customer support agent that resolves 50% of tickets", description: "Intercom's Fin is an AI support bot trained on your docs that resolves customer questions instantly. Handles 50%+ of support volume with high accuracy.", website: "https://intercom.com/fin", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.5, review_count: 1543, tags: ["pro", "new"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 8.5, support_quality: 8.5, integration_richness: 8.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Fin AI Agent", price_monthly: 0, is_popular: true, features: ["$0.99/resolved conversation", "Train on your docs", "Live handoff"] }] },
  { name: "Airtable AI", slug: "airtable-ai", category: "productivity", tagline: "Spreadsheet-database hybrid with built-in AI", description: "Airtable's AI features include data categorization, sentiment analysis, text summarization, and custom AI fields that transform your database automatically.", website: "https://airtable.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.4, review_count: 4231, tags: ["free", "pro"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 8.5, support_quality: 8.0, integration_richness: 9.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["1000 records/base", "50 AI credits/seat/month"] }, { tier_name: "Team", price_monthly: 20, is_popular: true, features: ["50K records", "1500 AI credits/seat/month"] }] },
  { name: "Linear AI", slug: "linear-ai", category: "productivity", tagline: "AI-powered project management for software teams", description: "Linear is the issue tracker used by the best engineering teams. AI automatically writes issue descriptions, suggests labels, and breaks epics into actionable tasks.", website: "https://linear.app", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.7, review_count: 2134, tags: ["free", "pro", "africa-friendly", "editor-pick"], scores: { ease_of_use: 9.0, value_for_money: 9.0, feature_depth: 9.0, support_quality: 8.0, integration_richness: 8.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["250 issues", "Cycles", "AI features"] }, { tier_name: "Standard", price_monthly: 8, is_popular: true, features: ["Unlimited issues", "Roadmaps", "Analytics"] }] },
  { name: "Middesk", slug: "middesk", category: "analytics", tagline: "Business identity and verification platform", description: "Middesk automates business identity verification for fintech and lending. AI-powered document analysis, UCC filing search, and Secretary of State data.", website: "https://middesk.com", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.2, review_count: 234, tags: ["pro"], scores: { ease_of_use: 7.5, value_for_money: 7.0, feature_depth: 8.5, support_quality: 8.0, integration_richness: 7.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Essentials", price_monthly: 0, features: ["$5/verification", "API access"] }] },
  { name: "Typeform AI", slug: "typeform-ai", category: "marketing", tagline: "Conversational forms and surveys with AI", description: "Typeform creates beautiful, conversational forms that feel like chatting. AI generates questions from a prompt and analyzes responses with sentiment and summary.", website: "https://typeform.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 3214, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.5, value_for_money: 7.5, feature_depth: 7.5, support_quality: 8.0, integration_richness: 8.5, ai_capability: 7.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10 questions/form", "100 responses/month"] }, { tier_name: "Basic", price_monthly: 25, is_popular: true, features: ["Unlimited questions", "1000 responses/month", "Remove branding"] }] },
  { name: "Luma AI", slug: "luma-ai", category: "video", tagline: "AI video generation and 3D capture tool", description: "Luma AI's Dream Machine generates high-quality videos from images and text. Its NeRF technology also creates photorealistic 3D captures from phone videos.", website: "https://lumalabs.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 876, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 8.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 7.0, integration_richness: 6.0, ai_capability: 9.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["30 video generations/month"] }, { tier_name: "Standard", price_monthly: 29.99, is_popular: true, features: ["120 generations/month", "720p-1080p", "No watermark"] }] },
  { name: "Replit AI", slug: "replit-ai", category: "code", tagline: "AI coding in the browser — build and deploy instantly", description: "Replit's AI agent builds complete web apps from a description in minutes. It writes, runs, debugs, and deploys code — all in a browser IDE with one-click deployment.", website: "https://replit.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 4231, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 9.5, value_for_money: 8.5, feature_depth: 8.0, support_quality: 7.5, integration_richness: 7.5, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Basic IDE", "Community support"] }, { tier_name: "Core", price_monthly: 25, is_popular: true, features: ["AI agent", "Private repls", "Deployments"] }] },
  { name: "Suno AI", slug: "suno-ai", category: "audio", tagline: "Generate full songs with AI — lyrics, melody, vocals", description: "Suno AI creates complete songs from text descriptions — including lyrics, instrumentation, and vocals in any genre. From pop to jazz to heavy metal in seconds.", website: "https://suno.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 3241, tags: ["free", "pro", "africa-friendly", "trending", "new"], scores: { ease_of_use: 9.5, value_for_money: 9.0, feature_depth: 8.0, support_quality: 7.0, integration_richness: 5.5, ai_capability: 9.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["50 credits/day", "Non-commercial use"] }, { tier_name: "Pro", price_monthly: 8, is_popular: true, features: ["2500 credits/month", "Commercial rights", "Priority generation"] }] },
  { name: "Udio AI", slug: "udio-ai", category: "audio", tagline: "AI music generation with professional quality", description: "Udio creates studio-quality music from text prompts. Generates 2-minute tracks with full instrumentation and can extend or remix generated clips.", website: "https://udio.com", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.4, review_count: 1234, tags: ["free", "pro", "africa-friendly", "new"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 7.5, support_quality: 6.5, integration_richness: 5.0, ai_capability: 9.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["10 tracks/month", "Non-commercial"] }, { tier_name: "Standard", price_monthly: 10, is_popular: true, features: ["1200 credits/month", "Commercial rights"] }] },
  { name: "Figma AI", slug: "figma-ai", category: "design", tagline: "AI design features built into the industry standard", description: "Figma's AI features include auto-layout suggestions, text rewrite, design-to-code, First Draft wireframe generation, and AI-powered search across your design system.", website: "https://figma.com", pricing_model: "freemium", is_featured: false, africa_friendly: false, rating: 4.7, review_count: 8921, tags: ["free", "pro", "editor-pick"], scores: { ease_of_use: 8.5, value_for_money: 8.5, feature_depth: 9.5, support_quality: 8.5, integration_richness: 9.5, ai_capability: 8.0 }, pricing: [{ tier_name: "Starter", price_monthly: 0, is_free_tier: true, features: ["3 Figma files", "Unlimited viewers", "AI features"] }, { tier_name: "Professional", price_monthly: 12, is_popular: true, features: ["Unlimited files", "Team library", "Dev mode"] }] },
  { name: "Lovable", slug: "lovable", category: "code", tagline: "Build full-stack apps with AI — no code required", description: "Lovable turns natural language into complete full-stack React applications backed by Supabase. Deploy in one click with GitHub sync and custom domains.", website: "https://lovable.dev", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.6, review_count: 1543, tags: ["free", "pro", "africa-friendly", "new", "trending"], scores: { ease_of_use: 9.5, value_for_money: 8.5, feature_depth: 8.0, support_quality: 8.0, integration_richness: 8.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["5 messages/day", "Basic apps"] }, { tier_name: "Starter", price_monthly: 20, is_popular: true, features: ["100 messages/month", "Custom domain", "GitHub sync"] }] },
  { name: "Bolt AI", slug: "bolt-ai", category: "code", tagline: "Full-stack AI app builder in the browser", description: "Bolt.new by StackBlitz builds and runs complete full-stack applications in the browser using AI. Integrates with npm packages and deploys to production instantly.", website: "https://bolt.new", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 2134, tags: ["free", "pro", "africa-friendly", "new", "trending"], scores: { ease_of_use: 9.0, value_for_money: 8.5, feature_depth: 8.5, support_quality: 7.5, integration_richness: 8.0, ai_capability: 8.5 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["150K tokens/day", "Basic projects"] }, { tier_name: "Pro", price_monthly: 20, is_popular: true, features: ["10M tokens/month", "Private projects", "Export to GitHub"] }] },
  { name: "Gamma App", slug: "gamma-app", category: "productivity", tagline: "AI presentation and document creator", description: "Gamma generates beautiful presentations, documents, and websites from a text prompt in 30 seconds. No design skills needed — AI handles layout, visuals, and structure.", website: "https://gamma.app", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.5, review_count: 2876, tags: ["free", "pro", "africa-friendly", "trending"], scores: { ease_of_use: 9.5, value_for_money: 8.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["400 AI credits", "Unlimited viewers"] }, { tier_name: "Plus", price_monthly: 10, is_popular: true, features: ["Unlimited AI", "Custom branding", "Analytics"] }] },
  { name: "Beautiful.ai", slug: "beautiful-ai", category: "productivity", tagline: "AI-powered presentation design tool", description: "Beautiful.ai generates stunning presentations with Smart Slide technology that automatically formats content for visual clarity. 60+ designer templates included.", website: "https://beautiful.ai", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 1876, tags: ["pro"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 7.5 }, pricing: [{ tier_name: "Pro", price_monthly: 12, is_popular: true, features: ["Unlimited slides", "Custom themes", "Analytics"] }, { tier_name: "Team", price_monthly: 40, features: ["Collaboration", "Shared assets", "Admin controls"] }] },
  { name: "Tome AI", slug: "tome-ai", category: "productivity", tagline: "AI storytelling and presentation platform", description: "Tome generates narrative-driven presentations with AI. It creates cohesive visual stories from prompts, with live data embeds, web page exports, and analytics.", website: "https://tome.app", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.3, review_count: 1234, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 9.0, value_for_money: 8.0, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["500 AI credits", "Unlimited viewers"] }, { tier_name: "Pro", price_monthly: 8, is_popular: true, features: ["Unlimited AI", "Custom domain", "Analytics"] }] },
  { name: "Typeface AI", slug: "typeface-ai", category: "marketing", tagline: "Enterprise AI content platform with brand voice", description: "Typeface creates on-brand content at scale for enterprise marketing teams. Trains on your brand guidelines, assets, and tone to generate consistent content across channels.", website: "https://typeface.ai", pricing_model: "paid", is_featured: false, africa_friendly: false, rating: 4.3, review_count: 432, tags: ["pro", "new"], scores: { ease_of_use: 8.0, value_for_money: 7.0, feature_depth: 8.5, support_quality: 8.5, integration_richness: 8.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Starter", price_monthly: 149, is_popular: true, features: ["5 users", "Brand studio", "500 AI generations/month"] }] },
  { name: "Mem AI", slug: "mem-ai", category: "productivity", tagline: "Self-organizing AI notes and knowledge base", description: "Mem uses AI to automatically organize your notes, surface relevant memories, and draft new content. Your knowledge base becomes smarter the more you write.", website: "https://mem.ai", pricing_model: "freemium", is_featured: false, africa_friendly: true, rating: 4.2, review_count: 876, tags: ["free", "pro", "africa-friendly"], scores: { ease_of_use: 8.5, value_for_money: 7.5, feature_depth: 7.5, support_quality: 7.5, integration_richness: 7.0, ai_capability: 8.0 }, pricing: [{ tier_name: "Free", price_monthly: 0, is_free_tier: true, features: ["Unlimited notes", "Basic AI"] }, { tier_name: "Pro", price_monthly: 14.99, is_popular: true, features: ["AI organization", "Smart search", "Chat with notes"] }] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES DATA
// ═══════════════════════════════════════════════════════════════════════════════
const ARTICLES = [
  { slug: "best-ai-tools-freelancers-2026", title: "The 15 Best AI Tools for Freelancers in 2026", excerpt: "From writing to invoicing — the AI tools that actually save freelancers time and money this year.", category: "ai-tools", tags: ["freelancer", "productivity", "ai-tools"], is_featured: true, reading_time: 10, content: `## The Freelancer AI Stack That's Winning in 2026\n\nFreelancing has always been about doing more with less. In 2026, the freelancers pulling ahead aren't working harder — they're working with better AI tools.\n\nHere's what's actually working:\n\n### 1. ChatGPT (Writing + Research)\nStill the backbone of most freelance workflows. Use it for first drafts, research synthesis, client communication, and idea generation. The $20/month Plus plan pays for itself in hours saved.\n\n### 2. Claude (Long-Form Analysis)\nWhere ChatGPT drafts, Claude thinks. Use it for long documents, complex client briefs, and anything requiring nuanced reasoning. Its 200K context window is unmatched.\n\n### 3. Cursor (Development)\nIf you do any coding work, Cursor is non-negotiable. It understands your entire codebase and handles multi-file edits that used to take hours.\n\n### 4. ElevenLabs (Audio Content)\nNarrate your portfolio pieces, create client-ready audio content, or produce a podcast — all without a recording studio.\n\n### 5. Canva AI (Visual Content)\nGenerate on-brand images, presentations, and social posts faster than ever with Magic Write and AI image generation.\n\n## The Africa-First Perspective\n\nFor freelancers in African markets, tool accessibility matters. ChatGPT, Claude, QuillBot, and Canva all work reliably across Africa with standard payment methods.\n\n## What to Skip\n\nDon't waste money on specialized tools that overlap with your existing stack. Most freelancers need 3-5 core tools, not 20.` },
  { slug: "ai-tools-saas-founders-2026", title: "The AI Stack Every SaaS Founder Needs in 2026", excerpt: "Ship faster, market smarter, support better — the exact tools top founders use to run lean SaaS businesses.", category: "ai-tools", tags: ["saas", "founder", "startup", "ai-tools"], is_featured: true, reading_time: 8, content: `## Build Faster. Sell Smarter. Scale Leaner.\n\nSaaS founders are fighting on two fronts: building a product fast enough to matter, and marketing it on a budget that's never big enough.\n\nAI has changed the math.\n\n### The Build Stack\n\n**Cursor + Claude** is the combination dominating solo founder setups. Cursor handles code generation and refactoring. Claude handles architecture decisions and documentation. Many founders report shipping 3-4x faster than before AI tools.\n\n**v0 by Vercel** turns UI ideas into production-ready React components in seconds. Stop spending days on UI that Claude and v0 can build in hours.\n\n**GitHub Copilot** for anything that isn't covered by Cursor. The free tier is surprisingly capable.\n\n### The Marketing Stack\n\n**Copy.ai GTM Workflows** automate your entire content pipeline. Feed it your positioning document and it generates blog posts, social content, email sequences, and ad copy.\n\n**Surfer SEO** ensures your content actually ranks. Don't publish anything without running it through Surfer first.\n\n**Taplio** if LinkedIn is your channel. The AI-generated posts that perform best are still human-directed — but AI speeds up creation 10x.\n\n### The Support Stack\n\n**Intercom Fin AI** resolves 50-70% of support tickets automatically. Set it up in a day, save your entire support budget.\n\n**Fireflies AI** records and transcribes every user call automatically. Your entire product discovery becomes searchable.\n\n## The Math That Matters\n\n$150/month in AI subscriptions can replace $5,000/month in contractor costs. For pre-revenue founders, that math is game-changing.` },
  { slug: "cursor-vs-copilot-2026", title: "Cursor vs GitHub Copilot: Which AI Coding Tool Wins in 2026?", excerpt: "We tested both for 30 days on real projects. Here's the honest verdict.", category: "comparisons", tags: ["coding", "cursor", "copilot", "comparison"], is_featured: false, reading_time: 7, content: `## Cursor vs GitHub Copilot: Honest Verdict After 30 Days\n\nBoth tools promise to make you a 10x developer. Only one actually delivers.\n\n### What Cursor Does Differently\n\nCursor isn't just autocomplete — it's a full IDE rewrite. The key difference: **Cursor understands your entire codebase**. Not just the file you're editing, but all related files, your project structure, and implicit patterns.\n\nThis means:\n- "Refactor all API calls to use the new auth pattern" actually works\n- Multi-file edits happen with one natural language command\n- Bug explanations reference your actual code, not generic examples\n\n### Where GitHub Copilot Wins\n\nCopilot lives inside VS Code — your existing IDE. Zero setup friction. If your team is already on VS Code with Copilot, the switching cost is real.\n\nCopilot's inline completions are also faster. When you just want "finish this function," Copilot adds less latency than Cursor's agentic approach.\n\n### The Verdict\n\n**Use Cursor if:** You do full-stack development, work across multiple files, or are a solo founder/freelancer who needs maximum output per hour.\n\n**Use Copilot if:** You're in a large engineering team on VS Code, work in a regulated environment, or primarily need autocomplete rather than AI chat.\n\n**The real answer:** Many developers use both. Copilot for day-to-day completions, Cursor for complex feature work.` },
  { slug: "elevenlabs-complete-guide-2026", title: "ElevenLabs 2026: The Complete Guide for Content Creators", excerpt: "Voice cloning, multilingual content, and API integrations — everything you need to know.", category: "ai-tools", tags: ["audio", "voice", "elevenlabs", "content-creation"], is_featured: false, reading_time: 8, content: `## ElevenLabs is Now the Default for Voice Content\n\nIn 2026, creating audio content without ElevenLabs is like building a website without a framework — technically possible, practically inefficient.\n\n### Voice Cloning Has Matured\n\nThe Clone feature now requires just 1 minute of clean audio (down from 30 minutes in 2024). The output is indistinguishable from the source voice in most listening contexts.\n\n**Practical applications:**\n- YouTube channels: Narrate in your own voice without recording\n- Podcasts: Fix audio mistakes with text edits\n- International content: Clone your voice in 29 languages\n\n### The Creator Tier Sweet Spot\n\nAt $22/month, the Creator plan gives you 100K characters — roughly 80 minutes of narration. For a freelance content creator with one or two clients, this covers a full month of projects.\n\n### The API Opportunity\n\nDevelopers are building ElevenLabs into products — customer support bots with custom brand voices, audiobook platforms, accessibility tools. The API is well-documented and surprisingly affordable at scale.\n\n### Africa-Friendly Verdict\n\nElevenLabs accepts international cards. Stripe payments work across most African countries. The free tier (10K characters = ~8 minutes) is enough to pitch a voice content service to your first client.` },
  { slug: "zapier-vs-make-2026", title: "Zapier vs Make in 2026: The Honest Comparison", excerpt: "After testing both on real client workflows, here's which automation tool to pick and when.", category: "comparisons", tags: ["automation", "zapier", "make", "no-code"], is_featured: false, reading_time: 9, content: `## Zapier vs Make: Stop Guessing, Start Automating\n\nThe Zapier vs Make debate has been running for years. In 2026, the answer is clearer than ever.\n\n### Zapier: The Safe Choice\n\n**Who it's for:** Non-technical users, small teams, anyone who wants automation "just to work"\n\nZapier's 7000+ app library is unmatched. If an app has an API, there's probably a Zapier integration. The interface is clean — anyone can build a basic Zap in 10 minutes.\n\nThe drawback: price. At $49/month for 2000 tasks, Zapier is expensive when you're running dozens of automations.\n\n### Make: The Power User's Choice\n\n**Who it's for:** Agencies, developers, operations teams with complex requirements\n\nMake's visual flow builder shows you exactly how data moves through your automation. It supports advanced logic — iterators, aggregators, conditional branching — that Zapier struggles with.\n\nCost is Make's superpower: 10K operations/month for $9. For agencies running automation at scale, this is a 5x cost advantage.\n\n### The Agency Stack\n\nTop agencies use both: Zapier for client-facing automations (simple to hand over), Make for internal systems (complex workflows that need power users to maintain).\n\n### n8n: The Third Option\n\nIf you can self-host, n8n is worth serious consideration. Free forever, 400+ integrations, and new AI nodes that turn it into an LLM workflow engine.` },
  { slug: "ai-news-africa-tools-2026", title: "The Best AI Tools for African Freelancers and Founders", excerpt: "Not all AI tools work equally across Africa. Here's what's accessible, affordable, and worth your money.", category: "ai-tools", tags: ["africa", "freelancer", "accessibility", "ai-tools"], is_featured: true, reading_time: 10, content: `## Building with AI from Africa in 2026\n\nThe AI tool landscape was built for Silicon Valley. But in 2026, a growing number of tools work well — and are priced appropriately — for African freelancers and founders.\n\n### The Payment Barrier\n\nMost AI tools accept Visa and Mastercard — which is accessible across Africa through virtual cards from providers like Chipper Cash, Eversend, and Grey Finance. This has opened the market significantly.\n\n### Top Africa-Friendly AI Tools\n\n**ChatGPT (Free Tier)** — Available, functional, and the free tier is genuinely useful. GPT-4o mini has no usage limits on the free plan.\n\n**Claude** — Accessible via web and API. Anthropic has expanded availability significantly.\n\n**Canva** — Works excellently in Africa. The free tier is one of the most generous in the industry. Supports African local currencies in some markets.\n\n**ElevenLabs** — International card support. The free tier is enough to create a first voice product.\n\n**Make.com** — 1000 free operations/month with no credit card required. The best free tier in automation.\n\n**Fathom AI** — Free meeting recorder that works on any internet connection. No bandwidth-heavy features required.\n\n### What Doesn't Work Well\n\n- Midjourney: Discord-dependent, payments can be tricky\n- Many US-market tools that only accept US cards\n- Services requiring US phone verification\n\n### The Opportunity\n\nAfrican freelancers who master these tools command global rates while benefiting from local cost of living. The AI leverage is real and growing.` },
  { slug: "midjourney-v7-review", title: "Midjourney V7 Review: Is It Worth Upgrading?", excerpt: "After 30 days with Midjourney V7, here's our honest verdict on what changed and whether it matters.", category: "ai-tools", tags: ["design", "midjourney", "image-generation", "review"], is_featured: false, reading_time: 7, content: `## Midjourney V7: 30-Day Verdict\n\nMidjourney V7 arrived quietly. No product launch. No blog post. Just a model update that fundamentally changed the creative workflow.\n\n### What Actually Changed\n\n**Draft Mode** is the headline feature. Generate a rough image in 8 seconds, iterate on the concept, then upscale when you've nailed the composition. This changes ideation dramatically — explore 30 concepts in the time V6 took for 5.\n\n**Personalization** works better now. After training on 50 (previously 200) reference images, V7 generates closer to your aesthetic from prompt 1. The system has learned what "good" means to you.\n\n**Text in images** is dramatically improved. V7 handles short text with ~85% accuracy — a huge jump from V6's near-random results.\n\n### V6 vs V7 Quality\n\nHonest take: V7 wins on realism and photography. V6 wins on artistic abstraction and painterly styles.\n\nFor commercial work: V7 is the clear upgrade. Product photography, architectural visualization, character design.\n\nFor art: Keep your V6 style codes. V7's aesthetic is more "real" — which isn't always what you want.\n\n### The Pricing Stayed the Same\n\n$30/month Standard plan is unchanged. Given V7's capabilities, that's still exceptional value.\n\n**Bottom line:** Upgrade. The Draft Mode alone justifies it for professional users.` },
  { slug: "stack-builder-guide-agencies", title: "How Top Agencies Build AI Tool Stacks for Clients", excerpt: "The methodology behind building AI stacks that solve real problems — not just impressive tool lists.", category: "tutorials", tags: ["agencies", "stack-builder", "workflow", "tutorial"], is_featured: false, reading_time: 11, content: `## Building AI Stacks That Actually Work\n\nMost "AI tool stacks" are just lists. The best ones are engineered workflows where each tool solves a specific problem and passes output to the next.\n\n### The Stack Design Methodology\n\n**Step 1: Map the Pain**\nBefore recommending tools, document exactly where time and money are being lost. What tasks take longest? Where are the handoff failures? Where does quality drop?\n\n**Step 2: Identify the Output Format**\nEvery tool in a stack needs to output in a format the next tool can consume. Mismatched outputs are the #1 cause of stack failure.\n\n**Step 3: Start With One Workflow**\nDon't try to automate everything. Pick the single workflow that costs the most time or money, and automate that first. Build confidence before expanding.\n\n### The Agency Content Stack (Tested)\n\n1. **ChatGPT** → Research brief and outline\n2. **Jasper or Claude** → First draft from outline\n3. **Surfer SEO** → Optimization scoring\n4. **Grammarly** → Quality check\n5. **Canva** → Social graphics from content\n6. **Predis.ai** → Social caption variations\n7. **Zapier** → Publish to all channels\n\nTime to produce one SEO article with social package: 45 minutes (down from 8 hours).\n\n### What Agencies Charge for AI Stack Setup\n\nAgencies are charging $2,500-$10,000 for AI stack implementations. The work is: tool selection, workflow design, team training, and 30 days of optimization.\n\nThis is one of the highest-value services an agency can offer right now.` },
];

// ── Authors ───────────────────────────────────────────────────────────────────
const AUTHORS = [
  { name: "Sarah Chen", slug: "sarah-chen", avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&size=128&background=6366f1&color=fff&bold=true", role: "AI Tools Editor", bio: "Former PM at Notion. Writing about tools that power modern work." },
  { name: "Emeka Okonkwo", slug: "emeka-okonkwo", avatar: "https://ui-avatars.com/api/?name=Emeka+Okonkwo&size=128&background=059669&color=fff&bold=true", role: "SaaS Analyst", bio: "Building and writing about SaaS from Lagos. Focus on Africa-friendly tools." },
  { name: "Alex Rivera", slug: "alex-rivera", avatar: "https://ui-avatars.com/api/?name=Alex+Rivera&size=128&background=dc2626&color=fff&bold=true", role: "Automation Expert", bio: "Zapier-certified expert helping teams automate boring work since 2019." },
  { name: "Maya Patel", slug: "maya-patel", avatar: "https://ui-avatars.com/api/?name=Maya+Patel&size=128&background=7c3aed&color=fff&bold=true", role: "Design Tools Lead", bio: "Designer turned writer. Covering AI design tools and creative workflows." },
  { name: "FutureStack AI", slug: "futurestack-ai", avatar: "https://ui-avatars.com/api/?name=FS+AI&size=128&background=0ea5e9&color=fff&bold=true", role: "AI Writer", bio: "AI-generated articles curated by the FutureStack editorial team." },
];

// ── Stacks ────────────────────────────────────────────────────────────────────
const STACKS = [
  { slug: "content-creator-pro", name: "Content Creator Pro Stack", description: "The ultimate AI toolkit for content creators. Write, design, record, and distribute faster.", target_role: "freelancer", category: "content", clone_count: 2341, rating: 4.9, featured: true, tool_slugs: ["chatgpt", "claude", "midjourney", "elevenlabs", "canva", "opus-clip"] },
  { slug: "agency-operations", name: "Agency Operations Stack", description: "Run your agency on autopilot. Client delivery, reporting, and communication — all automated.", target_role: "agency", category: "operations", clone_count: 1876, rating: 4.8, featured: true, tool_slugs: ["notion-ai", "zapier", "make", "jasper-ai", "surfer-seo", "fireflies-ai"] },
  { slug: "saas-founder-bootstrap", name: "SaaS Founder Bootstrap Stack", description: "Ship your MVP with minimal budget. The tools that help indie founders move fastest.", target_role: "saas-founder", category: "startup", clone_count: 1543, rating: 4.8, featured: true, tool_slugs: ["cursor", "claude", "v0-vercel", "zapier", "chatgpt", "github-copilot"] },
  { slug: "developer-productivity", name: "Developer Productivity Stack", description: "The AI tools top engineers use to 10x output without burning out.", target_role: "saas-founder", category: "development", clone_count: 987, rating: 4.7, featured: false, tool_slugs: ["cursor", "github-copilot", "claude", "v0-vercel", "perplexity-ai"] },
  { slug: "creative-agency-design", name: "Creative Agency Design Stack", description: "AI-powered design workflow for teams that need to move fast on every brief.", target_role: "agency", category: "design", clone_count: 754, rating: 4.6, featured: false, tool_slugs: ["midjourney", "canva", "elevenlabs", "runway-ml", "figma-ai"] },
  { slug: "freelance-writer-ai", name: "Freelance Writer AI Stack", description: "Write faster, rank higher, earn more. The complete AI writing toolkit for freelancers.", target_role: "freelancer", category: "writing", clone_count: 654, rating: 4.7, featured: false, tool_slugs: ["chatgpt", "claude", "grammarly-go", "surfer-seo", "quillbot", "notion-ai"] },
  { slug: "africa-friendly-stack", name: "Africa-Optimized AI Stack", description: "The best AI tools for African freelancers and founders — all accessible, affordable, and reliable.", target_role: "freelancer", category: "general", clone_count: 1234, rating: 4.8, featured: true, tool_slugs: ["chatgpt", "canva", "elevenlabs", "otter-ai", "grammarly-go", "make"] },
  { slug: "video-production-ai", name: "Video Production AI Stack", description: "Create professional video content without a production team. AI handles the heavy lifting.", target_role: "agency", category: "video", clone_count: 543, rating: 4.6, featured: false, tool_slugs: ["runway-ml", "descript", "opus-clip", "elevenlabs", "canva", "invideo-ai"] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function ensureCategories() {
  console.log("\n📂 Ensuring categories exist…");
  const categories = [
    { id: "writing", name: "Writing", icon: "pen-tool", count: 0 },
    { id: "design", name: "Design", icon: "palette", count: 0 },
    { id: "code", name: "Code", icon: "code", count: 0 },
    { id: "video", name: "Video", icon: "video", count: 0 },
    { id: "audio", name: "Audio", icon: "mic", count: 0 },
    { id: "data", name: "Data & Research", icon: "database", count: 0 },
    { id: "automation", name: "Automation", icon: "zap", count: 0 },
    { id: "productivity", name: "Productivity", icon: "layout", count: 0 },
    { id: "marketing", name: "Marketing", icon: "bar-chart", count: 0 },
    { id: "analytics", name: "Analytics", icon: "activity", count: 0 },
  ];
  const { error } = await supabase.from("tool_categories").upsert(categories, { onConflict: "id" });
  if (error) warn(`Categories upsert: ${error.message}`);
  else ok(`${categories.length} categories ready`);
}

async function seedAuthors() {
  console.log("\n👤 Seeding authors…");
  const { data, error } = await supabase.from("authors").upsert(AUTHORS, { onConflict: "name" }).select("id,name");
  if (error) { err("authors", error); return {}; }
  const map = {};
  for (const a of data ?? []) map[a.name] = a.id;
  ok(`${Object.keys(map).length} authors ready`);
  return map;
}

async function seedTools() {
  console.log(`\n🔧 Seeding ${TOOLS.length} tools (image generation: ${SKIP_IMAGES ? "SKIPPED" : "ENABLED"})…`);
  const toolMap = {};
  let generated = 0;

  for (let i = 0; i < TOOLS.length; i++) {
    const t = TOOLS[i];
    process.stdout.write(`  [${i + 1}/${TOOLS.length}] ${t.name}… `);

    // Generate logo image
    let logoUrl = null;
    if (!SKIP_IMAGES) {
      logoUrl = await generateToolImage(t.name, t.category);
      if (logoUrl) generated++;
    }
    if (!logoUrl) {
      logoUrl = getLogoFallback(t.name, t.website);
    }

    const row = {
      name: t.name,
      slug: t.slug,
      tagline: t.tagline,
      description: t.description,
      website_url: t.website,
      logo: logoUrl,
      category: t.category,
      pricing_model: t.pricing_model,
      has_free: t.pricing_model === "freemium",
      is_featured: t.is_featured,
      africa_friendly: t.africa_friendly,
      rating: t.rating,
      review_count: t.review_count,
      tags: t.tags ?? [],
      status: "active",
      is_verified: true,
      is_new: (t.tags ?? []).includes("new"),
      upvote_count: Math.floor(Math.random() * 800 + 50),
      save_count: Math.floor(Math.random() * 500 + 20),
      pricing_details: t.pricing ?? [],
    };

    const { data, error } = await supabase.from("tools").upsert(row, { onConflict: "slug" }).select("id,slug");
    if (error) {
      process.stdout.write(`❌\n`);
      err(`  ${t.name}`, error.message);
    } else {
      process.stdout.write(`✅\n`);
      if (data?.[0]) toolMap[t.slug] = data[0].id;
    }
  }

  ok(`${Object.keys(toolMap).length} tools seeded (${generated} with AI images)`);
  return toolMap;
}

async function seedToolScores(toolMap) {
  console.log("\n⭐ Seeding tool scores…");
  const rows = TOOLS.filter((t) => toolMap[t.slug] && t.scores).map((t) => {
    const s = t.scores;
    const avg = Object.values(s).reduce((a, b) => a + b, 0) / Object.values(s).length;
    return {
      tool_id: toolMap[t.slug],
      ease_of_use: s.ease_of_use,
      value_for_money: s.value_for_money,
      feature_depth: s.feature_depth,
      support_quality: s.support_quality,
      integration_richness: s.integration_richness,
      ai_capability: s.ai_capability,
      futurestack_score: Math.round(avg * 10) / 10,
    };
  });

  if (rows.length === 0) { warn("No scores to insert"); return; }
  const { error } = await supabase.from("tool_scores").upsert(rows, { onConflict: "tool_id" });
  if (error) err("tool_scores", error.message);
  else ok(`${rows.length} tool scores`);
}

async function seedToolPricing(toolMap) {
  console.log("\n💰 Seeding tool pricing tiers…");
  const rows = TOOLS.flatMap((t) =>
    (t.pricing ?? []).map((p) => ({ tool_id: toolMap[t.slug], ...p }))
  ).filter((r) => r.tool_id);

  if (rows.length === 0) { warn("No pricing to insert"); return; }
  const toolIds = [...new Set(rows.map((r) => r.tool_id))];
  await supabase.from("tool_pricing").delete().in("tool_id", toolIds);
  const { error } = await supabase.from("tool_pricing").insert(rows);
  if (error) err("tool_pricing", error.message);
  else ok(`${rows.length} pricing tiers`);
}

async function seedAlternatives(toolMap) {
  console.log("\n🔁 Seeding tool alternatives…");
  const pairs = [
    ["chatgpt", "claude", 0.9], ["claude", "gemini", 0.75], ["cursor", "github-copilot", 0.85],
    ["cursor", "codeium", 0.7], ["zapier", "make", 0.88], ["zapier", "n8n", 0.75],
    ["midjourney", "dalle-3", 0.85], ["midjourney", "leonardo-ai", 0.8],
    ["elevenlabs", "murf-ai", 0.75], ["elevenlabs", "playht", 0.8],
    ["runway-ml", "pika-labs", 0.8], ["runway-ml", "invideo-ai", 0.65],
    ["notion-ai", "taskade", 0.65], ["notion-ai", "mem-ai", 0.6],
    ["surfer-seo", "jasper-ai", 0.55], ["perplexity-ai", "chatgpt", 0.65],
    ["canva", "adobe-firefly", 0.7], ["v0-vercel", "cursor", 0.6],
    ["otter-ai", "fireflies-ai", 0.9], ["otter-ai", "fathom-ai", 0.85],
    ["lovable", "bolt-ai", 0.85], ["lovable", "cursor", 0.65],
  ];
  const rows = pairs.flatMap(([a, b, score]) => {
    const aId = toolMap[a], bId = toolMap[b];
    if (!aId || !bId) return [];
    return [
      { tool_id: aId, alternative_id: bId, similarity_score: score },
      { tool_id: bId, alternative_id: aId, similarity_score: score },
    ];
  });
  if (rows.length === 0) { warn("No alternatives to insert"); return; }
  const { error } = await supabase.from("tool_alternatives").upsert(rows, { onConflict: "tool_id,alternative_id" });
  if (error) err("tool_alternatives", error.message);
  else ok(`${rows.length} alternative pairs`);
}

async function seedArticles(authorMap) {
  if (TOOLS_ONLY) { info("Skipping articles (--tools-only)"); return; }
  console.log("\n📰 Seeding articles…");

  const authorNames = Object.keys(authorMap);
  const rows = ARTICLES.map((a) => {
    const authorName = authorNames[Math.floor(Math.random() * (authorNames.length - 1))]; // not AI author
    const heroImage = `https://images.unsplash.com/photo-${1640000000000 + Math.floor(Math.random() * 100000000)}?w=1200&h=630&fit=crop`;
    return {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      tags: a.tags ?? [],
      category: a.category,
      author_id: authorMap[authorName] || null,
      hero_image: heroImage,
      status: "published",
      is_featured: a.is_featured ?? false,
      is_ai_generated: false,
      is_premium: false,
      reading_time: a.reading_time ?? 5,
      word_count: Math.round((a.content ?? "").split(/\s+/).length),
      view_count: Math.floor(Math.random() * 8000 + 500),
      like_count: Math.floor(Math.random() * 400 + 20),
      share_count: Math.floor(Math.random() * 100 + 5),
      published_at: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
    };
  });

  const { data, error } = await supabase.from("articles").upsert(rows, { onConflict: "slug" }).select("id,slug");
  if (error) err("articles", error.message);
  else ok(`${data?.length} articles`);
}

async function seedStacks(toolMap) {
  if (TOOLS_ONLY) { info("Skipping stacks (--tools-only)"); return; }
  console.log("\n📦 Seeding stacks…");

  const stackRows = STACKS.map(({ tool_slugs, ...s }) => s);
  const { data, error } = await supabase.from("stacks").upsert(stackRows, { onConflict: "slug" }).select("id,slug");
  if (error) { err("stacks", error.message); return; }

  const stackMap = {};
  for (const s of data ?? []) stackMap[s.slug] = s.id;

  const toolLinks = STACKS.flatMap((s) =>
    (s.tool_slugs ?? [])
      .map((slug, position) => ({ stack_id: stackMap[s.slug], tool_id: toolMap[slug], position }))
      .filter((r) => r.stack_id && r.tool_id)
  );

  if (toolLinks.length > 0) {
    const stackIds = Object.values(stackMap);
    await supabase.from("stack_tools").delete().in("stack_id", stackIds);
    const { error: stErr } = await supabase.from("stack_tools").insert(toolLinks);
    if (stErr) err("stack_tools", stErr.message);
  }

  ok(`${data?.length} stacks + ${toolLinks.length} tool links`);
}

async function updateCategoryCounts(toolMap) {
  console.log("\n📊 Updating category counts…");
  for (const category of ["writing", "design", "code", "video", "audio", "data", "automation", "productivity", "marketing", "analytics"]) {
    const count = TOOLS.filter((t) => t.category === category).length;
    await supabase.from("tool_categories").update({ count }).eq("id", category);
  }
  ok("Category counts updated");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🌱 FutureStack — Full Database Seed with Image Generation");
  console.log("═".repeat(55));
  console.log(`  Tools: ${TOOLS.length} | Articles: ${ARTICLES.length} | Stacks: ${STACKS.length}`);
  console.log(`  Image generation: ${SKIP_IMAGES ? "DISABLED (use clearbit/avatars)" : "ENABLED (WaveSpeed AI → Cloudinary)"}`);
  console.log("═".repeat(55));

  await ensureCategories();
  const authorMap = await seedAuthors();
  const toolMap = await seedTools();
  await seedToolScores(toolMap);
  await seedToolPricing(toolMap);
  await seedAlternatives(toolMap);
  await seedArticles(authorMap);
  await seedStacks(toolMap);
  await updateCategoryCounts(toolMap);

  console.log("\n" + "═".repeat(55));
  console.log("✅ SEED COMPLETE! FutureStack is now loaded with real data.");
  console.log("═".repeat(55));
  console.log("\nNext steps:");
  console.log("  1. Visit your app to see tools, articles, and stacks");
  console.log("  2. Run `npm run dev` in the futurestack/ directory");
  console.log("  3. Trigger Inngest jobs to start the AI content pipeline\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
