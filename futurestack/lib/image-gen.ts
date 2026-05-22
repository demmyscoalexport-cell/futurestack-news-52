/**
 * Shared WaveSpeed + Cloudinary image generation utility.
 * Import this directly in API routes — do NOT call /api/generate-image via HTTP.
 */
import crypto from "crypto";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY_VAL = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** Submit a WaveSpeed flux-schnell job and return the polling URL */
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
  if (!res.ok) return null;
  const body = await res.json();
  return (body?.data?.urls?.get as string) ?? null;
}

/** Poll a WaveSpeed result URL until complete — max ~30 s */
async function pollWaveSpeedResult(resultUrl: string): Promise<string | null> {
  if (!WAVESPEED_API_KEY) return null;
  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3000 : 2000));
    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${WAVESPEED_API_KEY}` },
    });
    if (!res.ok) continue;
    const body = await res.json();
    const status = body?.data?.status as string | undefined;
    if (status === "completed") {
      const outputs: string[] = body?.data?.outputs ?? [];
      return outputs[0] ?? null;
    }
    if (status === "failed") return null;
  }
  return null;
}

/** Generate an image with WaveSpeed (submit + poll) */
export async function generateWithWaveSpeed(prompt: string): Promise<string | null> {
  const resultUrl = await submitWaveSpeedJob(prompt);
  if (!resultUrl) return null;
  return pollWaveSpeedResult(resultUrl);
}

/** Upload a remote image URL to Cloudinary using signed upload */
export async function uploadToCloudinary(
  imageUrl: string,
  publicId: string,
): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY_VAL || !CLOUDINARY_API_SECRET) {
    return null;
  }
  const timestamp = Math.floor(Date.now() / 1000);
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
    api_key: CLOUDINARY_API_KEY_VAL,
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
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.secure_url as string) ?? null;
}

/** Build a contextual prompt based on generation type */
export function buildImagePrompt(
  type: "tool-logo" | "article-hero" | string,
  name: string,
  customPrompt?: string,
): string {
  if (type === "tool-logo") {
    return `Minimalist professional SaaS app icon for "${name}". Flat vector design, bold geometric shapes, clean lines, white background, single strong color accent, no text, no letters. Modern tech brand mark suitable for app store. High contrast, professional product branding.`;
  }
  if (type === "article-hero") {
    return `Professional editorial tech illustration for article: "${customPrompt ?? name}". Dark background, electric blue and purple accent colors, abstract geometric patterns, futuristic AI technology aesthetic, 16:9 ratio, magazine cover quality, cinematic lighting.`;
  }
  return customPrompt ?? name;
}

/** Full pipeline: generate → upload → return Cloudinary URL (or raw URL as fallback) */
export async function generateAndUpload(opts: {
  type: "tool-logo" | "article-hero" | string;
  name: string;
  customPrompt?: string;
}): Promise<{ cloudinaryUrl: string | null; generatedUrl: string | null; finalUrl: string | null }> {
  const prompt = buildImagePrompt(opts.type, opts.name, opts.customPrompt);
  const generatedUrl = await generateWithWaveSpeed(prompt);
  if (!generatedUrl) return { cloudinaryUrl: null, generatedUrl: null, finalUrl: null };

  const slug = opts.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
  const publicId = `futurestack/${opts.type}s/${slug}-${Date.now()}`;
  const cloudinaryUrl = await uploadToCloudinary(generatedUrl, publicId);

  return {
    cloudinaryUrl,
    generatedUrl,
    finalUrl: cloudinaryUrl ?? generatedUrl,
  };
}
