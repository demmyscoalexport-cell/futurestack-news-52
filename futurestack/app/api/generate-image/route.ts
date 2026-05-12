import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndUpload, buildImagePrompt } from "@/lib/image-gen";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.WAVESPEED_API_KEY) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY not configured" }, { status: 503 });
    }

    const { prompt, type = "tool-logo", name = "image", toolId } = await req.json();

    const { cloudinaryUrl, generatedUrl, finalUrl } = await generateAndUpload({
      type,
      name,
      customPrompt: prompt,
    });

    if (!finalUrl) {
      return NextResponse.json({ error: "Image generation failed or timed out" }, { status: 500 });
    }

    if (toolId && cloudinaryUrl) {
      await db.query(`UPDATE tools SET logo = $1 WHERE id = $2`, [cloudinaryUrl, toolId]).catch(() => {});
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
    const publicId = cloudinaryUrl
      ? `futurestack/${type}s/${slug}`
      : null;

    return NextResponse.json({ success: true, url: finalUrl, cloudinaryUrl, generatedUrl, publicId });
  } catch (error: unknown) {
    console.error("[generate-image]", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    wavespeed: !!process.env.WAVESPEED_API_KEY,
    cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "dxizihlmo",
  });
}
