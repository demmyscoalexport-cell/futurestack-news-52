import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dxizihlmo";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "654919554582831";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "j4GLSAjjApKUgInR41eCUiQIqUo";

async function generateWithWaveSpeed(prompt: string): Promise<string | null> {
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

  if (!res.ok) return null;
  const body = await res.json();
  return body?.data?.outputs?.[0] || body?.outputs?.[0] || body?.images?.[0]?.url || null;
}

async function uploadToCloudinary(
  imageUrl: string,
  publicId: string
): Promise<string | null> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signStr = `file=${imageUrl}&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
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
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data?.secure_url || null;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, type = "tool-logo", name = "image" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Build contextual prompt based on type
    let finalPrompt = prompt;
    if (type === "tool-logo") {
      finalPrompt = `Minimalist professional SaaS app icon for "${name}". Flat vector design, bold geometric shapes, clean lines, white background, single strong color accent, no text, no letters. Modern tech brand mark suitable for app store. High contrast, professional product branding.`;
    } else if (type === "article-hero") {
      finalPrompt = `Professional editorial tech illustration for article: "${prompt}". Dark background, electric blue and purple accent colors, abstract geometric patterns, futuristic AI technology aesthetic, 16:9 ratio, magazine cover quality, cinematic lighting.`;
    }

    // Generate with WaveSpeed
    const generatedUrl = await generateWithWaveSpeed(finalPrompt);
    if (!generatedUrl) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    // Upload to Cloudinary
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50);
    const publicId = `futurestack/${type}s/${slug}-${Date.now()}`;
    const cloudinaryUrl = await uploadToCloudinary(generatedUrl, publicId);

    return NextResponse.json({
      success: true,
      url: cloudinaryUrl || generatedUrl,
      cloudinaryUrl,
      generatedUrl,
    });
  } catch (error: unknown) {
    console.error("generate-image error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    wavespeed: !!WAVESPEED_API_KEY,
    cloudinary: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY),
  });
}
