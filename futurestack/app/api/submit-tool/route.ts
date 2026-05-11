import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const supabase = await createClient();

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error } = await supabase.from("tools").insert({
      name,
      slug,
      website_url: url,
      tagline,
      description,
      logo_url: logo || null,
      status: "pending",
      pricing_type: pricingTiers?.[0]?.price === "$0" ? "free" : "freemium",
      metadata: {
        best_for,
        integrations: integrations
          ?.split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        pricing_tiers: pricingTiers,
        tags: tags
          ?.split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        submitted_by: { name: contactName, email: contactEmail },
        apply_for_featured: applyForFeatured,
      },
    });

    if (error) {
      console.error("Tool submission DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (err: any) {
    console.error("Submit tool error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
