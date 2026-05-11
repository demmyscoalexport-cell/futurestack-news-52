import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  Star,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  BookmarkPlus,
  Zap,
} from "lucide-react";
import { AskAIWidget } from "@/components/tool/ask-ai-widget";
import { FreelancerTrustSignals } from "@/components/tool/freelancer-trust-signals";
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
    title: `${resolved.name} Reviews, Pricing & Info | FutureStack News`,
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
    url: `https://futurestack.news/tools/${tool.slug}`,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* 4. Layout: 2-column (content left 2/3, sidebar right 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-2 space-y-12">
            {/* Tool Hero Section */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  {tool.logo ? (
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tool.logo as string}
                        alt={tool.name as string}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-500 shrink-0">
                      {tool.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {tool.name}
                      {tool.is_featured && (
                        <ShieldCheck className="w-6 h-6 text-indigo-500" />
                      )}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                      {tool.short_description || tool.tagline}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {tool.tool_categories?.name || "Category"}
                      </span>
                      {tool.has_free && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Free Tier Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col w-full md:w-auto gap-3 shrink-0">
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                  <button className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors">
                    <BookmarkPlus className="w-4 h-4" />
                    Save Tool
                  </button>
                </div>
              </div>
            </section>

            {/* AI Summary Section */}
            <section className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">
                  AI Summary
                </h3>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiSummary}
              </p>
            </section>

            {/* General Description */}
            <section className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-xl font-bold mb-4">About {tool.name}</h2>
              <p>{tool.description}</p>
            </section>

            {/* FutureStack Scorecard */}
            <section>
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                FutureStack Scorecard
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tool.tool_scores &&
                  Object.entries({
                    "Ease of Use": tool.tool_scores.ease_of_use,
                    Value: tool.tool_scores.value_for_money,
                    Features: tool.tool_scores.feature_depth,
                    Support: tool.tool_scores.support_quality,
                    Integrations: tool.tool_scores.integration_richness,
                    "AI Power": tool.tool_scores.ai_capability,
                  }).map(([label, score]) => (
                    <div
                      key={label}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        {label}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {Number(score).toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 mb-1">/10</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(Number(score) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* User Reviews */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  User Reviews
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm px-2 py-0.5 rounded-full">
                    {tool.reviews?.length || 0}
                  </span>
                </h2>
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                  Write a Review
                </button>
              </div>

              <div className="space-y-4">
                {tool.reviews?.length > 0 ? (
                  tool.reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            {review.profiles?.avatar_url && (
                              <img
                                src={review.profiles.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {review.profiles?.full_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-3">
                        {review.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500">
                      No reviews yet. Be the first to share your experience!
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Changelog Timeline */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Recent Updates
              </h2>
              <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-5 relative">
                {tool.tool_changelogs?.length > 0 ? (
                  tool.tool_changelogs.map((log: any) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[27px] mt-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-950" />
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {log.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {log.version || log.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {log.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No recent updates tracked.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Pricing Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Pricing Plans
                </h3>
              </div>
              <div className="p-1">
                {tool.tool_pricing?.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tool.tool_pricing.map((tier: any) => (
                      <div key={tier.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {tier.tier_name}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {tier.price_monthly
                              ? `$${tier.price_monthly}/mo`
                              : "Free"}
                          </span>
                        </div>
                        {tier.features && tier.features.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {tier.features
                              .slice(0, 3)
                              .map((feat: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="text-xs text-slate-500 flex items-start gap-2"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  {feat}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Pricing details not currently available.
                  </div>
                )}
              </div>
            </div>

            {/* In These Stacks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                Featured In Stacks
              </h3>
              <div className="space-y-3">
                <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 hover:border-indigo-200 transition-colors cursor-pointer group">
                  <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    The Ultimate Founder Stack
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    by FutureStack <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
                <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 hover:border-indigo-200 transition-colors cursor-pointer group">
                  <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Growth Hacker Toolkit
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    by @marketer <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </div>

            {/* Freelancer Trust Signals */}
            <FreelancerTrustSignals tool={tool} />

            {/* Ask AI Widget */}
            <AskAIWidget tool={tool} />
          </div>
        </div>
      </div>
    </div>
  );
}
