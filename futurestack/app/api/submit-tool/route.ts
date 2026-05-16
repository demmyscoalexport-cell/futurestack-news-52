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
      screenshot,
      category,
      tags,
      best_for,
      pricingTiers,
      integrations,
      contactEmail,
      contactName,
      githubUrl,
      twitterHandle,
      africaFriendly,
      isOpenSource,
      applyForFeatured,
    } = body;

    if (!name || !url || !tagline || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: name, url, tagline, contactEmail" },
        { status: 400 },
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const hasFree =
      pricingTiers?.some(
        (t: { price?: string }) =>
          t.price === "$0" || t.price?.toLowerCase() === "free",
      ) ?? false;

    const tagsArray = tags
      ? tags.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const pricingModel = hasFree
      ? pricingTiers?.length > 1
        ? "freemium"
        : "free"
      : "paid";

    const submissionMeta = {
      tiers: pricingTiers || [],
      best_for: best_for || [],
      integrations: integrations
        ? integrations.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      submitted_by: {
        name: contactName,
        email: contactEmail,
        github: githubUrl || null,
        twitter: twitterHandle || null,
      },
      screenshot: screenshot || null,
      is_open_source: isOpenSource || false,
      apply_for_featured: applyForFeatured || false,
      submitted_at: new Date().toISOString(),
    };

    await db.query(
      `INSERT INTO tools (
        name, slug, tagline, description, logo, website, website_url,
        category, tags, has_free, status, is_featured, pricing_model,
        pricing_details, africa_friendly, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,'pending_review',false,$10,$11,$12,'developer')
      ON CONFLICT (slug) DO UPDATE SET
        tagline         = EXCLUDED.tagline,
        description     = EXCLUDED.description,
        status          = 'pending_review',
        pricing_details = EXCLUDED.pricing_details,
        last_updated    = CURRENT_DATE`,
      [
        name,
        slug,
        tagline,
        description || tagline,
        logo || null,
        url,
        category || "productivity",
        tagsArray,
        hasFree,
        pricingModel,
        JSON.stringify(submissionMeta),
        africaFriendly || false,
      ],
    );

    return NextResponse.json({
      success: true,
      slug,
      message: "Tool submitted for review! We'll be in touch within 48 hours.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Submit tool error:", msg);
    return NextResponse.json(
      { error: "Submission failed: " + msg },
      { status: 500 },
    );
  }
}
