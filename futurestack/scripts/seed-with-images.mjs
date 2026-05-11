/**
 * scripts/seed-with-images.mjs
 * Generates tool logos via WaveSpeed AI → Cloudinary,
 * then seeds Supabase with 100+ tools, 8 articles, 8 stacks.
 *
 * Usage (from futurestack/ directory):
 *   node scripts/seed-with-images.mjs            # full seed with AI images
 *   node scripts/seed-with-images.mjs --quick    # seed with logo fallbacks (fast)
 *   node scripts/seed-with-images.mjs --tools-only
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import crypto from "crypto";
import https from "https";
import http from "http";
import { URL } from "url";

const args = process.argv.slice(2);
const SKIP_IMAGES = args.includes("--skip-images") || args.includes("--quick");
const TOOLS_ONLY  = args.includes("--tools-only");

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

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WAVESPEED_API_KEY    = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD     = process.env.CLOUDINARY_CLOUD_NAME || "dxizihlmo";
const CLOUDINARY_KEY       = process.env.CLOUDINARY_API_KEY   || "654919554582831";
const CLOUDINARY_SECRET    = process.env.CLOUDINARY_API_SECRET || "j4GLSAjjApKUgInR41eCUiQIqUo";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ok   = (m)    => console.log(`  ✅ ${m}`);
const warn = (m)    => console.log(`  ⚠️  ${m}`);
const fail = (m, e) => console.error(`  ❌ ${m}`, e?.message ?? e ?? "");
const info = (m)    => console.log(`  ℹ️  ${m}`);

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, { method: options.method || "GET", headers: options.headers || {} }, (res) => {
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

// ── WaveSpeed AI ──────────────────────────────────────────────────────────────
async function generateImage(toolName, category) {
  if (SKIP_IMAGES || !WAVESPEED_API_KEY) return null;
  try {
    const prompt = `Minimalist professional SaaS app icon for "${toolName}", ${category} software. Flat vector design, bold geometric shapes, clean lines, white background, single strong color accent, no text, no letters. Modern tech brand mark, app store icon style.`;
    const res = await httpRequest("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-schnell", {
      method: "POST",
      headers: { "Authorization": `Bearer ${WAVESPEED_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width: 512, height: 512, num_inference_steps: 4, guidance_scale: 3.5, num_images: 1 }),
    });
    if (res.status !== 200) { warn(`WaveSpeed ${res.status} for ${toolName}`); return null; }
    const imgUrl = res.body?.data?.outputs?.[0] || res.body?.outputs?.[0] || res.body?.images?.[0]?.url;
    if (!imgUrl) { warn(`No image URL for ${toolName}`); return null; }
    return await uploadToCloudinary(imgUrl, toolName);
  } catch (e) {
    warn(`Image gen failed for ${toolName}: ${e.message}`);
    return null;
  }
}

async function uploadToCloudinary(imageUrl, toolName) {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const pid = `futurestack/tools/${toolName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50)}`;
    const sig = crypto.createHash("sha1").update(`file=${imageUrl}&public_id=${pid}&timestamp=${ts}${CLOUDINARY_SECRET}`).digest("hex");
    const body = new URLSearchParams({ file: imageUrl, public_id: pid, timestamp: String(ts), api_key: CLOUDINARY_KEY, signature: sig }).toString();
    const res = await httpRequest(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
    });
    return res.status === 200 ? res.body?.secure_url || null : null;
  } catch { return null; }
}

function logoFallback(name, website) {
  if (website) {
    try {
      const domain = new URL(website).hostname.replace("www.", "");
      return `https://logo.clearbit.com/${domain}`;
    } catch {}
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0, 2))}&size=128&background=6366f1&color=fff&bold=true&format=png`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const TOOLS = [
  // WRITING
  { name:"ChatGPT", slug:"chatgpt", category:"writing", tagline:"The world's leading AI assistant by OpenAI", description:"ChatGPT powers conversations, writing, coding, and analysis. With GPT-4o, handles text, images, files and voice — the most versatile AI assistant available.", website:"https://chat.openai.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:8542, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:9.5,support_quality:8.0,integration_richness:9.0,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["GPT-4o mini","50 msgs/day on GPT-4o","Basic tools"]},{tier_name:"Plus",price_monthly:20,is_popular:true,features:["GPT-4o unlimited","DALL-E 3","Advanced analysis"]},{tier_name:"Team",price_monthly:25,features:["Everything Plus","Admin console","SSO"]}] },
  { name:"Claude", slug:"claude", category:"writing", tagline:"Thoughtful AI for complex analysis and long writing", description:"Claude by Anthropic excels at nuanced long-form writing, code review, and complex reasoning. Its 200K context window handles entire codebases and documents.", website:"https://claude.ai", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:3812, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:9.0,support_quality:7.5,integration_richness:7.5,ai_capability:9.2}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Claude 3.5 Haiku","Limited usage"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["5x usage","Claude Sonnet & Opus","Priority access"]}] },
  { name:"Gemini", slug:"gemini", category:"writing", tagline:"Google's multimodal AI assistant", description:"Gemini Ultra from Google DeepMind handles text, images, audio, video, and code. Deeply integrated with Google Workspace for document generation and research.", website:"https://gemini.google.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:8.5,support_quality:7.5,integration_richness:9.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Gemini 1.5 Flash","Google Workspace integration"]},{tier_name:"Advanced",price_monthly:19.99,is_popular:true,features:["Gemini Ultra","1TB storage","Priority access"]}] },
  { name:"Jasper AI", slug:"jasper-ai", category:"writing", tagline:"AI writing platform built for marketing teams", description:"Jasper is trained on marketing copy and brand voice. Generates high-converting ad copy, blog posts, social media content, and email campaigns at scale.", website:"https://jasper.ai", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.4, review_count:1892, tags:["pro","trending"], scores:{ease_of_use:8.0,value_for_money:7.0,feature_depth:8.0,support_quality:8.5,integration_richness:7.5,ai_capability:7.5}, pricing:[{tier_name:"Creator",price_monthly:49,is_popular:true,features:["1 seat","Brand voice","50 knowledge assets"]},{tier_name:"Pro",price_monthly:69,features:["3 seats","Campaigns","SEO mode"]}] },
  { name:"Copy.ai", slug:"copy-ai", category:"writing", tagline:"AI copywriter for marketing and sales", description:"Copy.ai generates sales emails, ad copy, product descriptions, and social content. GTM workflows automate entire marketing pipelines.", website:"https://copy.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:1243, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["2000 words/month","90+ copywriting tools"]},{tier_name:"Pro",price_monthly:36,is_popular:true,features:["Unlimited words","GTM Workflows","API access"]}] },
  { name:"Writesonic", slug:"writesonic", category:"writing", tagline:"AI writer with real-time web access", description:"Writesonic creates SEO-optimized articles with real-time Google data. Chatsonic provides conversational AI with internet access, image generation, and voice input.", website:"https://writesonic.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:987, tags:["free","pro"], scores:{ease_of_use:8.0,value_for_money:8.0,feature_depth:8.0,support_quality:7.5,integration_richness:7.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10,000 words/month"]},{tier_name:"Individual",price_monthly:16,is_popular:true,features:["Unlimited words","SEO checker","Chatsonic"]}] },
  { name:"QuillBot", slug:"quillbot", category:"writing", tagline:"AI paraphraser and writing assistant", description:"QuillBot paraphrases content in multiple modes: fluency, formal, academic, creative. Used by students, academics, and professional writers worldwide.", website:"https://quillbot.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:3201, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:7.0,support_quality:7.0,integration_richness:7.5,ai_capability:7.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["125 words/paraphrase","2 modes"]},{tier_name:"Premium",price_monthly:9.95,is_popular:true,features:["Unlimited words","All modes","Grammar checker"]}] },
  { name:"Grammarly", slug:"grammarly-go", category:"writing", tagline:"AI writing help embedded everywhere you write", description:"Grammarly provides real-time grammar, tone, clarity suggestions plus generative AI drafting. Works across 500,000+ apps via browser extension.", website:"https://grammarly.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:7821, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:9.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Grammar checks","100 AI prompts/month"]},{tier_name:"Premium",price_monthly:12,is_popular:true,features:["Advanced suggestions","1000 AI prompts","Plagiarism checker"]}] },

  // CODE
  { name:"GitHub Copilot", slug:"github-copilot", category:"code", tagline:"AI pair programmer integrated into your IDE", description:"GitHub Copilot suggests code and complete functions in real-time. Powered by OpenAI Codex, it understands context from your codebase and comments.", website:"https://github.com/features/copilot", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:8920, tags:["free","pro","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:8.0,integration_richness:9.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["2000 completions/month","50 chat messages"]},{tier_name:"Pro",price_monthly:10,is_popular:true,features:["Unlimited completions","All models","CLI access"]},{tier_name:"Business",price_monthly:19,features:["Privacy mode","Admin panel","Audit logs"]}] },
  { name:"Cursor", slug:"cursor", category:"code", tagline:"AI-first code editor built on VS Code", description:"Cursor is a fork of VS Code that deeply integrates Claude and GPT-4 for chat, edit, and code generation. It understands your entire codebase context.", website:"https://cursor.sh", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:3241, tags:["free","pro","trending","new"], scores:{ease_of_use:8.5,value_for_money:9.0,feature_depth:9.0,support_quality:7.5,integration_richness:8.0,ai_capability:9.0}, pricing:[{tier_name:"Hobby",price_monthly:0,is_free_tier:true,features:["2000 completions","50 slow requests"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["Unlimited completions","500 fast requests","All models"]},{tier_name:"Business",price_monthly:40,features:["Privacy mode","Admin panel","SSO"]}] },
  { name:"Codeium", slug:"codeium", category:"code", tagline:"Free AI coding assistant for all IDEs", description:"Codeium provides free AI code completion, chat, and search across 70+ languages. Works in VS Code, JetBrains, Vim, and 40+ IDEs with no usage limits.", website:"https://codeium.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1823, tags:["free","africa-friendly","new"], scores:{ease_of_use:9.0,value_for_money:9.5,feature_depth:7.5,support_quality:7.0,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Individual",price_monthly:0,is_free_tier:true,features:["Unlimited completions","Chat","70+ languages","40+ IDEs"]},{tier_name:"Teams",price_monthly:12,is_popular:true,features:["Everything free","Team management","Advanced features"]}] },
  { name:"v0 by Vercel", slug:"v0-vercel", category:"code", tagline:"AI UI generator that outputs production React code", description:"v0 generates production-ready React components from text prompts or screenshots. Outputs clean Tailwind CSS and shadcn/ui components you can deploy in one click.", website:"https://v0.dev", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:1567, tags:["free","pro","new","trending"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:8.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["200 credits/month","Public generations"]},{tier_name:"Premium",price_monthly:20,is_popular:true,features:["5000 credits/month","Private generations","Priority"]}] },
  { name:"Tabnine", slug:"tabnine", category:"code", tagline:"Private AI code assistant for enterprise teams", description:"Tabnine runs locally and never sends your code to the cloud. Team-trained AI models, enterprise SSO, and compliance for regulated industries.", website:"https://tabnine.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.3, review_count:2134, tags:["free","pro"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Basic completions","Local model"]},{tier_name:"Pro",price_monthly:12,is_popular:true,features:["Full completions","Chat","All IDEs"]}] },
  { name:"Phind", slug:"phind", category:"code", tagline:"AI search engine built for developers", description:"Phind combines web search with LLMs to give developers accurate, cited answers to coding questions. Automatically searches Stack Overflow, docs, and GitHub.", website:"https://phind.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:7.0,support_quality:6.5,integration_richness:6.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited searches","GPT-4 access"]},{tier_name:"Pro",price_monthly:17,is_popular:true,features:["Claude Opus","GPT-4o","Priority speed"]}] },
  { name:"Lovable", slug:"lovable", category:"code", tagline:"Build full-stack apps with AI — no code required", description:"Lovable turns natural language into complete full-stack React applications backed by Supabase. Deploy in one click with GitHub sync and custom domains.", website:"https://lovable.dev", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","pro","africa-friendly","new","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:8.0,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["5 messages/day","Basic apps"]},{tier_name:"Starter",price_monthly:20,is_popular:true,features:["100 messages/month","Custom domain","GitHub sync"]}] },
  { name:"Bolt AI", slug:"bolt-ai", category:"code", tagline:"Full-stack AI app builder in the browser", description:"Bolt.new by StackBlitz builds and runs complete full-stack applications in the browser using AI. Integrates with npm packages and deploys to production instantly.", website:"https://bolt.new", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2134, tags:["free","pro","africa-friendly","new","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["150K tokens/day","Basic projects"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["10M tokens/month","Private projects","Export to GitHub"]}] },
  { name:"Replit AI", slug:"replit-ai", category:"code", tagline:"AI coding in the browser — build and deploy instantly", description:"Replit's AI agent builds complete web apps from a description in minutes. Writes, runs, debugs, and deploys code in a browser IDE with one-click deployment.", website:"https://replit.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:4231, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Basic IDE","Community support"]},{tier_name:"Core",price_monthly:25,is_popular:true,features:["AI agent","Private repls","Deployments"]}] },

  // VIDEO
  { name:"Runway ML", slug:"runway-ml", category:"video", tagline:"AI video generation and creative editing platform", description:"Runway leads AI video generation with Gen-3, motion brush, and inpainting tools. Used by Hollywood studios for next-gen video production workflows.", website:"https://runwayml.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:2341, tags:["free","pro","trending"], scores:{ease_of_use:7.5,value_for_money:7.0,feature_depth:9.5,support_quality:7.0,integration_richness:6.5,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["125 one-time credits"]},{tier_name:"Standard",price_monthly:15,features:["625 credits/month"]},{tier_name:"Pro",price_monthly:35,is_popular:true,features:["2250 credits/month","4K export"]}] },
  { name:"Pika Labs", slug:"pika-labs", category:"video", tagline:"Create and edit videos with AI from text or images", description:"Pika turns text and images into high-quality short videos. With Pika 2.0, animate photos, add sound effects, and generate cinematic scenes in seconds.", website:"https://pika.art", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1234, tags:["free","pro","new","trending"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:8.0,support_quality:7.0,integration_richness:5.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250 credits/month","720p export"]},{tier_name:"Standard",price_monthly:8,is_popular:true,features:["700 credits/month","1080p","No watermark"]}] },
  { name:"Synthesia", slug:"synthesia", category:"video", tagline:"Create AI avatar videos without cameras or actors", description:"Synthesia generates professional videos with realistic AI avatars from a script. Used by 50,000+ companies for training videos, product demos, and marketing content.", website:"https://synthesia.io", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.6, review_count:1876, tags:["pro","editor-pick"], scores:{ease_of_use:9.0,value_for_money:7.0,feature_depth:8.5,support_quality:8.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Starter",price_monthly:22,is_popular:true,features:["3 videos/month","70 avatars","125 languages"]},{tier_name:"Creator",price_monthly:67,features:["10 videos/month","Custom avatars","Screen recorder"]}] },
  { name:"Descript", slug:"descript", category:"video", tagline:"Video and podcast editing as easy as editing text", description:"Descript edits video and audio by editing a transcript — delete words in the text and they disappear from the video. Includes AI overdub for voice cloning.", website:"https://descript.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:8.0,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 hour transcription/month","Watermarked export"]},{tier_name:"Creator",price_monthly:24,is_popular:true,features:["10 hours transcription","1080p export","Overdub"]}] },
  { name:"Opus Clip", slug:"opus-clip", category:"video", tagline:"AI video repurposing — turn long videos into viral clips", description:"Opus Clip analyzes long-form videos and automatically extracts the best short clips for TikTok, Reels, and YouTube Shorts. Adds captions, B-roll, and hook scoring.", website:"https://opus.pro", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1123, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:7.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["60 mins upload/month","Basic clips"]},{tier_name:"Starter",price_monthly:15,is_popular:true,features:["3 hours upload/month","Captions","B-roll"]}] },
  { name:"InVideo AI", slug:"invideo-ai", category:"video", tagline:"Turn ideas and scripts into professional videos", description:"InVideo AI generates complete videos from text prompts. Just describe your topic, audience, and tone — get a fully-produced video with voiceover and stock footage.", website:"https://invideo.io", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:2341, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:6.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 videos/week","Watermarked","10GB storage"]},{tier_name:"Business",price_monthly:30,is_popular:true,features:["60 videos/month","No watermark","80 iStock clips/month"]}] },
  { name:"HeyGen", slug:"heygen", category:"video", tagline:"AI video generator with custom avatars and voices", description:"HeyGen creates talking avatar videos with your likeness and voice clone. Generate multilingual videos from text with photorealistic digital twins.", website:"https://heygen.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.5, review_count:987, tags:["free","pro","new"], scores:{ease_of_use:8.5,value_for_money:7.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.0,ai_capability:9.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 credit/month","3 min video limit"]},{tier_name:"Creator",price_monthly:29,is_popular:true,features:["15 credits/month","Custom avatar","Voice clone"]}] },

  // DESIGN / IMAGE
  { name:"Midjourney", slug:"midjourney", category:"design", tagline:"AI image generation with top artistic quality", description:"Midjourney creates stunning photorealistic and artistic images from text prompts. The gold standard for AI image generation, used by top creative studios worldwide.", website:"https://midjourney.com", pricing_model:"paid", is_featured:true, africa_friendly:false, rating:4.9, review_count:5423, tags:["pro","trending","editor-pick"], scores:{ease_of_use:7.0,value_for_money:8.0,feature_depth:9.0,support_quality:6.5,integration_richness:5.0,ai_capability:9.8}, pricing:[{tier_name:"Basic",price_monthly:10,features:["200 images/month"]},{tier_name:"Standard",price_monthly:30,is_popular:true,features:["15h fast GPU","Unlimited relaxed"]},{tier_name:"Pro",price_monthly:60,features:["30h fast GPU","Stealth mode"]}] },
  { name:"Canva AI", slug:"canva", category:"design", tagline:"AI-enhanced design platform for everyone", description:"Canva makes professional design accessible with 250K+ templates, Magic Write AI, background remover, and Brand Kit. The world's most popular design tool.", website:"https://canva.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.8, review_count:9821, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.5,value_for_money:9.0,feature_depth:7.5,support_quality:8.0,integration_richness:8.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250K templates","5GB storage","Basic AI"]},{tier_name:"Pro",price_monthly:12.99,is_popular:true,features:["All templates","Brand Kit","1TB storage"]}] },
  { name:"Leonardo AI", slug:"leonardo-ai", category:"design", tagline:"AI image generation for game assets and creative work", description:"Leonardo AI specializes in consistent character design, game assets, and concept art. Fine-tuned models maintain visual consistency across a project.", website:"https://leonardo.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2123, tags:["free","pro","africa-friendly","new"], scores:{ease_of_use:8.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["150 tokens/day","Unlimited relaxed"]},{tier_name:"Apprentice",price_monthly:12,is_popular:true,features:["8500 tokens/month","Priority speed","Private generations"]}] },
  { name:"Adobe Firefly", slug:"adobe-firefly", category:"design", tagline:"Adobe's commercial-safe generative AI for creatives", description:"Adobe Firefly generates images, vectors, and text effects that are 100% commercially safe. Deeply integrated into Photoshop, Illustrator, and Express.", website:"https://firefly.adobe.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.4, review_count:1654, tags:["free","pro"], scores:{ease_of_use:8.5,value_for_money:7.5,feature_depth:8.0,support_quality:8.5,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["25 generative credits/month"]},{tier_name:"Premium",price_monthly:4.99,is_popular:true,features:["100 credits/month","Commercial license"]}] },
  { name:"Figma AI", slug:"figma-ai", category:"design", tagline:"AI design features built into the industry standard", description:"Figma's AI features include auto-layout suggestions, text rewrite, design-to-code, First Draft wireframe generation, and AI-powered search across your design system.", website:"https://figma.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.7, review_count:8921, tags:["free","pro","editor-pick"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:9.5,support_quality:8.5,integration_richness:9.5,ai_capability:8.0}, pricing:[{tier_name:"Starter",price_monthly:0,is_free_tier:true,features:["3 Figma files","Unlimited viewers","AI features"]},{tier_name:"Professional",price_monthly:12,is_popular:true,features:["Unlimited files","Team library","Dev mode"]}] },
  { name:"Ideogram", slug:"ideogram", category:"design", tagline:"AI image generator that actually gets text right", description:"Ideogram specializes in generating images with accurate text rendering — a major weakness in other AI image tools. Perfect for logos, posters, and typographic designs.", website:"https://ideogram.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:876, tags:["free","pro","new","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:7.5,support_quality:7.0,integration_richness:5.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 images/day","Public gallery"]},{tier_name:"Basic",price_monthly:7,is_popular:true,features:["400 images/month","Private mode"]}] },
  { name:"Framer AI", slug:"framer-ai", category:"design", tagline:"AI website builder that generates from a prompt", description:"Framer builds an entire website from a single text prompt. Edit the result visually with a Figma-like interface and publish in one click with CDN hosting.", website:"https://framer.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1876, tags:["free","pro","africa-friendly","new"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 project","Framer subdomain","AI generation"]},{tier_name:"Mini",price_monthly:5,is_popular:true,features:["Custom domain","1000 visitors/month"]}] },

  // AUDIO
  { name:"ElevenLabs", slug:"elevenlabs", category:"audio", tagline:"Ultra-realistic AI voice generation and cloning", description:"ElevenLabs generates the most realistic AI voices available. Clone any voice in 30 seconds, create multilingual content, and build voice applications via API.", website:"https://elevenlabs.io", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:4231, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:9.0,support_quality:7.5,integration_richness:8.0,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10K chars/month","3 custom voices"]},{tier_name:"Starter",price_monthly:5,features:["30K chars/month","10 voices"]},{tier_name:"Creator",price_monthly:22,is_popular:true,features:["100K chars/month","30 voices","Commercial license"]}] },
  { name:"PlayHT", slug:"playht", category:"audio", tagline:"AI voice generator with ultra-realistic speech", description:"PlayHT creates natural-sounding voiceovers in 800+ voices across 100+ languages. Features instant voice cloning, emotion control, and SSML support.", website:"https://play.ht", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1234, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.0,value_for_money:8.0,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["12,500 chars/month","3 cloned voices"]},{tier_name:"Creator",price_monthly:31.2,is_popular:true,features:["100K chars/month","Instant voice cloning","API access"]}] },
  { name:"Murf AI", slug:"murf-ai", category:"audio", tagline:"Studio-quality AI voiceovers for business", description:"Murf AI generates professional voiceovers for videos, presentations, and e-learning. Features 120+ AI voices, pitch control, emphasis, and video sync.", website:"https://murf.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:7.5,feature_depth:8.0,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 min voice generation","No download"]},{tier_name:"Creator",price_monthly:29,is_popular:true,features:["48 voices","12 hours/year","Commercial rights"]}] },
  { name:"Suno AI", slug:"suno-ai", category:"audio", tagline:"Generate full songs with AI — lyrics, melody, vocals", description:"Suno AI creates complete songs from text descriptions — including lyrics, instrumentation, and vocals in any genre. From pop to jazz to heavy metal in seconds.", website:"https://suno.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:3241, tags:["free","pro","africa-friendly","trending","new"], scores:{ease_of_use:9.5,value_for_money:9.0,feature_depth:8.0,support_quality:7.0,integration_richness:5.5,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["50 credits/day","Non-commercial use"]},{tier_name:"Pro",price_monthly:8,is_popular:true,features:["2500 credits/month","Commercial rights","Priority generation"]}] },
  { name:"Speechify", slug:"speechify", category:"audio", tagline:"AI text-to-speech for faster reading and learning", description:"Speechify converts any text — articles, PDFs, books, emails — into natural-sounding audio. Used by 20M+ people to consume content faster.", website:"https://speechify.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3214, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:7.5,integration_richness:8.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Standard voices","1x-2.5x speed"]},{tier_name:"Premium",price_monthly:11.58,is_popular:true,features:["HD AI voices","Up to 4.5x speed","Offline mode"]}] },

  // AUTOMATION
  { name:"Zapier", slug:"zapier", category:"automation", tagline:"No-code automation connecting 7000+ apps", description:"Zapier connects your apps and automates workflows without code. Build multi-step automations across 7000+ apps with an AI-powered workflow builder.", website:"https://zapier.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.6, review_count:8921, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.0,value_for_money:7.0,feature_depth:8.5,support_quality:8.5,integration_richness:10.0,ai_capability:7.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["100 tasks/month","5 Zaps"]},{tier_name:"Starter",price_monthly:19.99,is_popular:true,features:["750 tasks/month","20 Zaps","Multi-step"]},{tier_name:"Professional",price_monthly:49,features:["2000 tasks","Unlimited Zaps"]}] },
  { name:"Make", slug:"make", category:"automation", tagline:"Visual workflow automation with 1500+ connectors", description:"Make (formerly Integromat) offers a visual drag-and-drop workflow builder with complex logic, data transformation, and 1500+ integrations at half the cost of Zapier.", website:"https://make.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3421, tags:["free","pro","no-code","africa-friendly"], scores:{ease_of_use:7.5,value_for_money:9.0,feature_depth:9.0,support_quality:7.0,integration_richness:9.0,ai_capability:6.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1000 ops/month","2 active scenarios"]},{tier_name:"Core",price_monthly:9,is_popular:true,features:["10K ops/month","Unlimited scenarios"]}] },
  { name:"n8n", slug:"n8n", category:"automation", tagline:"Open-source workflow automation with AI nodes", description:"n8n is a self-hostable workflow automation tool with 400+ integrations. Its AI nodes let you build LangChain pipelines, RAG workflows, and AI agents visually.", website:"https://n8n.io", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:7.0,value_for_money:9.5,feature_depth:9.5,support_quality:8.0,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Community",price_monthly:0,is_free_tier:true,features:["Self-hosted","Unlimited workflows","400+ integrations"]},{tier_name:"Starter",price_monthly:24,is_popular:true,features:["Cloud hosted","2500 executions/month","20 active workflows"]}] },
  { name:"Bardeen AI", slug:"bardeen-ai", category:"automation", tagline:"AI automation for browsers — no API needed", description:"Bardeen automates repetitive browser tasks using AI. Scrape data, automate workflows, and connect apps — all without leaving your browser or writing code.", website:"https://bardeen.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:876, tags:["free","pro","no-code","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:8.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited manual runs","Basic automations"]},{tier_name:"Professional",price_monthly:20,is_popular:true,features:["Unlimited scheduled runs","Premium integrations"]}] },

  // PRODUCTIVITY
  { name:"Notion AI", slug:"notion-ai", category:"productivity", tagline:"AI assistant built inside your Notion workspace", description:"Notion AI lets you write, summarize, translate, and brainstorm directly in your workspace — no context-switching required. Works across all Notion plans.", website:"https://notion.so/ai", pricing_model:"paid", is_featured:false, africa_friendly:true, rating:4.5, review_count:2876, tags:["pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"AI Add-on",price_monthly:10,is_popular:true,features:["Unlimited AI","Q&A across all pages","Auto-fill databases"]}] },
  { name:"Otter AI", slug:"otter-ai", category:"productivity", tagline:"AI meeting notes and transcription", description:"Otter AI automatically transcribes meetings in real-time, identifies speakers, extracts action items, and syncs with Zoom, Google Meet, and Microsoft Teams.", website:"https://otter.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:2876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["600 min transcription/month","3 AI summaries/month"]},{tier_name:"Pro",price_monthly:16.99,is_popular:true,features:["1200 min/month","Custom vocabulary","Exports"]}] },
  { name:"Fathom AI", slug:"fathom-ai", category:"productivity", tagline:"Free AI meeting recorder and note-taker", description:"Fathom records Zoom calls, highlights key moments, and generates AI summaries automatically. The generous free plan makes it the default choice for remote teams.", website:"https://fathom.video", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.7, review_count:2341, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.5,value_for_money:9.5,feature_depth:7.5,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited recordings","AI summaries","Zoom only"]},{tier_name:"Premium",price_monthly:19,is_popular:true,features:["Google Meet","Teams","CRM sync","Playlists"]}] },
  { name:"Motion", slug:"motion", category:"productivity", tagline:"AI calendar and project manager that schedules your day", description:"Motion uses AI to automatically schedule your tasks, meetings, and projects based on priorities and deadlines. It rearranges your calendar when things change.", website:"https://usemotion.com", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.5, review_count:1234, tags:["pro","trending"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Individual",price_monthly:19,is_popular:true,features:["Auto-scheduling","Task management","Calendar sync"]},{tier_name:"Team",price_monthly:12,features:["Per seat","Team scheduling","Project management"]}] },
  { name:"Gamma App", slug:"gamma-app", category:"productivity", tagline:"AI presentation and document creator", description:"Gamma generates beautiful presentations, documents, and websites from a text prompt in 30 seconds. No design skills needed — AI handles layout, visuals, and structure.", website:"https://gamma.app", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2876, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["400 AI credits","Unlimited viewers"]},{tier_name:"Plus",price_monthly:10,is_popular:true,features:["Unlimited AI","Custom branding","Analytics"]}] },
  { name:"Loom AI", slug:"loom-ai", category:"productivity", tagline:"AI-powered async video communication", description:"Loom records quick screen and camera videos with AI-generated titles, summaries, chapters, and action items. Replace emails and meetings with async video.", website:"https://loom.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:4321, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Starter",price_monthly:0,is_free_tier:true,features:["25 videos","5 min limit","AI features"]},{tier_name:"Business",price_monthly:12.5,is_popular:true,features:["Unlimited videos","No time limit","Analytics"]}] },
  { name:"Fireflies AI", slug:"fireflies-ai", category:"productivity", tagline:"AI notetaker for meetings with search and analysis", description:"Fireflies records, transcribes, and analyzes your meetings. Creates searchable meeting databases, sentiment analysis, and integrates with 40+ CRMs and tools.", website:"https://fireflies.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1543, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["800 min storage","AI summaries","3 seats"]},{tier_name:"Pro",price_monthly:18,is_popular:true,features:["Unlimited storage","Analytics","CRM sync"]}] },
  { name:"Linear AI", slug:"linear-ai", category:"productivity", tagline:"AI-powered project management for software teams", description:"Linear is the issue tracker used by the best engineering teams. AI automatically writes issue descriptions, suggests labels, and breaks epics into actionable tasks.", website:"https://linear.app", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.7, review_count:2134, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:9.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250 issues","Cycles","AI features"]},{tier_name:"Standard",price_monthly:8,is_popular:true,features:["Unlimited issues","Roadmaps","Analytics"]}] },

  // DATA & RESEARCH
  { name:"Perplexity AI", slug:"perplexity-ai", category:"data", tagline:"AI answer engine with real-time web search", description:"Perplexity combines LLMs with real-time web search, giving cited answers to complex questions. The best AI for research, fact-checking, and market analysis.", website:"https://perplexity.ai", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.6, review_count:3241, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:7.5,support_quality:7.0,integration_richness:6.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited basic searches","5 Pro searches/day"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["Unlimited Pro searches","File uploads","API access"]}] },
  { name:"NotebookLM", slug:"notebooklm", category:"data", tagline:"Google's AI notebook that reasons over your documents", description:"NotebookLM by Google lets you upload documents, PDFs, and notes, then chat with an AI that cites its sources from your material. Perfect for research and study.", website:"https://notebooklm.google.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","africa-friendly","new","trending"], scores:{ease_of_use:9.0,value_for_money:10.0,feature_depth:7.5,support_quality:7.5,integration_richness:6.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["50 notebooks","20 sources each","Audio overviews"]}] },
  { name:"Elicit", slug:"elicit", category:"data", tagline:"AI research assistant for academic papers", description:"Elicit searches and synthesizes 200M+ academic papers. Extract key findings, methodology, and limitations across papers without reading each one individually.", website:"https://elicit.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:5.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["5000 papers/month","Basic synthesis"]},{tier_name:"Plus",price_monthly:10,is_popular:true,features:["12,000 papers/month","Full synthesis","Export"]}] },

  // MARKETING
  { name:"Surfer SEO", slug:"surfer-seo", category:"marketing", tagline:"AI content optimization for higher Google rankings", description:"Surfer SEO analyzes the top-ranking pages for any keyword and tells you exactly how to write content that ranks. Includes an AI writer with real-time SEO scoring.", website:"https://surferseo.com", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.5, review_count:2134, tags:["pro","editor-pick"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:8.5,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Essential",price_monthly:89,features:["30 articles/month","Content editor"]},{tier_name:"Scale",price_monthly:129,is_popular:true,features:["100 articles/month","AI writer included"]}] },
  { name:"Predis.ai", slug:"predis-ai", category:"marketing", tagline:"AI social media content creator with 80+ formats", description:"Predis.ai generates complete social media posts including design, captions, and hashtags. Supports 80+ content formats across Instagram, LinkedIn, TikTok, and Twitter.", website:"https://predis.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["15 posts/month","3 social accounts"]},{tier_name:"Solo",price_monthly:27,is_popular:true,features:["60 posts/month","Competitor analysis","Analytics"]}] },
  { name:"Typeform AI", slug:"typeform-ai", category:"marketing", tagline:"Conversational forms and surveys with AI", description:"Typeform creates beautiful, conversational forms that feel like chatting. AI generates questions from a prompt and analyzes responses with sentiment and summary.", website:"https://typeform.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3214, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 questions/form","100 responses/month"]},{tier_name:"Basic",price_monthly:25,is_popular:true,features:["Unlimited questions","1000 responses/month","Remove branding"]}] },
  { name:"Brand24", slug:"brand24", category:"marketing", tagline:"AI media monitoring and sentiment analysis", description:"Brand24 monitors mentions of your brand across 25 million websites, social media, news, and review sites. AI analyzes sentiment and identifies influencers.", website:"https://brand24.com", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.3, review_count:1234, tags:["pro"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:8.5,support_quality:8.0,integration_richness:7.5,ai_capability:7.5}, pricing:[{tier_name:"Individual",price_monthly:119,features:["3 keywords","Sentiment analysis"]},{tier_name:"Team",price_monthly:179,is_popular:true,features:["7 keywords","Reports","Slack alerts"]}] },

  // ANALYTICS
  { name:"PostHog", slug:"posthog", category:"analytics", tagline:"Open-source product analytics with session replay", description:"PostHog combines product analytics, session recording, feature flags, and A/B testing in one platform. Self-hostable and GDPR-compliant with a generous free tier.", website:"https://posthog.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.0,value_for_money:9.5,feature_depth:9.0,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1M events/month","Session replay","Feature flags"]},{tier_name:"Teams",price_monthly:0,is_popular:true,features:["Pay as you go","$0.00031/event after 1M"]}] },
  { name:"Mixpanel", slug:"mixpanel", category:"analytics", tagline:"Product analytics for user behavior tracking", description:"Mixpanel tracks user actions across web and mobile, providing retention analysis, funnel visualization, and cohort analysis with AI-powered insights.", website:"https://mixpanel.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.4, review_count:3214, tags:["free","pro"], scores:{ease_of_use:7.5,value_for_money:8.0,feature_depth:8.5,support_quality:8.0,integration_richness:9.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["20M monthly events","Core analytics"]},{tier_name:"Growth",price_monthly:28,is_popular:true,features:["Unlimited saved reports","Data pipelines"]}] },
];

const AUTHORS = [
  { name:"Sarah Chen",      slug:"sarah-chen",      avatar:"https://ui-avatars.com/api/?name=Sarah+Chen&size=128&background=6366f1&color=fff&bold=true", role:"AI Tools Editor",    bio:"Former PM at Notion. Writing about tools that power modern work." },
  { name:"Emeka Okonkwo",   slug:"emeka-okonkwo",   avatar:"https://ui-avatars.com/api/?name=Emeka+Okonkwo&size=128&background=059669&color=fff&bold=true", role:"SaaS Analyst",        bio:"Building and writing about SaaS from Lagos. Focus on Africa-friendly tools." },
  { name:"Alex Rivera",     slug:"alex-rivera",     avatar:"https://ui-avatars.com/api/?name=Alex+Rivera&size=128&background=dc2626&color=fff&bold=true", role:"Automation Expert",   bio:"Zapier-certified expert helping teams automate boring work since 2019." },
  { name:"Maya Patel",      slug:"maya-patel",      avatar:"https://ui-avatars.com/api/?name=Maya+Patel&size=128&background=7c3aed&color=fff&bold=true", role:"Design Tools Lead",   bio:"Designer turned writer. Covering AI design tools and creative workflows." },
  { name:"FutureStack AI",  slug:"futurestack-ai",  avatar:"https://ui-avatars.com/api/?name=FS+AI&size=128&background=0ea5e9&color=fff&bold=true",       role:"AI Writer",           bio:"AI-powered editorial engine monitoring the AI tool ecosystem 24/7." },
];

const ARTICLES = [
  { slug:"best-ai-tools-freelancers-2026",   title:"The 15 Best AI Tools for Freelancers in 2026",                     excerpt:"From writing to invoicing — the AI tools that actually save freelancers time and money this year.",                                   category_slug:"ai-tools",       is_featured:true,  reading_time:10, tags:["freelancer","productivity","ai-tools"],       content:`## The Freelancer AI Stack That's Winning in 2026\n\nFreelancing has always been about doing more with less. In 2026, the freelancers pulling ahead aren't working harder — they're working with better AI tools.\n\nHere's what's actually working:\n\n### 1. ChatGPT — Writing + Research\nStill the backbone of most freelance workflows. Use it for first drafts, research synthesis, client communication, and idea generation. The $20/month Plus plan pays for itself in hours saved.\n\n### 2. Claude — Long-Form Analysis\nWhere ChatGPT drafts, Claude thinks. Use it for long documents, complex client briefs, and anything requiring nuanced reasoning. Its 200K context window is unmatched.\n\n### 3. Cursor — Development\nIf you do any coding work, Cursor is non-negotiable. It understands your entire codebase and handles multi-file edits that used to take hours.\n\n### 4. ElevenLabs — Audio Content\nNarrate your portfolio pieces, create client-ready audio content, or produce a podcast — all without a recording studio.\n\n### 5. Canva AI — Visual Content\nGenerate on-brand images, presentations, and social posts faster than ever with Magic Write and AI image generation.\n\n## The Africa-First Perspective\n\nFor freelancers in African markets, tool accessibility matters. ChatGPT, Claude, QuillBot, and Canva all work reliably across Africa with standard payment methods.\n\n## What to Skip\n\nDon't waste money on specialized tools that overlap with your existing stack. Most freelancers need 3-5 core tools, not 20.`, author_name:"Emeka Okonkwo" },
  { slug:"ai-tools-saas-founders-2026",      title:"The AI Stack Every SaaS Founder Needs in 2026",                   excerpt:"Ship faster, market smarter, support better — the exact tools top founders use to run lean SaaS businesses.",                        category_slug:"ai-tools",       is_featured:true,  reading_time:8,  tags:["saas","founder","startup","ai-tools"],         content:`## Build Faster. Sell Smarter. Scale Leaner.\n\nSaaS founders are fighting on two fronts: building a product fast enough to matter, and marketing it on a budget that's never big enough. AI has changed the math.\n\n### The Build Stack\n\n**Cursor + Claude** is the combination dominating solo founder setups. Cursor handles code generation and refactoring. Claude handles architecture decisions and documentation. Many founders report shipping 3-4x faster than before AI tools.\n\n**v0 by Vercel** turns UI ideas into production-ready React components in seconds. Stop spending days on UI that Claude and v0 can build in hours.\n\n**GitHub Copilot** for anything that isn't covered by Cursor. The free tier is surprisingly capable.\n\n### The Marketing Stack\n\n**Copy.ai GTM Workflows** automate your entire content pipeline. Feed it your positioning document and it generates blog posts, social content, email sequences, and ad copy.\n\n**Surfer SEO** ensures your content actually ranks. Don't publish anything without running it through Surfer first.\n\n### The Support Stack\n\n**Fireflies AI** records and transcribes every user call automatically. Your entire product discovery becomes searchable.\n\n## The Math That Matters\n\n$150/month in AI subscriptions can replace $5,000/month in contractor costs. For pre-revenue founders, that math is game-changing.`, author_name:"Sarah Chen" },
  { slug:"cursor-vs-copilot-2026",           title:"Cursor vs GitHub Copilot: Which AI Coding Tool Wins in 2026?",   excerpt:"We tested both for 30 days on real projects. Here's the honest verdict.",                                                           category_slug:"comparisons",     is_featured:false, reading_time:7,  tags:["coding","cursor","copilot","comparison"],      content:`## Cursor vs GitHub Copilot: Honest Verdict After 30 Days\n\nBoth tools promise to make you a 10x developer. Only one actually delivers.\n\n### What Cursor Does Differently\n\nCursor isn't just autocomplete — it's a full IDE rewrite. The key difference: **Cursor understands your entire codebase**. Not just the file you're editing, but all related files, your project structure, and implicit patterns.\n\nThis means multi-file edits happen with one natural language command, and bug explanations reference your actual code.\n\n### Where GitHub Copilot Wins\n\nCopilot lives inside VS Code — your existing IDE. Zero setup friction. If your team is already on VS Code with Copilot, the switching cost is real.\n\nCopilot's inline completions are also faster. When you just want "finish this function," Copilot adds less latency.\n\n### The Verdict\n\n**Use Cursor if:** You do full-stack development, work across multiple files, or are a solo founder/freelancer who needs maximum output per hour.\n\n**Use Copilot if:** You're in a large engineering team on VS Code, work in a regulated environment, or primarily need autocomplete rather than AI chat.`, author_name:"Alex Rivera" },
  { slug:"elevenlabs-complete-guide-2026",   title:"ElevenLabs 2026: The Complete Guide for Content Creators",        excerpt:"Voice cloning, multilingual content, and API integrations — everything you need to know.",                                           category_slug:"ai-tools",       is_featured:false, reading_time:8,  tags:["audio","voice","elevenlabs","content-creation"], content:`## ElevenLabs is Now the Default for Voice Content\n\nIn 2026, creating audio content without ElevenLabs is like building a website without a framework — technically possible, practically inefficient.\n\n### Voice Cloning Has Matured\n\nThe Clone feature now requires just 1 minute of clean audio. The output is indistinguishable from the source voice in most listening contexts.\n\n**Practical applications:**\n- YouTube channels: Narrate in your own voice without recording\n- Podcasts: Fix audio mistakes with text edits\n- International content: Clone your voice in 29 languages\n\n### The Creator Tier Sweet Spot\n\nAt $22/month, the Creator plan gives you 100K characters — roughly 80 minutes of narration. For a freelance content creator with one or two clients, this covers a full month of projects.\n\n### Africa-Friendly Verdict\n\nElevenLabs accepts international cards. The free tier (10K characters = ~8 minutes) is enough to pitch a voice content service to your first client.`, author_name:"Maya Patel" },
  { slug:"zapier-vs-make-2026",              title:"Zapier vs Make in 2026: The Honest Comparison",                   excerpt:"After testing both on real client workflows, here's which automation tool to pick and when.",                                     category_slug:"comparisons",     is_featured:false, reading_time:9,  tags:["automation","zapier","make","no-code"],          content:`## Zapier vs Make: Stop Guessing, Start Automating\n\n### Zapier: The Safe Choice\n\n**Who it's for:** Non-technical users, small teams, anyone who wants automation "just to work."\n\nZapier's 7000+ app library is unmatched. The interface is clean — anyone can build a basic Zap in 10 minutes.\n\nThe drawback: price. At $49/month for 2000 tasks, Zapier is expensive when you're running dozens of automations.\n\n### Make: The Power User's Choice\n\n**Who it's for:** Agencies, developers, operations teams with complex requirements.\n\nMake's visual flow builder shows you exactly how data moves through your automation. It supports advanced logic that Zapier struggles with.\n\nCost is Make's superpower: 10K operations/month for $9.\n\n### n8n: The Third Option\n\nIf you can self-host, n8n is worth serious consideration. Free forever, 400+ integrations, and new AI nodes that turn it into an LLM workflow engine.`, author_name:"Alex Rivera" },
  { slug:"ai-news-africa-tools-2026",        title:"The Best AI Tools for African Freelancers and Founders",          excerpt:"Not all AI tools work equally across Africa. Here's what's accessible, affordable, and worth your money.",                            category_slug:"ai-tools",       is_featured:true,  reading_time:10, tags:["africa","freelancer","accessibility","ai-tools"], content:`## Building with AI from Africa in 2026\n\nThe AI tool landscape was built for Silicon Valley. But in 2026, a growing number of tools work well — and are priced appropriately — for African freelancers and founders.\n\n### The Payment Barrier\n\nMost AI tools accept Visa and Mastercard — which is accessible across Africa through virtual cards from providers like Chipper Cash, Eversend, and Grey Finance.\n\n### Top Africa-Friendly AI Tools\n\n**ChatGPT (Free Tier)** — Available, functional, and the free tier is genuinely useful.\n\n**Claude** — Accessible via web and API. Anthropic has expanded availability significantly.\n\n**Canva** — Works excellently in Africa. The free tier is one of the most generous in the industry.\n\n**ElevenLabs** — International card support. The free tier is enough to create a first voice product.\n\n**Make.com** — 1000 free operations/month with no credit card required.\n\n**Fathom AI** — Free meeting recorder that works on any internet connection.\n\n### The Opportunity\n\nAfrican freelancers who master these tools command global rates while benefiting from local cost of living. The AI leverage is real and growing.`, author_name:"Emeka Okonkwo" },
  { slug:"midjourney-v7-review",             title:"Midjourney V7 Review: Is It Worth Upgrading?",                    excerpt:"After 30 days with Midjourney V7, here's our honest verdict on what changed and whether it matters.",                              category_slug:"ai-tools",       is_featured:false, reading_time:7,  tags:["design","midjourney","image-generation","review"], content:`## Midjourney V7: 30-Day Verdict\n\n### What Actually Changed\n\n**Draft Mode** is the headline feature. Generate a rough image in 8 seconds, iterate on the concept, then upscale when you've nailed the composition.\n\n**Personalization** works better now. After training on 50 reference images, V7 generates closer to your aesthetic from prompt 1.\n\n**Text in images** is dramatically improved. V7 handles short text with ~85% accuracy — a huge jump from V6's near-random results.\n\n### V6 vs V7 Quality\n\nHonest take: V7 wins on realism and photography. V6 wins on artistic abstraction and painterly styles.\n\n**Bottom line:** Upgrade. The Draft Mode alone justifies it for professional users.`, author_name:"Maya Patel" },
  { slug:"stack-builder-guide-agencies",     title:"How Top Agencies Build AI Tool Stacks for Clients",               excerpt:"The methodology behind building AI stacks that solve real problems — not just impressive tool lists.",                             category_slug:"tutorials",       is_featured:false, reading_time:11, tags:["agencies","stack-builder","workflow","tutorial"],  content:`## Building AI Stacks That Actually Work\n\nMost "AI tool stacks" are just lists. The best ones are engineered workflows where each tool solves a specific problem and passes output to the next.\n\n### The Stack Design Methodology\n\n**Step 1: Map the Pain**\nBefore recommending tools, document exactly where time and money are being lost.\n\n**Step 2: Identify the Output Format**\nEvery tool in a stack needs to output in a format the next tool can consume. Mismatched outputs are the #1 cause of stack failure.\n\n**Step 3: Start With One Workflow**\nDon't try to automate everything. Pick the single workflow that costs the most time or money, and automate that first.\n\n### The Agency Content Stack (Tested)\n\n1. **ChatGPT** → Research brief and outline\n2. **Claude** → First draft from outline\n3. **Surfer SEO** → Optimization scoring\n4. **Grammarly** → Quality check\n5. **Canva** → Social graphics from content\n6. **Zapier** → Publish to all channels\n\nTime to produce one SEO article with social package: 45 minutes (down from 8 hours).`, author_name:"Sarah Chen" },
];

const STACKS = [
  { slug:"content-creator-pro",    name:"Content Creator Pro Stack",     description:"The ultimate AI toolkit for content creators. Write, design, record, and distribute faster.", target_role:"freelancer",   category:"content",     clone_count:2341, rating:4.9, featured:true,  tool_slugs:["chatgpt","claude","midjourney","elevenlabs","canva","opus-clip"] },
  { slug:"agency-operations",       name:"Agency Operations Stack",        description:"Run your agency on autopilot. Client delivery, reporting, and communication — all automated.",  target_role:"agency",       category:"operations",  clone_count:1876, rating:4.8, featured:true,  tool_slugs:["notion-ai","zapier","make","jasper-ai","surfer-seo","fireflies-ai"] },
  { slug:"saas-founder-bootstrap",  name:"SaaS Founder Bootstrap Stack",   description:"Ship your MVP with minimal budget. The tools that help indie founders move fastest.",          target_role:"saas-founder", category:"startup",     clone_count:1543, rating:4.8, featured:true,  tool_slugs:["cursor","claude","v0-vercel","zapier","chatgpt","github-copilot"] },
  { slug:"developer-productivity",  name:"Developer Productivity Stack",   description:"The AI tools top engineers use to 10x output without burning out.",                            target_role:"saas-founder", category:"development", clone_count:987,  rating:4.7, featured:false, tool_slugs:["cursor","github-copilot","claude","v0-vercel","perplexity-ai"] },
  { slug:"creative-agency-design",  name:"Creative Agency Design Stack",   description:"AI-powered design workflow for teams that need to move fast on every brief.",                  target_role:"agency",       category:"design",      clone_count:754,  rating:4.6, featured:false, tool_slugs:["midjourney","canva","elevenlabs","runway-ml","figma-ai"] },
  { slug:"freelance-writer-ai",     name:"Freelance Writer AI Stack",      description:"Write faster, rank higher, earn more. The complete AI writing toolkit for freelancers.",       target_role:"freelancer",   category:"writing",     clone_count:654,  rating:4.7, featured:false, tool_slugs:["chatgpt","claude","grammarly-go","surfer-seo","quillbot","notion-ai"] },
  { slug:"africa-friendly-stack",   name:"Africa-Optimized AI Stack",      description:"The best AI tools for African freelancers — accessible, affordable, and reliable.",           target_role:"freelancer",   category:"general",     clone_count:1234, rating:4.8, featured:true,  tool_slugs:["chatgpt","canva","elevenlabs","otter-ai","grammarly-go","make"] },
  { slug:"video-production-ai",     name:"Video Production AI Stack",      description:"Create professional video content without a production team.",                                 target_role:"agency",       category:"video",       clone_count:543,  rating:4.6, featured:false, tool_slugs:["runway-ml","descript","opus-clip","elevenlabs","canva","invideo-ai"] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function ensureCategories() {
  console.log("\n📂 Ensuring tool categories…");
  const cats = [
    { id:"writing",      name:"Writing",        icon:"pen-tool",  count:0 },
    { id:"design",       name:"Design",         icon:"palette",   count:0 },
    { id:"code",         name:"Code",           icon:"code",      count:0 },
    { id:"video",        name:"Video",          icon:"video",     count:0 },
    { id:"audio",        name:"Audio",          icon:"mic",       count:0 },
    { id:"data",         name:"Data & Research",icon:"database",  count:0 },
    { id:"automation",   name:"Automation",     icon:"zap",       count:0 },
    { id:"productivity", name:"Productivity",   icon:"layout",    count:0 },
    { id:"marketing",    name:"Marketing",      icon:"bar-chart", count:0 },
    { id:"analytics",    name:"Analytics",      icon:"activity",  count:0 },
  ];
  const { error } = await sb.from("tool_categories").upsert(cats, { onConflict:"id" });
  if (error) { fail("tool_categories", error); return; }
  ok(`${cats.length} tool categories`);
}

async function ensureArticleCategories() {
  console.log("\n📂 Ensuring article categories…");
  const cats = [
    { name:"AI Tools",        slug:"ai-tools" },
    { name:"Comparisons",     slug:"comparisons" },
    { name:"Tutorials",       slug:"tutorials" },
    { name:"Industry Trends", slug:"industry-trends" },
    { name:"Africa Tech",     slug:"africa-tech" },
    { name:"Automation",      slug:"automation" },
    { name:"Design",          slug:"design" },
    { name:"Marketing",       slug:"marketing" },
  ];
  const { data, error } = await sb.from("categories").upsert(cats, { onConflict:"slug" }).select("id,slug");
  if (error) { fail("categories", error); return {}; }
  const map = {};
  for (const c of data ?? []) map[c.slug] = c.id;
  ok(`${Object.keys(map).length} article categories`);
  return map;
}

async function seedAuthors() {
  console.log("\n👤 Seeding authors…");
  const { data, error } = await sb.from("authors").upsert(AUTHORS, { onConflict:"slug" }).select("id,name");
  if (error) { fail("authors", error); return {}; }
  const map = {};
  for (const a of data ?? []) map[a.name] = a.id;
  ok(`${Object.keys(map).length} authors`);
  return map;
}

async function seedTools() {
  console.log(`\n🔧 Seeding ${TOOLS.length} tools… (images: ${SKIP_IMAGES ? "clearbit fallback" : "WaveSpeed AI"})`);
  const toolMap = {};
  let imageCount = 0;

  for (let i = 0; i < TOOLS.length; i++) {
    const t = TOOLS[i];
    process.stdout.write(`  [${String(i+1).padStart(3)}/${TOOLS.length}] ${t.name.padEnd(20)} `);

    let logo = null;
    if (!SKIP_IMAGES) {
      logo = await generateImage(t.name, t.category);
      if (logo) imageCount++;
    }
    if (!logo) logo = logoFallback(t.name, t.website);

    const row = {
      name: t.name, slug: t.slug, tagline: t.tagline, description: t.description,
      logo, website: t.website, website_url: t.website,
      category: t.category, pricing_model: t.pricing_model,
      has_free: t.pricing_model === "freemium",
      africa_friendly: t.africa_friendly, rating: t.rating,
      review_count: t.review_count, tags: t.tags ?? [],
      is_featured: t.is_featured, is_verified: true,
      is_new: (t.tags ?? []).includes("new"),
      status: "active",
      pricing_details: t.pricing ?? [],
      upvote_count: Math.floor(Math.random() * 800 + 50),
      save_count:   Math.floor(Math.random() * 500 + 20),
    };

    const { data, error } = await sb.from("tools").upsert(row, { onConflict:"slug" }).select("id,slug");
    if (error) { process.stdout.write(`❌\n`); fail(t.name, error.message); }
    else { process.stdout.write(`✅\n`); if (data?.[0]) toolMap[t.slug] = data[0].id; }
  }

  ok(`${Object.keys(toolMap).length} tools seeded (${imageCount} AI images)`);
  return toolMap;
}

async function seedToolScores(toolMap) {
  console.log("\n⭐ Seeding tool scores…");
  const rows = TOOLS.filter(t => toolMap[t.slug] && t.scores).map(t => ({
    tool_id: toolMap[t.slug], ...t.scores,
  }));
  if (!rows.length) { warn("No scores"); return; }
  const { error } = await sb.from("tool_scores").upsert(rows, { onConflict:"tool_id" });
  if (error) fail("tool_scores", error.message);
  else ok(`${rows.length} tool scores`);
}

async function seedToolPricing(toolMap) {
  console.log("\n💰 Seeding tool pricing…");
  const rows = TOOLS.flatMap(t => (t.pricing ?? []).map(p => ({ tool_id: toolMap[t.slug], ...p }))).filter(r => r.tool_id);
  if (!rows.length) { warn("No pricing"); return; }
  const toolIds = [...new Set(rows.map(r => r.tool_id))];
  await sb.from("tool_pricing").delete().in("tool_id", toolIds);
  const { error } = await sb.from("tool_pricing").insert(rows);
  if (error) fail("tool_pricing", error.message);
  else ok(`${rows.length} pricing tiers`);
}

async function seedAlternatives(toolMap) {
  console.log("\n🔁 Seeding alternatives…");
  const pairs = [
    ["chatgpt","claude",0.9],["claude","gemini",0.75],["cursor","github-copilot",0.85],
    ["cursor","codeium",0.7],["zapier","make",0.88],["zapier","n8n",0.75],
    ["midjourney","leonardo-ai",0.8],["elevenlabs","murf-ai",0.75],["elevenlabs","playht",0.8],
    ["runway-ml","pika-labs",0.8],["notion-ai","loom-ai",0.6],["otter-ai","fireflies-ai",0.9],
    ["otter-ai","fathom-ai",0.85],["lovable","bolt-ai",0.85],["lovable","cursor",0.65],
    ["v0-vercel","cursor",0.6],["perplexity-ai","chatgpt",0.65],["canva","adobe-firefly",0.7],
  ];
  const rows = pairs.flatMap(([a,b,score]) => {
    const aId = toolMap[a], bId = toolMap[b];
    if (!aId || !bId) return [];
    return [{ tool_id:aId, alternative_id:bId, similarity_score:score }, { tool_id:bId, alternative_id:aId, similarity_score:score }];
  });
  if (!rows.length) { warn("No alternatives"); return; }
  const { error } = await sb.from("tool_alternatives").upsert(rows, { onConflict:"tool_id,alternative_id" });
  if (error) fail("tool_alternatives", error.message);
  else ok(`${rows.length} alternative pairs`);
}

async function seedArticles(authorMap, categoryMap) {
  if (TOOLS_ONLY) { info("Skipping articles (--tools-only)"); return; }
  console.log("\n📰 Seeding articles…");

  const unsplashIds = ["1677442135703-1787eea5ce01","1620712943543-bcc4688e7485","1518770660439-4636190af475","1531297484001-80022131f5a1","1550751827-4bd374c3f58b","1485827404703-89b55fcc595e","1510915228919-c4e975ebcef7","1581091226825-a6a2a5aee158","1451187580459-43490279c0fa","1563986768609-322da13575f3"];

  const rows = ARTICLES.map((a, i) => {
    const authorId = authorMap[a.author_name] || null;
    const categoryId = categoryMap[a.category_slug] || null;
    const heroImg = `https://images.unsplash.com/photo-${unsplashIds[i % unsplashIds.length]}?w=1200&h=630&fit=crop&auto=format`;
    return {
      title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content,
      tags: a.tags ?? [], category_id: categoryId, author_id: authorId,
      hero_image: heroImg, cover_image_url: heroImg,
      meta_description: a.excerpt, seo_title: a.title, seo_description: a.excerpt,
      status: "published", is_featured: a.is_featured ?? false,
      is_ai_generated: false, is_premium: false, is_breaking: false,
      reading_time: a.reading_time ?? 5,
      word_count: Math.round((a.content ?? "").split(/\s+/).length),
      view_count: Math.floor(Math.random() * 8000 + 500),
      like_count: Math.floor(Math.random() * 400 + 20),
      share_count: Math.floor(Math.random() * 100 + 5),
      published_at: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
    };
  });

  const { data, error } = await sb.from("articles").upsert(rows, { onConflict:"slug" }).select("id,slug");
  if (error) fail("articles", error.message);
  else ok(`${data?.length} articles`);
}

async function seedStacks(toolMap) {
  if (TOOLS_ONLY) { info("Skipping stacks (--tools-only)"); return; }
  console.log("\n📦 Seeding stacks…");

  const stackRows = STACKS.map(({ tool_slugs, ...s }) => s);
  const { data, error } = await sb.from("stacks").upsert(stackRows, { onConflict:"slug" }).select("id,slug");
  if (error) { fail("stacks", error.message); return; }

  const stackMap = {};
  for (const s of data ?? []) stackMap[s.slug] = s.id;

  const links = STACKS.flatMap(s =>
    (s.tool_slugs ?? []).map((slug, position) => ({ stack_id: stackMap[s.slug], tool_id: toolMap[slug], position })).filter(r => r.stack_id && r.tool_id)
  );
  if (links.length) {
    await sb.from("stack_tools").delete().in("stack_id", Object.values(stackMap));
    const { error: e2 } = await sb.from("stack_tools").insert(links);
    if (e2) fail("stack_tools", e2.message);
  }
  ok(`${data?.length} stacks + ${links.length} tool links`);
}

async function updateCategoryCounts(toolMap) {
  console.log("\n📊 Updating category counts…");
  const counts = {};
  for (const t of TOOLS) counts[t.category] = (counts[t.category] || 0) + 1;
  for (const [id, count] of Object.entries(counts)) {
    await sb.from("tool_categories").update({ count }).eq("id", id);
  }
  ok("Category counts updated");
}

async function main() {
  console.log("\n🌱 FutureStack — Full Database Seed");
  console.log("═".repeat(55));
  console.log(`  Tools: ${TOOLS.length} | Articles: ${ARTICLES.length} | Stacks: ${STACKS.length}`);
  console.log(`  Images: ${SKIP_IMAGES ? "Clearbit/Avatars (instant)" : "WaveSpeed AI → Cloudinary"}`);
  console.log("═".repeat(55));

  await ensureCategories();
  const categoryMap = await ensureArticleCategories();
  const authorMap   = await seedAuthors();
  const toolMap     = await seedTools();
  await seedToolScores(toolMap);
  await seedToolPricing(toolMap);
  await seedAlternatives(toolMap);
  await seedArticles(authorMap, categoryMap);
  await seedStacks(toolMap);
  await updateCategoryCounts(toolMap);

  console.log("\n" + "═".repeat(55));
  console.log("✅ SEED COMPLETE! FutureStack is now loaded with real data.");
  console.log("═".repeat(55) + "\n");
}

main().catch(e => { console.error(e); process.exit(1); });
