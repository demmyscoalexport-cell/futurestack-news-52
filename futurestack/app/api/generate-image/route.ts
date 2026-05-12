import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "dxizihlmo";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "654919554582831";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "j4GLSAjjApKUgInR41eCUiQIqUo";

/** Submit a generation job and return the polling URL */
async function submitWaveSpeedJob(prompt: string): Promise<string | null> {
  if (!WAVESPEED_API_KEY) return null;
  const res = await fetch("https://api.wavespeed.ai/api/v2/wavespeed-ai/flux-schnell", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WAVESPEED_API_KEY}`,
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
  if (!res.ok) {
    console.error("[wavespeed] submit failed:", res.status, await res.text());
    return null;
  }
  const body = await res.json();
  return body?.data?.urls?.get ?? null;
}

/** Poll a WaveSpeed result URL until the job is complete (max ~30s) */
async function pollWaveSpeedResult(resultUrl: string): Promise<string | null> {
  if (!WAVESPEED_API_KEY) return null;
  const maxAttempts = 15;
  const delayMs = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3000 : delayMs));
    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${WAVESPEED_API_KEY}` },
    });
    if (!res.ok) continue;
    const body = await res.json();
    const status = body?.data?.status;
    if (status === "completed") {
      const outputs: string[] = body?.data?.outputs ?? [];
      return outputs[0] ?? null;
    }
    if (status === "failed") {
      console.error("[wavespeed] job failed:", body?.data?.error);
      return null;
    }
    // status is "created" or "running" — keep polling
  }
  console.error("[wavespeed] polling timed out");
  return null;
}

/** Generate an image with WaveSpeed (submit + poll) */
async function generateWithWaveSpeed(prompt: string): Promise<string | null> {
  const resultUrl = await submitWaveSpeedJob(prompt);
  if (!resultUrl) return null;
  return pollWaveSpeedResult(resultUrl);
}

/** Upload an image URL to Cloudinary using signed upload */
async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string | null> {
  const timestamp = Math.floor(Date.now() / 1000);

  // Signature: sorted params (exclude 'file'), then append secret
  const paramsToSign: Record<string, string> = {
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signStr =
    Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&") + CLOUDINARY_API_SECRET;

  const signature = crypto.createHash("sha1").update(signStr).digest("hex");

  const body = new URLSearchParams({
    file: imageUrl,
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: CLOUDINARY_API_KEY,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[cloudinary] upload failed:", err);
    return null;
  }
  const data = await res.json();
  return (data?.secure_url as string) ?? null;
}

/** Build the prompt based on the generation type */
function buildPrompt(type: string, name: string, prompt?: string): string {
  if (type === "tool-logo") {
    return `Minimalist professional SaaS app icon for "${name}". Flat vector design, bold geometric shapes, clean lines, white background, single strong color accent, no text, no letters. Modern tech brand mark suitable for app store. High contrast, professional product branding.`;
  }
  if (type === "article-hero") {
    return `Professional editorial tech illustration for article: "${prompt ?? name}". Dark background, electric blue and purple accent colors, abstract geometric patterns, futuristic AI technology aesthetic, 16:9 ratio, magazine cover quality, cinematic lighting.`;
  }
  return prompt ?? name;
}

// POST /api/generate-image — generate a single image
export async function POST(req: NextRequest) {
  try {
    const { prompt, type = "tool-logo", name = "image", toolId } = await req.json();

    if (!WAVESPEED_API_KEY) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY not configured" }, { status: 503 });
    }

    const finalPrompt = buildPrompt(type, name, prompt);

    // Generate with WaveSpeed
    const generatedUrl = await generateWithWaveSpeed(finalPrompt);
    if (!generatedUrl) {
      return NextResponse.json({ error: "Image generation failed or timed out" }, { status: 500 });
    }

    // Upload to Cloudinary
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
    const publicId = `futurestack/${type}s/${slug}-${Date.now()}`;
    const cloudinaryUrl = await uploadToCloudinary(generatedUrl, publicId);
    const finalUrl = cloudinaryUrl ?? generatedUrl;

    // If toolId provided, update the tool's logo in DB
    if (toolId && cloudinaryUrl) {
      await db.query(`UPDATE tools SET logo = $1 WHERE id = $2`, [cloudinaryUrl, toolId]).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      cloudinaryUrl,
      generatedUrl,
      publicId: cloudinaryUrl ? publicId : null,
    });
  } catch (error: unknown) {
    console.error("[generate-image]", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

// GET /api/generate-image — status check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    wavespeed: !!WAVESPEED_API_KEY,
    cloudinary: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
    cloudName: CLOUDINARY_CLOUD_NAME,
  });
}
