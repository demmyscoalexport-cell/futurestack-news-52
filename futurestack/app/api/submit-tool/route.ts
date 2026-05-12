import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      url,
      tagline,
      description,
      logo,
      category,
      tags,
      best_for,
      pricingTiers,
      integrations,
      contactEmail,
      contactName,
      applyForFeatured,
    } = body;

    if (!name || !url || !tagline || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const hasFree = pricingTiers?.some(
      (t: { price?: string }) => t.price === "$0" || t.price === "Free",
    ) ?? false;

    const tagsArray = tags
      ? tags.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    await db.query(
      `INSERT INTO tools (
        name, slug, tagline, description, logo, website, website_url,
        category, tags, has_free, status, is_featured, pricing_model, pricing_details
      ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,'pending',false,$10,$11)
      ON CONFLICT (slug) DO UPDATE SET
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        status = 'pending'`,
      [
        name, slug, tagline, description || tagline, logo || null, url,
        category || "productivity", tagsArray, hasFree,
        hasFree ? "freemium" : "paid",
        JSON.stringify({
          tiers: pricingTiers || [],
          best_for: best_for || [],
          integrations: integrations?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
          submitted_by: { name: contactName, email: contactEmail },
          apply_for_featured: applyForFeatured || false,
        }),
      ],
    );

    return NextResponse.json({ success: true, slug, message: "Tool submitted for review!" });
  } catch (err: any) {
    console.error("Submit tool error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
