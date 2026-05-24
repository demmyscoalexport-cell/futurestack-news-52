import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Zap,
} from "lucide-react";
import { AskAIWidget } from "@/components/tool/ask-ai-widget";
import { FreelancerTrustSignals } from "@/components/tool/freelancer-trust-signals";
import { ReviewsSection } from "@/components/tool/reviews-section";
import { SaveToolButton } from "@/components/tool/save-tool-button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VerifiedBadge, AfricaVerifiedBadge } from "@/components/discovery/verified-badge";
import { getToolBySlugCached } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import { resolveToolLogo } from "@/lib/logo-resolver";

export const revalidate = 3600; // 1 hour ISR

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 3. Generate dynamic OpenGraph Metadata
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("name, short_description, logo")
    .eq("slug", slug)
    .single();

  // Fall back to mock data for metadata
  const mockTool = !tool ? fallbackTools.find((t) => t.slug === slug) : null;
  const resolved = tool || mockTool;

  if (!resolved) return { title: "Tool Not Found" };

  return {
    title: `${resolved.name} Reviews, Pricing & Info | DISCOVA`,
    description:
      (resolved as { short_description?: string }).short_description ||
      (resolved as { shortDescription?: string }).shortDescription ||
      `Discover if ${resolved.name} is the right AI tool for you.`,
    openGraph: {
      title: `${resolved.name} - AI Tool Analysis`,
      images: [
        {
          url: `/api/og/tool?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `${resolved.name} UI Preview`,
        },
      ],
    },
  };
}

async function generateAISummary(toolName: string, description: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 150,
      system:
        "Summarize what this AI tool is best for in exactly 3 short, punchy sentences.",
      messages: [
        {
          role: "user",
          content: `Tool: ${toolName}\nDescription: ${description}`,
        },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch {
    return "AI-powered tool designed to increase productivity and streamline workflows. Highly rated for its modern interface and advanced reasoning models. Best suited for professionals in scalable environments.";
  }
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Try Supabase first, fall back to mock data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tool: any = null;
  try {
    tool = await getToolBySlugCached(slug);
  } catch {
    // Supabase unavailable or tool not found
  }

  // Fallback to mock data
  if (!tool) {
    const mockTool = fallbackTools.find((t) => t.slug === slug);
    if (!mockTool) return notFound();

    // Transform mock tool to match expected shape
    tool = {
      ...mockTool,
      short_description: mockTool.shortDescription,
      is_featured: false,
      has_free: mockTool.pricing.hasFree,
      tool_categories: {
        name: mockTool.category,
        id: mockTool.category,
        icon: null,
      },
      tool_scores: {
        ease_of_use: 8.5,
        value_for_money: 8.0,
        feature_depth: 9.0,
        support_quality: 7.5,
        integration_richness: 8.0,
        ai_capability: 9.0,
      },
      tool_pricing: mockTool.pricing.plans.map((p, i) => ({
        id: `mock-${i}`,
        tier_name: p.name,
        price_monthly:
          p.price === "$0" ? null : parseFloat(p.price.replace("$", "")),
        features: p.features,
      })),
      tool_changelogs: [],
      reviews: [],
      tagline: mockTool.shortDescription,
    };
  }

  if (!tool) return notFound();

  // Resolve the best available logo
  tool.logo = resolveToolLogo(tool.name, tool.logo, tool.website);

  // Generate the AI summary dynamically
  const aiSummary = await generateAISummary(
    tool.name,
    tool.description || tool.short_description || "",
  );

  // Calculate average rating
  const avgRating = tool.reviews?.length
    ? tool.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
      tool.reviews.length
    : 0;

  // 2. JSON-LD structured data (SoftwareApplication)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    operatingSystem: "Web, Platform",
    applicationCategory: "BusinessApplication",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://getdiscova.com"}/tools/${tool.slug}`,
    aggregateRating: tool.reviews?.length
      ? {
          "@type": "AggregateRating",
          ratingValue: avgRating.toFixed(1),
          reviewCount: tool.reviews.length,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: tool.has_free ? "0" : "Contact Sales",
      priceCurrency: "USD",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Tool Hero */}
              <section className="glass-panel rounded-discova-lg p-5 sm:p-6 lg:p-8 border border-neutral-stroke/60">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    {tool.logo ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-discova-lg bg-neutral-surface overflow-hidden shrink-0 flex items-center justify-center p-2 border border-neutral-stroke/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tool.logo as string} alt={tool.name as string} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-discova-lg bg-brand-primary/15 flex items-center justify-center text-xl sm:text-2xl font-bold text-brand-primary shrink-0">
                        {tool.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex flex-wrap items-center gap-2">
                        {tool.name}
                        {tool.is_featured && <VerifiedBadge />}
                      </h1>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                        {tool.short_description || tool.tagline}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium bg-neutral-surface border border-neutral-stroke text-muted-foreground capitalize">
                          {tool.tool_categories?.name || "Category"}
                        </span>
                        {tool.has_free && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Free Tier Available
                          </span>
                        )}
                        {tool.africa_friendly && <AfricaVerifiedBadge />}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
                    <a
                      href={`/api/affiliate/${tool.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-neutral-white font-medium rounded-input transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                    <SaveToolButton toolId={tool.id} toolSlug={tool.slug} />
                  </div>
                </div>
              </section>

              {/* AI Summary */}
              <section className="rounded-discova-lg p-5 sm:p-6 border border-brand-primary/20 bg-brand-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
                  <h3 className="font-semibold text-brand-lilac">AI Summary</h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{aiSummary}</p>
              </section>

              {/* Description */}
              <section className="prose prose-sm sm:prose-base prose-invert max-w-none">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">About {tool.name}</h2>
                <p className="text-muted-foreground">{tool.description}</p>
              </section>

              {/* Scorecard */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-foreground">DISCOVA Scorecard</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {tool.tool_scores &&
                    Object.entries({
                      "Ease of Use": tool.tool_scores.ease_of_use,
                      Value: tool.tool_scores.value_for_money,
                      Features: tool.tool_scores.feature_depth,
                      Support: tool.tool_scores.support_quality,
                      Integrations: tool.tool_scores.integration_richness,
                      "AI Power": tool.tool_scores.ai_capability,
                    }).map(([label, score]) => (
                      <div key={label} className="glass-panel p-3 sm:p-4 rounded-discova-lg border border-neutral-stroke/60">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">{label}</p>
                        <div className="flex items-end gap-2">
                          <span className="text-xl sm:text-2xl font-bold text-foreground">{Number(score).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground mb-1">/10</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-stroke/50 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-brand-primary rounded-full" style={{ width: `${(Number(score) / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <ReviewsSection toolId={tool.id} toolName={tool.name} initialReviews={tool.reviews ?? []} />

              {/* Changelog */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Recent Updates</h2>
                <div className="space-y-6 border-l-2 border-neutral-stroke ml-3 pl-5 relative">
                  {tool.tool_changelogs?.length > 0 ? (
                    tool.tool_changelogs.map((log: { id: string; title: string; version?: string; type?: string; published_at: string; description: string }) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[27px] mt-1 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-background" />
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                          <span className="text-sm font-semibold text-foreground">{log.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-surface border border-neutral-stroke text-muted-foreground">
                            {log.version || log.type}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(log.published_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent updates tracked.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:self-start">
              <div className="glass-panel rounded-discova-lg border border-neutral-stroke/60 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-neutral-stroke/40">
                  <h3 className="font-bold text-foreground">Pricing Plans</h3>
                </div>
                <div className="p-1">
                  {tool.tool_pricing?.length > 0 ? (
                    <div className="divide-y divide-neutral-stroke/40">
                      {tool.tool_pricing.map((tier: { id: string; tier_name: string; price_monthly?: number | null; features?: string[] }) => (
                        <div key={tier.id} className="p-4">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className="font-medium text-foreground text-sm">{tier.tier_name}</span>
                            <span className="font-bold text-foreground text-sm shrink-0">
                              {tier.price_monthly ? `$${tier.price_monthly}/mo` : "Free"}
                            </span>
                          </div>
                          {tier.features && tier.features.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {tier.features.slice(0, 3).map((feat: string, idx: number) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                                  {feat}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">Pricing details not currently available.</div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-discova-lg border border-neutral-stroke/60 p-4 sm:p-5">
                <h3 className="font-bold text-foreground mb-4">Featured In Stacks</h3>
                <div className="space-y-3">
                  {["The Ultimate Founder Stack", "Growth Hacker Toolkit"].map((name) => (
                    <Link key={name} href="/stacks" className="block p-3 border border-neutral-stroke/50 rounded-input bg-white/[0.02] hover:border-brand-primary/30 transition-colors group">
                      <p className="font-medium text-sm text-foreground group-hover:text-brand-lilac transition-colors">{name}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">by DISCOVA <ChevronRight className="w-3 h-3" /></p>
                    </Link>
                  ))}
                </div>
              </div>

              <FreelancerTrustSignals tool={tool} />
              <AskAIWidget tool={tool} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
