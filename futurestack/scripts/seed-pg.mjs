/**
 * scripts/seed-pg.mjs
 * Seeds the Replit PostgreSQL database directly using pg.
 * Usage: node scripts/seed-pg.mjs [--quick]
 */
import pg from "pg";
import { readFileSync } from "fs";
import crypto from "crypto";
import https from "https";
import http from "http";
import { URL as NURL } from "url";

const { Pool } = pg;

const args = process.argv.slice(2);
const SKIP_IMAGES = args.includes("--quick") || args.includes("--skip-images");

// ── Load .env.local ──────────────────────────────────────────────────────────
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
} catch { /* rely on shell */ }

const DATABASE_URL      = process.env.DATABASE_URL;
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME || "dxizihlmo";
const CLOUDINARY_KEY    = process.env.CLOUDINARY_API_KEY   || "654919554582831";
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET || "j4GLSAjjApKUgInR41eCUiQIqUo";

if (!DATABASE_URL) { console.error("❌ Missing DATABASE_URL"); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL, ssl: false, max: 3 });

const ok   = (m)    => console.log(`  ✅ ${m}`);
const warn = (m)    => console.log(`  ⚠️  ${m}`);
const fail = (m, e) => console.error(`  ❌ ${m}`, e?.message ?? e ?? "");

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpReq(urlStr, opts = {}) {
  return new Promise((res, rej) => {
    const url = new NURL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, { method: opts.method || "GET", headers: opts.headers || {} }, (r) => {
      let d = "";
      r.on("data", c => d += c);
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

async function generateImage(toolName, category) {
  if (SKIP_IMAGES || !WAVESPEED_API_KEY) return null;
  try {
    const prompt = `Minimalist professional SaaS app icon for "${toolName}", ${category} software. Flat vector design, bold geometric shapes, clean lines, white background, single strong color accent, no text, no letters. Modern tech brand mark, app store icon style.`;
    const r = await httpReq("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-schnell", {
      method: "POST",
      headers: { Authorization: `Bearer ${WAVESPEED_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width: 512, height: 512, num_inference_steps: 4, guidance_scale: 3.5, num_images: 1 }),
    });
    if (r.status !== 200) { warn(`WaveSpeed ${r.status} for ${toolName}`); return null; }
    const imgUrl = r.body?.data?.outputs?.[0] || r.body?.outputs?.[0] || r.body?.images?.[0]?.url;
    if (!imgUrl) return null;
    return await uploadCloudinary(imgUrl, toolName);
  } catch (e) { warn(`Image gen failed: ${e.message}`); return null; }
}

async function uploadCloudinary(imgUrl, name) {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const pid = `futurestack/tools/${name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50)}`;
    const sig = crypto.createHash("sha1").update(`file=${imgUrl}&public_id=${pid}&timestamp=${ts}${CLOUDINARY_SECRET}`).digest("hex");
    const body = new URLSearchParams({ file: imgUrl, public_id: pid, timestamp: String(ts), api_key: CLOUDINARY_KEY, signature: sig }).toString();
    const r = await httpReq(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
    });
    return r.status === 200 ? r.body?.secure_url || null : null;
  } catch { return null; }
}

function logoFallback(name, website) {
  if (website) {
    try {
      const domain = new NURL(website).hostname.replace("www.", "");
      return `https://logo.clearbit.com/${domain}`;
    } catch {}
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0, 2))}&size=128&background=6366f1&color=fff&bold=true&format=png`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — same as seed-with-images.mjs but pg-powered
// ═══════════════════════════════════════════════════════════════════════════════

const TOOLS = [
  { name:"ChatGPT", slug:"chatgpt", category:"writing", tagline:"The world's leading AI assistant by OpenAI", description:"ChatGPT powers conversations, writing, coding, and analysis. With GPT-4o, handles text, images, files and voice.", website:"https://chat.openai.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:8542, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:9.5,support_quality:8.0,integration_richness:9.0,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["GPT-4o mini","50 msgs/day"]},{tier_name:"Plus",price_monthly:20,is_popular:true,features:["GPT-4o unlimited","DALL-E 3","Advanced analysis"]}] },
  { name:"Claude", slug:"claude", category:"writing", tagline:"Thoughtful AI for complex analysis and long writing", description:"Claude by Anthropic excels at nuanced long-form writing, code review, and complex reasoning. 200K context window.", website:"https://claude.ai", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:3812, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:9.0,support_quality:7.5,integration_richness:7.5,ai_capability:9.2}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Claude 3.5 Haiku","Limited usage"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["5x usage","All Claude models","Priority"]}] },
  { name:"Gemini", slug:"gemini", category:"writing", tagline:"Google's multimodal AI assistant", description:"Gemini Ultra handles text, images, audio, video, and code. Deeply integrated with Google Workspace.", website:"https://gemini.google.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:8.5,support_quality:7.5,integration_richness:9.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Gemini 1.5 Flash","Google Workspace"]},{tier_name:"Advanced",price_monthly:19.99,is_popular:true,features:["Gemini Ultra","1TB storage"]}] },
  { name:"Jasper AI", slug:"jasper-ai", category:"writing", tagline:"AI writing platform built for marketing teams", description:"Jasper is trained on marketing copy and brand voice. Generates ad copy, blog posts, social content at scale.", website:"https://jasper.ai", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.4, review_count:1892, tags:["pro","trending"], scores:{ease_of_use:8.0,value_for_money:7.0,feature_depth:8.0,support_quality:8.5,integration_richness:7.5,ai_capability:7.5}, pricing:[{tier_name:"Creator",price_monthly:49,is_popular:true,features:["1 seat","Brand voice","50 knowledge assets"]},{tier_name:"Pro",price_monthly:69,features:["3 seats","Campaigns"]}] },
  { name:"QuillBot", slug:"quillbot", category:"writing", tagline:"AI paraphraser and writing assistant", description:"QuillBot paraphrases content in multiple modes: fluency, formal, academic, creative. Used by millions worldwide.", website:"https://quillbot.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:3201, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:7.0,support_quality:7.0,integration_richness:7.5,ai_capability:7.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["125 words/paraphrase","2 modes"]},{tier_name:"Premium",price_monthly:9.95,is_popular:true,features:["Unlimited words","All modes"]}] },
  { name:"Grammarly", slug:"grammarly-go", category:"writing", tagline:"AI writing help embedded everywhere you write", description:"Grammarly provides real-time grammar, tone, clarity suggestions plus generative AI drafting across 500,000+ apps.", website:"https://grammarly.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:7821, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:9.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Grammar checks","100 AI prompts/month"]},{tier_name:"Premium",price_monthly:12,is_popular:true,features:["Advanced suggestions","Plagiarism checker"]}] },
  { name:"Copy.ai", slug:"copy-ai", category:"writing", tagline:"AI copywriter for marketing and sales", description:"Copy.ai generates sales emails, ad copy, product descriptions, and social content with GTM workflow automation.", website:"https://copy.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:1243, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["2000 words/month"]},{tier_name:"Pro",price_monthly:36,is_popular:true,features:["Unlimited words","GTM Workflows"]}] },
  { name:"Writesonic", slug:"writesonic", category:"writing", tagline:"AI writer with real-time web access", description:"Writesonic creates SEO-optimized articles with real-time Google data. Chatsonic gives conversational AI with internet.", website:"https://writesonic.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:987, tags:["free","pro"], scores:{ease_of_use:8.0,value_for_money:8.0,feature_depth:8.0,support_quality:7.5,integration_richness:7.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10,000 words/month"]},{tier_name:"Individual",price_monthly:16,is_popular:true,features:["Unlimited words","SEO checker"]}] },

  // CODE
  { name:"GitHub Copilot", slug:"github-copilot", category:"code", tagline:"AI pair programmer integrated into your IDE", description:"GitHub Copilot suggests code and complete functions in real-time, powered by OpenAI Codex.", website:"https://github.com/features/copilot", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:8920, tags:["free","pro","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:8.0,integration_richness:9.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["2000 completions/month"]},{tier_name:"Pro",price_monthly:10,is_popular:true,features:["Unlimited completions","All models"]}] },
  { name:"Cursor", slug:"cursor", category:"code", tagline:"AI-first code editor built on VS Code", description:"Cursor deeply integrates Claude and GPT-4 for chat, edit, and code generation across your entire codebase.", website:"https://cursor.sh", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:3241, tags:["free","pro","trending","new"], scores:{ease_of_use:8.5,value_for_money:9.0,feature_depth:9.0,support_quality:7.5,integration_richness:8.0,ai_capability:9.0}, pricing:[{tier_name:"Hobby",price_monthly:0,is_free_tier:true,features:["2000 completions","50 slow requests"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["Unlimited completions","500 fast requests"]}] },
  { name:"Codeium", slug:"codeium", category:"code", tagline:"Free AI coding assistant for all IDEs", description:"Codeium provides free AI code completion, chat, and search across 70+ languages and 40+ IDEs with no limits.", website:"https://codeium.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1823, tags:["free","africa-friendly","new"], scores:{ease_of_use:9.0,value_for_money:9.5,feature_depth:7.5,support_quality:7.0,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Individual",price_monthly:0,is_free_tier:true,features:["Unlimited completions","Chat","70+ languages"]},{tier_name:"Teams",price_monthly:12,is_popular:true,features:["Team management","Advanced features"]}] },
  { name:"v0 by Vercel", slug:"v0-vercel", category:"code", tagline:"AI UI generator that outputs production React code", description:"v0 generates production-ready React components with Tailwind CSS and shadcn/ui from text prompts or screenshots.", website:"https://v0.dev", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:1567, tags:["free","pro","new","trending"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:8.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["200 credits/month"]},{tier_name:"Premium",price_monthly:20,is_popular:true,features:["5000 credits/month","Private generations"]}] },
  { name:"Lovable", slug:"lovable", category:"code", tagline:"Build full-stack apps with AI — no code required", description:"Lovable turns natural language into complete full-stack React applications backed by Supabase with one-click deploy.", website:"https://lovable.dev", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","pro","africa-friendly","new","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:8.0,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["5 messages/day"]},{tier_name:"Starter",price_monthly:20,is_popular:true,features:["100 messages/month","Custom domain"]}] },
  { name:"Bolt AI", slug:"bolt-ai", category:"code", tagline:"Full-stack AI app builder in the browser", description:"Bolt.new builds and runs complete full-stack applications in the browser using AI with instant deployment.", website:"https://bolt.new", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2134, tags:["free","pro","africa-friendly","new","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["150K tokens/day"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["10M tokens/month","Private projects"]}] },
  { name:"Replit AI", slug:"replit-ai", category:"code", tagline:"AI coding in the browser — build and deploy instantly", description:"Replit's AI agent builds complete web apps from a description. Writes, runs, debugs, and deploys in a browser IDE.", website:"https://replit.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:4231, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Basic IDE","Community support"]},{tier_name:"Core",price_monthly:25,is_popular:true,features:["AI agent","Private repls","Deployments"]}] },

  // VIDEO
  { name:"Runway ML", slug:"runway-ml", category:"video", tagline:"AI video generation and creative editing platform", description:"Runway leads AI video generation with Gen-3, motion brush, and inpainting tools used by Hollywood studios.", website:"https://runwayml.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.7, review_count:2341, tags:["free","pro","trending"], scores:{ease_of_use:7.5,value_for_money:7.0,feature_depth:9.5,support_quality:7.0,integration_richness:6.5,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["125 one-time credits"]},{tier_name:"Pro",price_monthly:35,is_popular:true,features:["2250 credits/month","4K export"]}] },
  { name:"Pika Labs", slug:"pika-labs", category:"video", tagline:"Create and edit videos with AI from text or images", description:"Pika turns text and images into high-quality short videos with cinematic scenes in seconds.", website:"https://pika.art", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1234, tags:["free","pro","new","trending"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:8.0,support_quality:7.0,integration_richness:5.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250 credits/month","720p"]},{tier_name:"Standard",price_monthly:8,is_popular:true,features:["700 credits/month","1080p"]}] },
  { name:"Synthesia", slug:"synthesia", category:"video", tagline:"Create AI avatar videos without cameras or actors", description:"Synthesia generates professional videos with realistic AI avatars from a script. Used by 50,000+ companies.", website:"https://synthesia.io", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.6, review_count:1876, tags:["pro","editor-pick"], scores:{ease_of_use:9.0,value_for_money:7.0,feature_depth:8.5,support_quality:8.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Starter",price_monthly:22,is_popular:true,features:["3 videos/month","70 avatars","125 languages"]}] },
  { name:"Descript", slug:"descript", category:"video", tagline:"Video and podcast editing as easy as editing text", description:"Descript edits video and audio by editing a transcript. Includes AI overdub for voice cloning.", website:"https://descript.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:8.0,integration_richness:8.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 hour transcription/month"]},{tier_name:"Creator",price_monthly:24,is_popular:true,features:["10 hours transcription","Overdub"]}] },
  { name:"Opus Clip", slug:"opus-clip", category:"video", tagline:"AI video repurposing — turn long videos into viral clips", description:"Opus Clip extracts the best short clips for TikTok, Reels, and YouTube Shorts. Adds captions and B-roll.", website:"https://opus.pro", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:1123, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:7.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["60 mins upload/month"]},{tier_name:"Starter",price_monthly:15,is_popular:true,features:["3 hours upload/month","Captions"]}] },
  { name:"InVideo AI", slug:"invideo-ai", category:"video", tagline:"Turn ideas and scripts into professional videos", description:"InVideo AI generates complete videos from text prompts with voiceover and stock footage.", website:"https://invideo.io", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:2341, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:6.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 videos/week","Watermarked"]},{tier_name:"Business",price_monthly:30,is_popular:true,features:["60 videos/month","No watermark"]}] },
  { name:"HeyGen", slug:"heygen", category:"video", tagline:"AI video generator with custom avatars and voices", description:"HeyGen creates talking avatar videos with your likeness and voice clone in multiple languages.", website:"https://heygen.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.5, review_count:987, tags:["free","pro","new"], scores:{ease_of_use:8.5,value_for_money:7.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.0,ai_capability:9.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 credit/month","3 min limit"]},{tier_name:"Creator",price_monthly:29,is_popular:true,features:["15 credits/month","Custom avatar"]}] },

  // DESIGN
  { name:"Midjourney", slug:"midjourney", category:"design", tagline:"AI image generation with top artistic quality", description:"Midjourney creates stunning photorealistic and artistic images from text prompts. The gold standard for AI art.", website:"https://midjourney.com", pricing_model:"paid", is_featured:true, africa_friendly:false, rating:4.9, review_count:5423, tags:["pro","trending","editor-pick"], scores:{ease_of_use:7.0,value_for_money:8.0,feature_depth:9.0,support_quality:6.5,integration_richness:5.0,ai_capability:9.8}, pricing:[{tier_name:"Basic",price_monthly:10,features:["200 images/month"]},{tier_name:"Standard",price_monthly:30,is_popular:true,features:["15h fast GPU","Unlimited relaxed"]}] },
  { name:"Canva AI", slug:"canva", category:"design", tagline:"AI-enhanced design platform for everyone", description:"Canva makes professional design accessible with 250K+ templates, Magic Write, and AI image generation.", website:"https://canva.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.8, review_count:9821, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.5,value_for_money:9.0,feature_depth:7.5,support_quality:8.0,integration_richness:8.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250K templates","5GB storage"]},{tier_name:"Pro",price_monthly:12.99,is_popular:true,features:["All templates","Brand Kit","1TB storage"]}] },
  { name:"Leonardo AI", slug:"leonardo-ai", category:"design", tagline:"AI image generation for game assets and creative work", description:"Leonardo AI specializes in consistent character design, game assets, and concept art with fine-tuned models.", website:"https://leonardo.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2123, tags:["free","pro","africa-friendly","new"], scores:{ease_of_use:8.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["150 tokens/day"]},{tier_name:"Apprentice",price_monthly:12,is_popular:true,features:["8500 tokens/month","Priority"]}] },
  { name:"Adobe Firefly", slug:"adobe-firefly", category:"design", tagline:"Adobe's commercial-safe generative AI for creatives", description:"Adobe Firefly generates images, vectors, and text effects that are 100% commercially safe, integrated with Photoshop.", website:"https://firefly.adobe.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.4, review_count:1654, tags:["free","pro"], scores:{ease_of_use:8.5,value_for_money:7.5,feature_depth:8.0,support_quality:8.5,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["25 credits/month"]},{tier_name:"Premium",price_monthly:4.99,is_popular:true,features:["100 credits/month","Commercial license"]}] },
  { name:"Figma AI", slug:"figma-ai", category:"design", tagline:"AI design features built into the industry standard", description:"Figma's AI features include auto-layout, text rewrite, design-to-code, and First Draft wireframe generation.", website:"https://figma.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.7, review_count:8921, tags:["free","pro","editor-pick"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:9.5,support_quality:8.5,integration_richness:9.5,ai_capability:8.0}, pricing:[{tier_name:"Starter",price_monthly:0,is_free_tier:true,features:["3 Figma files","AI features"]},{tier_name:"Professional",price_monthly:12,is_popular:true,features:["Unlimited files","Dev mode"]}] },
  { name:"Ideogram", slug:"ideogram", category:"design", tagline:"AI image generator that actually gets text right", description:"Ideogram specializes in generating images with accurate text rendering — perfect for logos and typographic designs.", website:"https://ideogram.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:876, tags:["free","pro","new","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:7.5,support_quality:7.0,integration_richness:5.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 images/day"]},{tier_name:"Basic",price_monthly:7,is_popular:true,features:["400 images/month","Private mode"]}] },
  { name:"Framer AI", slug:"framer-ai", category:"design", tagline:"AI website builder that generates from a prompt", description:"Framer builds an entire website from a single text prompt with a visual editor and one-click CDN publishing.", website:"https://framer.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1876, tags:["free","pro","africa-friendly","new"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1 project","AI generation"]},{tier_name:"Mini",price_monthly:5,is_popular:true,features:["Custom domain","1000 visitors/month"]}] },

  // AUDIO
  { name:"ElevenLabs", slug:"elevenlabs", category:"audio", tagline:"Ultra-realistic AI voice generation and cloning", description:"ElevenLabs generates the most realistic AI voices. Clone any voice in 30 seconds, create multilingual content.", website:"https://elevenlabs.io", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.8, review_count:4231, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:8.5,value_for_money:8.0,feature_depth:9.0,support_quality:7.5,integration_richness:8.0,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10K chars/month","3 custom voices"]},{tier_name:"Creator",price_monthly:22,is_popular:true,features:["100K chars/month","30 voices","Commercial license"]}] },
  { name:"Suno AI", slug:"suno-ai", category:"audio", tagline:"Generate full songs with AI — lyrics, melody, vocals", description:"Suno AI creates complete songs from text descriptions including lyrics, instrumentation, and vocals in any genre.", website:"https://suno.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:3241, tags:["free","pro","africa-friendly","trending","new"], scores:{ease_of_use:9.5,value_for_money:9.0,feature_depth:8.0,support_quality:7.0,integration_richness:5.5,ai_capability:9.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["50 credits/day","Non-commercial"]},{tier_name:"Pro",price_monthly:8,is_popular:true,features:["2500 credits/month","Commercial rights"]}] },
  { name:"Murf AI", slug:"murf-ai", category:"audio", tagline:"Studio-quality AI voiceovers for business", description:"Murf AI generates professional voiceovers with 120+ AI voices, pitch control, and video sync.", website:"https://murf.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:7.5,feature_depth:8.0,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 min voice generation"]},{tier_name:"Creator",price_monthly:29,is_popular:true,features:["48 voices","12 hours/year","Commercial rights"]}] },
  { name:"PlayHT", slug:"playht", category:"audio", tagline:"AI voice generator with ultra-realistic speech", description:"PlayHT creates natural-sounding voiceovers in 800+ voices across 100+ languages with instant voice cloning.", website:"https://play.ht", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1234, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.0,value_for_money:8.0,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["12,500 chars/month","3 cloned voices"]},{tier_name:"Creator",price_monthly:31.2,is_popular:true,features:["100K chars/month","API access"]}] },
  { name:"Speechify", slug:"speechify", category:"audio", tagline:"AI text-to-speech for faster reading and learning", description:"Speechify converts any text into natural-sounding audio. Used by 20M+ people to consume content faster.", website:"https://speechify.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3214, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:7.5,integration_richness:8.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Standard voices","1x-2.5x speed"]},{tier_name:"Premium",price_monthly:11.58,is_popular:true,features:["HD AI voices","Up to 4.5x speed"]}] },

  // AUTOMATION
  { name:"Zapier", slug:"zapier", category:"automation", tagline:"No-code automation connecting 7000+ apps", description:"Zapier connects your apps and automates workflows without code across 7000+ apps with AI-powered builder.", website:"https://zapier.com", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.6, review_count:8921, tags:["free","pro","africa-friendly","no-code"], scores:{ease_of_use:9.0,value_for_money:7.0,feature_depth:8.5,support_quality:8.5,integration_richness:10.0,ai_capability:7.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["100 tasks/month","5 Zaps"]},{tier_name:"Starter",price_monthly:19.99,is_popular:true,features:["750 tasks/month","20 Zaps","Multi-step"]}] },
  { name:"Make", slug:"make", category:"automation", tagline:"Visual workflow automation with 1500+ connectors", description:"Make offers a visual drag-and-drop workflow builder with complex logic and 1500+ integrations at half the Zapier cost.", website:"https://make.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3421, tags:["free","pro","no-code","africa-friendly"], scores:{ease_of_use:7.5,value_for_money:9.0,feature_depth:9.0,support_quality:7.0,integration_richness:9.0,ai_capability:6.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1000 ops/month","2 active scenarios"]},{tier_name:"Core",price_monthly:9,is_popular:true,features:["10K ops/month","Unlimited scenarios"]}] },
  { name:"n8n", slug:"n8n", category:"automation", tagline:"Open-source workflow automation with AI nodes", description:"n8n is a self-hostable workflow automation tool with 400+ integrations and LangChain/AI agent support.", website:"https://n8n.io", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:7.0,value_for_money:9.5,feature_depth:9.5,support_quality:8.0,integration_richness:9.0,ai_capability:8.0}, pricing:[{tier_name:"Community",price_monthly:0,is_free_tier:true,features:["Self-hosted","Unlimited workflows"]},{tier_name:"Starter",price_monthly:24,is_popular:true,features:["Cloud hosted","2500 executions/month"]}] },
  { name:"Bardeen AI", slug:"bardeen-ai", category:"automation", tagline:"AI automation for browsers — no API needed", description:"Bardeen automates repetitive browser tasks using AI. Scrape data, automate workflows — all in your browser.", website:"https://bardeen.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:876, tags:["free","pro","no-code","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:8.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited manual runs"]},{tier_name:"Professional",price_monthly:20,is_popular:true,features:["Unlimited scheduled runs"]}] },

  // PRODUCTIVITY
  { name:"Notion AI", slug:"notion-ai", category:"productivity", tagline:"AI assistant built inside your Notion workspace", description:"Notion AI lets you write, summarize, translate, and brainstorm directly in your workspace.", website:"https://notion.so/ai", pricing_model:"paid", is_featured:false, africa_friendly:true, rating:4.5, review_count:2876, tags:["pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"AI Add-on",price_monthly:10,is_popular:true,features:["Unlimited AI","Q&A across all pages"]}] },
  { name:"Fathom AI", slug:"fathom-ai", category:"productivity", tagline:"Free AI meeting recorder and note-taker", description:"Fathom records Zoom calls, highlights key moments, and generates AI summaries. The generous free plan is the default.", website:"https://fathom.video", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.7, review_count:2341, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.5,value_for_money:9.5,feature_depth:7.5,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited recordings","AI summaries"]},{tier_name:"Premium",price_monthly:19,is_popular:true,features:["Google Meet","Teams","CRM sync"]}] },
  { name:"Otter AI", slug:"otter-ai", category:"productivity", tagline:"AI meeting notes and transcription", description:"Otter AI automatically transcribes meetings in real-time, identifies speakers, and extracts action items.", website:"https://otter.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:2876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["600 min/month","3 AI summaries/month"]},{tier_name:"Pro",price_monthly:16.99,is_popular:true,features:["1200 min/month","Custom vocabulary"]}] },
  { name:"Gamma App", slug:"gamma-app", category:"productivity", tagline:"AI presentation and document creator", description:"Gamma generates beautiful presentations and websites from a text prompt in 30 seconds. No design skills needed.", website:"https://gamma.app", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:2876, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["400 AI credits","Unlimited viewers"]},{tier_name:"Plus",price_monthly:10,is_popular:true,features:["Unlimited AI","Custom branding"]}] },
  { name:"Loom AI", slug:"loom-ai", category:"productivity", tagline:"AI-powered async video communication", description:"Loom records screen and camera videos with AI-generated titles, summaries, chapters, and action items.", website:"https://loom.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:4321, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:8.5,feature_depth:8.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Starter",price_monthly:0,is_free_tier:true,features:["25 videos","5 min limit","AI features"]},{tier_name:"Business",price_monthly:12.5,is_popular:true,features:["Unlimited videos","No time limit"]}] },
  { name:"Fireflies AI", slug:"fireflies-ai", category:"productivity", tagline:"AI notetaker for meetings with search and analysis", description:"Fireflies records, transcribes, and analyzes your meetings with searchable databases and CRM integrations.", website:"https://fireflies.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:1543, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:8.5,support_quality:7.5,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["800 min storage","AI summaries"]},{tier_name:"Pro",price_monthly:18,is_popular:true,features:["Unlimited storage","Analytics"]}] },
  { name:"Linear AI", slug:"linear-ai", category:"productivity", tagline:"AI-powered project management for software teams", description:"Linear is the issue tracker for the best engineering teams. AI writes descriptions, suggests labels, breaks epics.", website:"https://linear.app", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.7, review_count:2134, tags:["free","pro","africa-friendly","editor-pick"], scores:{ease_of_use:9.0,value_for_money:9.0,feature_depth:9.0,support_quality:8.0,integration_richness:8.5,ai_capability:8.0}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["250 issues","AI features"]},{tier_name:"Standard",price_monthly:8,is_popular:true,features:["Unlimited issues","Roadmaps"]}] },
  { name:"Motion", slug:"motion", category:"productivity", tagline:"AI calendar and project manager that schedules your day", description:"Motion uses AI to automatically schedule your tasks, meetings, and projects based on priorities and deadlines.", website:"https://usemotion.com", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.5, review_count:1234, tags:["pro","trending"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:8.5,support_quality:7.5,integration_richness:7.5,ai_capability:8.5}, pricing:[{tier_name:"Individual",price_monthly:19,is_popular:true,features:["Auto-scheduling","Task management","Calendar sync"]}] },

  // DATA & RESEARCH
  { name:"Perplexity AI", slug:"perplexity-ai", category:"data", tagline:"AI answer engine with real-time web search", description:"Perplexity combines LLMs with real-time web search, giving cited answers to complex research questions.", website:"https://perplexity.ai", pricing_model:"freemium", is_featured:true, africa_friendly:true, rating:4.6, review_count:3241, tags:["free","pro","africa-friendly","trending"], scores:{ease_of_use:9.0,value_for_money:8.5,feature_depth:7.5,support_quality:7.0,integration_richness:6.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["Unlimited searches","5 Pro searches/day"]},{tier_name:"Pro",price_monthly:20,is_popular:true,features:["Unlimited Pro searches","File uploads"]}] },
  { name:"NotebookLM", slug:"notebooklm", category:"data", tagline:"Google's AI notebook that reasons over your documents", description:"NotebookLM lets you upload documents and PDFs, then chat with an AI that cites its sources. Perfect for research.", website:"https://notebooklm.google.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:1543, tags:["free","africa-friendly","new","trending"], scores:{ease_of_use:9.0,value_for_money:10.0,feature_depth:7.5,support_quality:7.5,integration_richness:6.5,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["50 notebooks","20 sources each","Audio overviews"]}] },
  { name:"Elicit", slug:"elicit", category:"data", tagline:"AI research assistant for academic papers", description:"Elicit searches and synthesizes 200M+ academic papers. Extract key findings without reading each one.", website:"https://elicit.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.4, review_count:876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:8.0,support_quality:7.5,integration_richness:5.0,ai_capability:8.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["5000 papers/month"]},{tier_name:"Plus",price_monthly:10,is_popular:true,features:["12,000 papers/month","Full synthesis"]}] },

  // MARKETING
  { name:"Surfer SEO", slug:"surfer-seo", category:"marketing", tagline:"AI content optimization for higher Google rankings", description:"Surfer SEO analyzes top-ranking pages and tells you exactly how to write content that ranks.", website:"https://surferseo.com", pricing_model:"paid", is_featured:false, africa_friendly:false, rating:4.5, review_count:2134, tags:["pro","editor-pick"], scores:{ease_of_use:8.0,value_for_money:7.5,feature_depth:8.5,support_quality:8.0,integration_richness:7.5,ai_capability:8.0}, pricing:[{tier_name:"Essential",price_monthly:89,features:["30 articles/month"]},{tier_name:"Scale",price_monthly:129,is_popular:true,features:["100 articles/month","AI writer included"]}] },
  { name:"Predis.ai", slug:"predis-ai", category:"marketing", tagline:"AI social media content creator with 80+ formats", description:"Predis.ai generates complete social media posts with design, captions, and hashtags across 80+ content formats.", website:"https://predis.ai", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.3, review_count:876, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.5,value_for_money:8.5,feature_depth:7.5,support_quality:7.5,integration_richness:7.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["15 posts/month"]},{tier_name:"Solo",price_monthly:27,is_popular:true,features:["60 posts/month","Analytics"]}] },
  { name:"Typeform AI", slug:"typeform-ai", category:"marketing", tagline:"Conversational forms and surveys with AI", description:"Typeform creates beautiful conversational forms. AI generates questions from a prompt and analyzes responses.", website:"https://typeform.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.5, review_count:3214, tags:["free","pro","africa-friendly"], scores:{ease_of_use:9.5,value_for_money:7.5,feature_depth:7.5,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["10 questions/form","100 responses/month"]},{tier_name:"Basic",price_monthly:25,is_popular:true,features:["Unlimited questions","1000 responses/month"]}] },

  // ANALYTICS
  { name:"PostHog", slug:"posthog", category:"analytics", tagline:"Open-source product analytics with session replay", description:"PostHog combines analytics, session recording, feature flags, and A/B testing. Self-hostable, GDPR-compliant.", website:"https://posthog.com", pricing_model:"freemium", is_featured:false, africa_friendly:true, rating:4.6, review_count:2134, tags:["free","pro","africa-friendly"], scores:{ease_of_use:8.0,value_for_money:9.5,feature_depth:9.0,support_quality:8.0,integration_richness:8.5,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["1M events/month","Session replay"]},{tier_name:"Teams",price_monthly:0,is_popular:true,features:["Pay as you go after 1M"]}] },
  { name:"Mixpanel", slug:"mixpanel", category:"analytics", tagline:"Product analytics for user behavior tracking", description:"Mixpanel tracks user actions across web and mobile with retention analysis, funnels, and AI-powered insights.", website:"https://mixpanel.com", pricing_model:"freemium", is_featured:false, africa_friendly:false, rating:4.4, review_count:3214, tags:["free","pro"], scores:{ease_of_use:7.5,value_for_money:8.0,feature_depth:8.5,support_quality:8.0,integration_richness:9.0,ai_capability:7.5}, pricing:[{tier_name:"Free",price_monthly:0,is_free_tier:true,features:["20M monthly events"]},{tier_name:"Growth",price_monthly:28,is_popular:true,features:["Unlimited saved reports"]}] },
];

const AUTHORS = [
  { name:"Sarah Chen",     slug:"sarah-chen",     avatar:"https://ui-avatars.com/api/?name=Sarah+Chen&size=128&background=6366f1&color=fff&bold=true",   role:"AI Tools Editor",    bio:"Former PM at Notion. Writing about tools that power modern work." },
  { name:"Emeka Okonkwo",  slug:"emeka-okonkwo",  avatar:"https://ui-avatars.com/api/?name=Emeka+Okonkwo&size=128&background=059669&color=fff&bold=true", role:"SaaS Analyst",        bio:"Building and writing about SaaS from Lagos. Focus on Africa-friendly tools." },
  { name:"Alex Rivera",    slug:"alex-rivera",    avatar:"https://ui-avatars.com/api/?name=Alex+Rivera&size=128&background=dc2626&color=fff&bold=true",   role:"Automation Expert",   bio:"Zapier-certified expert helping teams automate boring work since 2019." },
  { name:"Maya Patel",     slug:"maya-patel",     avatar:"https://ui-avatars.com/api/?name=Maya+Patel&size=128&background=7c3aed&color=fff&bold=true",    role:"Design Tools Lead",   bio:"Designer turned writer. Covering AI design tools and creative workflows." },
  { name:"FutureStack AI", slug:"futurestack-ai", avatar:"https://ui-avatars.com/api/?name=FS+AI&size=128&background=0ea5e9&color=fff&bold=true",         role:"AI Writer",           bio:"AI-powered editorial engine monitoring the AI tool ecosystem 24/7." },
];

const ARTICLES = [
  { slug:"best-ai-tools-freelancers-2026",  title:"The 15 Best AI Tools for Freelancers in 2026",                   excerpt:"From writing to invoicing — the AI tools that actually save freelancers time and money this year.", category:"ai-tools", featured:true, reading_time:10, tags:["freelancer","productivity"], author:"Emeka Okonkwo", content:"## The Freelancer AI Stack That's Winning in 2026\n\nFreelancing has always been about doing more with less. In 2026, the freelancers pulling ahead aren't working harder — they're working with better AI tools.\n\n### 1. ChatGPT — Writing + Research\nStill the backbone of most freelance workflows. Use it for first drafts, research synthesis, client communication, and idea generation.\n\n### 2. Claude — Long-Form Analysis\nWhere ChatGPT drafts, Claude thinks. Use it for long documents, complex client briefs, and anything requiring nuanced reasoning.\n\n### 3. Cursor — Development\nIf you do any coding work, Cursor is non-negotiable. It understands your entire codebase and handles multi-file edits.\n\n### 4. ElevenLabs — Audio Content\nNarrate your portfolio pieces, create client-ready audio content, or produce a podcast — all without a recording studio.\n\n### 5. Canva AI — Visual Content\nGenerate on-brand images, presentations, and social posts faster than ever." },
  { slug:"ai-tools-saas-founders-2026",     title:"The AI Stack Every SaaS Founder Needs in 2026",                 excerpt:"Ship faster, market smarter, support better — the exact tools top founders use to run lean SaaS businesses.", category:"ai-tools", featured:true, reading_time:8, tags:["saas","founder","startup"], author:"Sarah Chen", content:"## Build Faster. Sell Smarter. Scale Leaner.\n\nSaaS founders are fighting on two fronts: building a product fast enough to matter, and marketing it on a budget that's never big enough. AI has changed the math.\n\n### The Build Stack\n**Cursor + Claude** is the combination dominating solo founder setups. Many founders report shipping 3-4x faster than before AI tools.\n\n**v0 by Vercel** turns UI ideas into production-ready React components in seconds.\n\n### The Marketing Stack\n**Copy.ai GTM Workflows** automate your entire content pipeline.\n\n**Surfer SEO** ensures your content actually ranks.\n\n### The Support Stack\n**Fireflies AI** records and transcribes every user call automatically. Your entire product discovery becomes searchable." },
  { slug:"cursor-vs-copilot-2026",          title:"Cursor vs GitHub Copilot: Which AI Coding Tool Wins in 2026?",  excerpt:"We tested both for 30 days on real projects. Here's the honest verdict.", category:"comparisons", featured:false, reading_time:7, tags:["coding","comparison"], author:"Alex Rivera", content:"## Cursor vs GitHub Copilot: Honest Verdict After 30 Days\n\n### What Cursor Does Differently\nCursor understands your entire codebase. Multi-file edits happen with one natural language command.\n\n### Where GitHub Copilot Wins\nCopilot lives inside VS Code — your existing IDE. Zero setup friction. Copilot's inline completions are also faster.\n\n### The Verdict\n**Use Cursor if:** You do full-stack development, work across multiple files, or are a solo founder.\n\n**Use Copilot if:** You're in a large engineering team on VS Code, or primarily need autocomplete." },
  { slug:"elevenlabs-complete-guide-2026",  title:"ElevenLabs 2026: The Complete Guide for Content Creators",      excerpt:"Voice cloning, multilingual content, and API integrations — everything you need to know.", category:"ai-tools", featured:false, reading_time:8, tags:["audio","voice","content-creation"], author:"Maya Patel", content:"## ElevenLabs is Now the Default for Voice Content\n\nIn 2026, creating audio content without ElevenLabs is like building a website without a framework.\n\n### Voice Cloning Has Matured\nThe Clone feature now requires just 1 minute of clean audio.\n\n**Practical applications:**\n- YouTube channels: Narrate in your own voice without recording\n- Podcasts: Fix audio mistakes with text edits\n- International content: Clone your voice in 29 languages\n\n### The Creator Tier Sweet Spot\nAt $22/month, the Creator plan gives you 100K characters — roughly 80 minutes of narration." },
  { slug:"zapier-vs-make-2026",             title:"Zapier vs Make in 2026: The Honest Comparison",                 excerpt:"After testing both on real client workflows, here's which automation tool to pick and when.", category:"comparisons", featured:false, reading_time:9, tags:["automation","zapier","make"], author:"Alex Rivera", content:"## Zapier vs Make: Stop Guessing, Start Automating\n\n### Zapier: The Safe Choice\n**Who it's for:** Non-technical users, small teams, anyone who wants automation 'just to work.'\n\nZapier's 7000+ app library is unmatched. The interface is clean.\n\n### Make: The Power User's Choice\n**Who it's for:** Agencies, developers, operations teams with complex requirements.\n\nMake's visual flow builder shows you exactly how data moves through your automation.\n\nCost is Make's superpower: 10K operations/month for $9.\n\n### n8n: The Third Option\nIf you can self-host, n8n is worth serious consideration. Free forever, 400+ integrations, and AI nodes." },
  { slug:"ai-news-africa-tools-2026",       title:"The Best AI Tools for African Freelancers and Founders",        excerpt:"Not all AI tools work equally across Africa. Here's what's accessible, affordable, and worth your money.", category:"ai-tools", featured:true, reading_time:10, tags:["africa","freelancer","accessibility"], author:"Emeka Okonkwo", content:"## Building with AI from Africa in 2026\n\nThe AI tool landscape was built for Silicon Valley. But in 2026, a growing number of tools work well for African freelancers and founders.\n\n### The Payment Barrier\nMost AI tools accept Visa and Mastercard — accessible across Africa through virtual cards from Chipper Cash, Eversend, and Grey Finance.\n\n### Top Africa-Friendly AI Tools\n- **ChatGPT** — Available, functional, and the free tier is genuinely useful.\n- **Claude** — Accessible via web and API.\n- **Canva** — Works excellently in Africa. One of the most generous free tiers.\n- **ElevenLabs** — International card support.\n- **Make.com** — 1000 free operations/month with no credit card required.\n- **Fathom AI** — Free meeting recorder that works on any internet connection.\n\n### The Opportunity\nAfrican freelancers who master these tools command global rates while benefiting from local cost of living." },
  { slug:"midjourney-v7-review",            title:"Midjourney V7 Review: Is It Worth Upgrading?",                  excerpt:"After 30 days with Midjourney V7, here's our honest verdict on what changed and whether it matters.", category:"ai-tools", featured:false, reading_time:7, tags:["design","midjourney","image-generation"], author:"Maya Patel", content:"## Midjourney V7: 30-Day Verdict\n\n### What Actually Changed\n**Draft Mode** is the headline feature. Generate a rough image in 8 seconds, iterate, then upscale when you've nailed the composition.\n\n**Personalization** works better now. After training on 50 reference images, V7 generates closer to your aesthetic.\n\n**Text in images** is dramatically improved. V7 handles short text with ~85% accuracy.\n\n### V6 vs V7 Quality\nHonest take: V7 wins on realism and photography. V6 wins on artistic abstraction.\n\n**Bottom line:** Upgrade. The Draft Mode alone justifies it for professional users." },
  { slug:"stack-builder-guide-agencies",    title:"How Top Agencies Build AI Tool Stacks for Clients",              excerpt:"The methodology behind building AI stacks that solve real problems — not just impressive tool lists.", category:"tutorials", featured:false, reading_time:11, tags:["agencies","stack-builder","workflow"], author:"Sarah Chen", content:"## Building AI Stacks That Actually Work\n\nMost 'AI tool stacks' are just lists. The best ones are engineered workflows where each tool solves a specific problem.\n\n### The Stack Design Methodology\n**Step 1: Map the Pain** — Document exactly where time and money are being lost.\n\n**Step 2: Identify the Output Format** — Every tool needs to output in a format the next tool can consume.\n\n**Step 3: Start With One Workflow** — Pick the single workflow that costs the most time or money.\n\n### The Agency Content Stack (Tested)\n1. **ChatGPT** → Research brief and outline\n2. **Claude** → First draft from outline\n3. **Surfer SEO** → Optimization scoring\n4. **Grammarly** → Quality check\n5. **Canva** → Social graphics from content\n6. **Zapier** → Publish to all channels\n\nTime to produce one SEO article: 45 minutes (down from 8 hours)." },
];

const STACKS = [
  { slug:"content-creator-pro",   name:"Content Creator Pro Stack",    description:"The ultimate AI toolkit for content creators.", target_role:"freelancer",   category:"content",     clone_count:2341, rating:4.9, featured:true,  tools:["chatgpt","claude","midjourney","elevenlabs","canva","opus-clip"] },
  { slug:"agency-operations",      name:"Agency Operations Stack",       description:"Run your agency on autopilot. Client delivery, reporting — automated.", target_role:"agency", category:"operations", clone_count:1876, rating:4.8, featured:true,  tools:["notion-ai","zapier","make","jasper-ai","surfer-seo","fireflies-ai"] },
  { slug:"saas-founder-bootstrap", name:"SaaS Founder Bootstrap Stack",  description:"Ship your MVP with minimal budget.", target_role:"saas-founder", category:"startup", clone_count:1543, rating:4.8, featured:true,  tools:["cursor","claude","v0-vercel","zapier","chatgpt","github-copilot"] },
  { slug:"developer-productivity", name:"Developer Productivity Stack",  description:"The AI tools top engineers use to 10x output.", target_role:"saas-founder", category:"development", clone_count:987, rating:4.7, featured:false, tools:["cursor","github-copilot","claude","v0-vercel","perplexity-ai"] },
  { slug:"africa-friendly-stack",  name:"Africa-Optimized AI Stack",    description:"The best AI tools for African freelancers — accessible, affordable, and reliable.", target_role:"freelancer", category:"general", clone_count:1234, rating:4.8, featured:true, tools:["chatgpt","canva","elevenlabs","otter-ai","grammarly-go","make"] },
  { slug:"video-production-ai",    name:"Video Production AI Stack",    description:"Create professional video content without a production team.", target_role:"agency", category:"video", clone_count:543, rating:4.6, featured:false, tools:["runway-ml","descript","opus-clip","elevenlabs","canva","invideo-ai"] },
  { slug:"freelance-writer-ai",    name:"Freelance Writer AI Stack",    description:"Write faster, rank higher, earn more.", target_role:"freelancer", category:"writing", clone_count:654, rating:4.7, featured:false, tools:["chatgpt","claude","grammarly-go","surfer-seo","quillbot","notion-ai"] },
  { slug:"creative-agency-design", name:"Creative Agency Design Stack", description:"AI-powered design workflow for teams.", target_role:"agency", category:"design", clone_count:754, rating:4.6, featured:false, tools:["midjourney","canva","elevenlabs","runway-ml","figma-ai"] },
];

// ── SEED ──────────────────────────────────────────────────────────────────────

async function seedTools() {
  console.log(`\n🔧 Seeding ${TOOLS.length} tools… (images: ${SKIP_IMAGES ? "clearbit/avatars" : "WaveSpeed AI"})`);
  const toolMap = {};
  let imgCount = 0;

  for (let i = 0; i < TOOLS.length; i++) {
    const t = TOOLS[i];
    process.stdout.write(`  [${String(i+1).padStart(3)}/${TOOLS.length}] ${t.name.padEnd(22)} `);
    let logo = SKIP_IMAGES ? null : await generateImage(t.name, t.category);
    if (logo) imgCount++;
    if (!logo) logo = logoFallback(t.name, t.website);
    try {
      const { rows } = await pool.query(
        `INSERT INTO tools (name,slug,tagline,description,logo,website,website_url,category,pricing_model,pricing_details,has_free,africa_friendly,rating,review_count,tags,is_featured,is_verified,is_new,status,upvote_count,save_count)
         VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,$16,'active',$17,$18)
         ON CONFLICT(slug) DO UPDATE SET logo=EXCLUDED.logo,tagline=EXCLUDED.tagline,description=EXCLUDED.description,rating=EXCLUDED.rating,is_featured=EXCLUDED.is_featured,africa_friendly=EXCLUDED.africa_friendly
         RETURNING id,slug`,
        [t.name,t.slug,t.tagline,t.description,logo,t.website,t.category,t.pricing_model,JSON.stringify(t.pricing||[]),t.pricing_model==="freemium",t.africa_friendly,t.rating,t.review_count,t.tags||[],t.is_featured,(t.tags||[]).includes("new"),Math.floor(Math.random()*800+50),Math.floor(Math.random()*500+20)],
      );
      toolMap[t.slug] = rows[0].id;
      process.stdout.write(`✅\n`);
    } catch(e) { process.stdout.write(`❌ ${e.message}\n`); }
  }
  ok(`${Object.keys(toolMap).length} tools (${imgCount} AI images)`);
  return toolMap;
}

async function seedScores(toolMap) {
  console.log("\n⭐ Seeding tool scores…");
  let n = 0;
  for (const t of TOOLS) {
    if (!toolMap[t.slug] || !t.scores) continue;
    try {
      await pool.query(
        `INSERT INTO tool_scores (tool_id,ease_of_use,value_for_money,feature_depth,support_quality,integration_richness,ai_capability)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(tool_id) DO UPDATE SET ease_of_use=$2,value_for_money=$3,feature_depth=$4,support_quality=$5,integration_richness=$6,ai_capability=$7`,
        [toolMap[t.slug],t.scores.ease_of_use,t.scores.value_for_money,t.scores.feature_depth,t.scores.support_quality,t.scores.integration_richness,t.scores.ai_capability],
      );
      n++;
    } catch(e) { warn(`Score for ${t.slug}: ${e.message}`); }
  }
  ok(`${n} tool scores`);
}

async function seedPricing(toolMap) {
  console.log("\n💰 Seeding tool pricing…");
  let n = 0;
  for (const t of TOOLS) {
    if (!toolMap[t.slug] || !t.pricing?.length) continue;
    await pool.query(`DELETE FROM tool_pricing WHERE tool_id=$1`,[toolMap[t.slug]]).catch(()=>{});
    for (const p of t.pricing) {
      try {
        await pool.query(
          `INSERT INTO tool_pricing (tool_id,tier_name,price_monthly,features,is_popular,is_free_tier) VALUES ($1,$2,$3,$4,$5,$6)`,
          [toolMap[t.slug],p.tier_name,p.price_monthly||null,JSON.stringify(p.features||[]),p.is_popular||false,p.is_free_tier||false],
        );
        n++;
      } catch(e) { warn(`Pricing ${t.slug}/${p.tier_name}: ${e.message}`); }
    }
  }
  ok(`${n} pricing tiers`);
}

async function seedAlternatives(toolMap) {
  console.log("\n🔁 Seeding alternatives…");
  const pairs=[["chatgpt","claude",0.9],["claude","gemini",0.75],["cursor","github-copilot",0.85],["cursor","codeium",0.7],["zapier","make",0.88],["zapier","n8n",0.75],["midjourney","leonardo-ai",0.8],["elevenlabs","murf-ai",0.75],["elevenlabs","playht",0.8],["runway-ml","pika-labs",0.8],["otter-ai","fireflies-ai",0.9],["otter-ai","fathom-ai",0.85],["lovable","bolt-ai",0.85],["perplexity-ai","chatgpt",0.65]];
  let n=0;
  for (const [a,b,score] of pairs) {
    const aId=toolMap[a],bId=toolMap[b];
    if(!aId||!bId) continue;
    for (const [from,to] of [[aId,bId],[bId,aId]]) {
      try { await pool.query(`INSERT INTO tool_alternatives(tool_id,alternative_id,similarity_score) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[from,to,score]); n++; }
      catch(e) { warn(e.message); }
    }
  }
  ok(`${n} alternative pairs`);
}

async function seedAuthors() {
  console.log("\n👤 Seeding authors…");
  const map={};
  for (const a of AUTHORS) {
    const { rows } = await pool.query(`INSERT INTO authors(name,slug,avatar,role,bio) VALUES($1,$2,$3,$4,$5) ON CONFLICT(slug) DO UPDATE SET avatar=EXCLUDED.avatar RETURNING id,name`,[a.name,a.slug,a.avatar,a.role,a.bio]);
    map[a.name]=rows[0].id;
  }
  ok(`${Object.keys(map).length} authors`);
  return map;
}

async function seedCategories() {
  const { rows } = await pool.query(`SELECT id,slug FROM categories`);
  const map={};
  for (const r of rows) map[r.slug]=r.id;
  return map;
}

async function seedArticles(authorMap, catMap) {
  console.log("\n📰 Seeding articles…");
  const imgs=["1677442135703-1787eea5ce01","1620712943543-bcc4688e7485","1518770660439-4636190af475","1531297484001-80022131f5a1","1550751827-4bd374c3f58b","1485827404703-89b55fcc595e","1510915228919-c4e975ebcef7","1581091226825-a6a2a5aee158"];
  let n=0;
  for (let i=0;i<ARTICLES.length;i++) {
    const a=ARTICLES[i];
    const hero=`https://images.unsplash.com/photo-${imgs[i%imgs.length]}?w=1200&h=630&fit=crop&auto=format`;
    const catId=catMap[a.category]||null;
    const authorId=authorMap[a.author]||null;
    try {
      await pool.query(
        `INSERT INTO articles(slug,title,excerpt,content,hero_image,cover_image_url,meta_description,seo_title,seo_description,category_id,author_id,status,is_featured,is_ai_generated,reading_time,word_count,view_count,like_count,tags,published_at)
         VALUES($1,$2,$3,$4,$5,$5,$3,$2,$3,$6,$7,'published',$8,false,$9,$10,$11,$12,$13,now() - (random()*14||' days')::interval)
         ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,hero_image=EXCLUDED.hero_image,is_featured=EXCLUDED.is_featured`,
        [a.slug,a.title,a.excerpt,a.content,hero,catId,authorId,a.featured||false,a.reading_time||5,Math.round((a.content||"").split(/\s+/).length),Math.floor(Math.random()*8000+500),Math.floor(Math.random()*400+20),a.tags||[]],
      );
      n++;
    } catch(e) { warn(`Article ${a.slug}: ${e.message}`); }
  }
  ok(`${n} articles`);
}

async function seedStacks(toolMap) {
  console.log("\n📦 Seeding stacks…");
  let n=0;
  for (const s of STACKS) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO stacks(slug,name,description,target_role,category,clone_count,rating,featured)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description RETURNING id`,
        [s.slug,s.name,s.description,s.target_role,s.category,s.clone_count,s.rating,s.featured||false],
      );
      const stackId=rows[0].id;
      await pool.query(`DELETE FROM stack_tools WHERE stack_id=$1`,[stackId]);
      for (let pos=0;pos<(s.tools||[]).length;pos++) {
        const toolId=toolMap[s.tools[pos]];
        if(toolId) await pool.query(`INSERT INTO stack_tools(stack_id,tool_id,position) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[stackId,toolId,pos]).catch(()=>{});
      }
      n++;
    } catch(e) { warn(`Stack ${s.slug}: ${e.message}`); }
  }
  ok(`${n} stacks`);
}

async function updateCounts(toolMap) {
  const counts={};
  for (const t of TOOLS) counts[t.category]=(counts[t.category]||0)+1;
  for (const [id,count] of Object.entries(counts)) {
    await pool.query(`UPDATE tool_categories SET count=$1 WHERE id=$2`,[count,id]).catch(()=>{});
  }
  ok("Category counts updated");
}

async function main() {
  console.log("\n🌱 FutureStack — PostgreSQL Seed");
  console.log("═".repeat(50));
  console.log(`  Tools: ${TOOLS.length} | Articles: ${ARTICLES.length} | Stacks: ${STACKS.length}`);
  console.log(`  Images: ${SKIP_IMAGES ? "Clearbit/Avatars (fast)" : "WaveSpeed AI → Cloudinary"}`);
  console.log("═".repeat(50));

  const toolMap  = await seedTools();
  await seedScores(toolMap);
  await seedPricing(toolMap);
  await seedAlternatives(toolMap);
  const authorMap = await seedAuthors();
  const catMap    = await seedCategories();
  await seedArticles(authorMap, catMap);
  await seedStacks(toolMap);
  await updateCounts(toolMap);

  console.log("\n" + "═".repeat(50));
  console.log("✅ SEED COMPLETE! FutureStack is ready.");
  console.log("═".repeat(50) + "\n");
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
