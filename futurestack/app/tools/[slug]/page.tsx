import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Check,
  ExternalLink,
  GalleryVerticalEnd,
  Layers3,
  PlayCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { AskAIWidget } from "@/components/tool/ask-ai-widget";
import { HeroVisualCarousel } from "@/components/tool/hero-visual-carousel";
import { ReviewsSection } from "@/components/tool/reviews-section";
import { SaveToolButton } from "@/components/tool/save-tool-button";
import { ScreenshotGallery } from "@/components/tool/screenshot-gallery";
import { ToolAlternativeCard } from "@/components/tool/tool-alternative-card";
import { ToolFaqAccordion } from "@/components/tool/tool-faq-accordion";
import { ToolMetadataRow } from "@/components/tool/tool-metadata-row";
import { ToolShareButton } from "@/components/tool/tool-share-button";
import { VerificationPanel } from "@/components/tool/verification-panel";
import { YoutubeLearningCenter } from "@/components/tool/youtube-learning-center";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VerifiedBadge, AfricaVerifiedBadge } from "@/components/discovery/verified-badge";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import { getToolBySlugCached, getTools } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { buildToolMetadata } from "@/lib/tool/seo";
import { buildToolPageSchemas } from "@/lib/tool/structured-data";
import {
  fieldBool,
  fieldString,
  getAiSummaries,
  getAlternatives,
  getAudience,
  getCategoryLabel,
  getCons,
  getFaqs,
  getFeatures,
  getGalleryItems,
  getIsVerified,
  getLongDescriptionSections,
  getPricingLabel,
  getPros,
  getToolDescription,
  getToolName,
  getToolSlug,
  getToolSummary,
  getToolWebsite,
  getUseCases,
  getVideos,
  type ToolRecord,
} from "@/lib/tool-intelligence";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const tool = await loadTool(slug);

  if (!tool) return { title: "Tool Not Found" };
  return buildToolMetadata(tool);
}

async function loadTool(slug: string): Promise<ToolRecord | null> {
  try {
    const tool = await getToolBySlugCached(slug);
    if (tool) return tool as ToolRecord;
  } catch {
    // Static fallback below keeps preview builds useful without Supabase.
  }
  const mockTool = fallbackTools.find((item) => item.slug === slug);
  if (!mockTool) return null;
  return {
    ...mockTool,
    short_description: mockTool.shortDescription,
    has_free: mockTool.pricing.hasFree,
    pricing_model: mockTool.pricing.hasFree ? "freemium" : "paid",
    website_url: mockTool.website,
    tool_pricing: mockTool.pricing.plans.map((plan, index) => ({
      id: `mock-${index}`,
      tier_name: plan.name,
      price_monthly: plan.price === "$0" ? null : Number.parseFloat(plan.price.replace("$", "")),
      features: plan.features,
    })),
    reviews: [],
    alternatives: [],
  };
}

function normalizeReviews(value: unknown): Array<{
  id: string;
  user_name: string;
  rating: number;
  content: string;
  location: string | null;
  created_at: string;
  profiles?: { avatar_url?: string; full_name?: string } | null;
}> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      id: fieldString(row, ["id"], `review-${index}`),
      user_name: fieldString(row, ["user_name", "userName"], "Anonymous"),
      rating: typeof row.rating === "number" ? row.rating : 0,
      content: fieldString(row, ["content"], ""),
      location: fieldString(row, ["location"]) || null,
      created_at: fieldString(row, ["created_at", "createdAt"], "2026-01-01T00:00:00.000Z"),
      profiles: null,
    }];
  });
}

function PricingPanel({ tool }: { tool: ToolRecord }) {
  const raw: unknown[] = Array.isArray(tool.tool_pricing) ? tool.tool_pricing : [];
  const rows = raw.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      id: fieldString(row, ["id"], `pricing-${index}`),
      name: fieldString(row, ["tier_name", "name"], getPricingLabel(tool)),
      price: typeof row.price_monthly === "number" ? `$${row.price_monthly}/mo` : "Free or custom",
      features: Array.isArray(row.features) ? row.features.map(String).slice(0, 4) : [],
    }];
  });

  return (
    <section className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/70">
      <div className="border-b border-neutral-stroke p-5">
        <h2 className="text-lg font-bold text-foreground">Pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">{getPricingLabel(tool)}</p>
      </div>
      <div className="divide-y divide-neutral-stroke">
        {rows.length > 0 ? rows.map((tier) => (
          <div key={tier.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold text-foreground">{tier.name}</p>
              <p className="text-sm font-bold text-brand-lilac">{tier.price}</p>
            </div>
            <ul className="mt-3 space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-lilac" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )) : (
          <p className="p-5 text-sm text-muted-foreground">Pricing details are tracked by DISCOVA and should be confirmed on the official website.</p>
        )}
      </div>
    </section>
  );
}

function ToolLogo({ tool }: { tool: ToolRecord }) {
  const name = getToolName(tool);
  const logo = typeof tool.logo === "string" ? tool.logo : "";
  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-neutral-stroke bg-white p-2 shadow-xl">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={`${name} logo`} className="h-full w-full object-contain" />
      ) : (
        <span className="text-3xl font-bold text-brand-primary">{name[0]}</span>
      )}
    </div>
  );
}

function SectionShell({ id, title, subtitle, children }: { id?: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const loadedTool = await loadTool(slug);
  if (!loadedTool) return notFound();

  const tool: ToolRecord = {
    ...loadedTool,
    logo: resolveToolLogo(getToolName(loadedTool), loadedTool.logo, getToolWebsite(loadedTool)),
  };
  const name = getToolName(tool);
  const toolSlug = getToolSlug(tool);
  const videos = getVideos(tool);
  const gallery = getGalleryItems(tool);
  const faqs = getFaqs(tool);
  const reviews = normalizeReviews(tool.reviews);
  const alternatives = getAlternatives(tool);
  const category = fieldString(tool, ["category"], "");
  const altSlugs = new Set(alternatives.map((item) => item.slug));
  const relatedTools = await getTools({ category, limit: 10 });
  const related = relatedTools
    .filter((item) => {
      const slug = typeof item.slug === "string" ? item.slug : "";
      return slug && slug !== toolSlug && !altSlugs.has(slug);
    })
    .slice(0, 3) as ToolRecord[];
  const jsonLd = buildToolPageSchemas(tool);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <JsonLd data={jsonLd} />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-neutral-stroke">
          <div className="absolute inset-0 hero-glow" />
          <div className="container relative mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <ToolLogo tool={tool} />
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {getIsVerified(tool) && <VerifiedBadge size="md" />}
                      {fieldBool(tool, ["africa_friendly"]) && <AfricaVerifiedBadge />}
                    </div>
                    <p className="text-sm capitalize text-muted-foreground">{getCategoryLabel(tool)} / {fieldString(tool, ["subcategory"], "Software")}</p>
                  </div>
                </div>
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">{name}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{getToolSummary(tool)}</p>
                <div className="mt-6">
                  <ToolMetadataRow tool={tool} />
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={`/api/affiliate/${toolSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-input bg-brand-primary px-5 py-3 text-sm font-semibold text-neutral-white hover:bg-brand-primary/90">
                    Visit Website <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link href="#videos" className="inline-flex items-center gap-2 rounded-input border border-neutral-stroke px-5 py-3 text-sm font-semibold text-foreground hover:border-brand-primary/40">
                    Watch Tutorial <PlayCircle className="h-4 w-4" />
                  </Link>
                  <SaveToolButton toolId={fieldString(tool, ["id"], toolSlug)} toolSlug={toolSlug} />
                  <Link href={`/compare?tools=${toolSlug}`} className="inline-flex items-center gap-2 rounded-input border border-neutral-stroke px-5 py-3 text-sm font-semibold text-foreground hover:border-brand-primary/40">
                    Compare <Layers3 className="h-4 w-4" />
                  </Link>
                  <ToolShareButton toolName={name} slug={toolSlug} />
                </div>
              </div>
              <div className="overflow-hidden rounded-[32px] border border-neutral-stroke shadow-2xl">
                <HeroVisualCarousel tool={tool} large />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto grid gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="space-y-12">
            <SectionShell title="AI generated software intelligence" subtitle="Stored summary fields are used when available; deterministic DISCOVA analysis fills gaps so the page never feels empty.">
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(getAiSummaries(tool)).map(([label, body]) => (
                  <div key={label} className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/5 p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold capitalize text-brand-lilac">
                      <Sparkles className="h-4 w-4" />
                      {label === "short" ? "30 second summary" : label === "medium" ? "2 minute summary" : "Deep analysis"}
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell title={`About ${name}`} subtitle="A long-form product profile designed to keep research inside DISCOVA.">
              <div className="space-y-6 rounded-[28px] border border-neutral-stroke bg-neutral-surface/60 p-6">
                {getLongDescriptionSections(tool).map((section) => (
                  <div key={section.title}>
                    <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell title="Who is this tool for">
              <div className="flex flex-wrap gap-2">
                {getAudience(tool).map((audience) => (
                  <span key={audience} className="inline-flex items-center gap-2 rounded-pill border border-neutral-stroke bg-neutral-surface px-4 py-2 text-sm font-semibold text-foreground">
                    <Users className="h-4 w-4 text-brand-lilac" />
                    {audience}
                  </span>
                ))}
              </div>
            </SectionShell>

            <SectionShell title="Primary features">
              <div className="grid gap-4 md:grid-cols-2">
                {getFeatures(tool).map((feature) => (
                  <div key={feature.title} className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/60 p-5">
                    <p className="text-xl">{feature.icon || "✦"}</p>
                    <h3 className="mt-4 text-lg font-bold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </SectionShell>

            <div className="grid gap-5 md:grid-cols-2">
              <SignalSection title="Pros" items={getPros(tool)} />
              <SignalSection title="Cons" items={getCons(tool)} />
            </div>

            <SectionShell id="videos" title="Video learning center" subtitle="Tutorials and walkthroughs embedded directly in DISCOVA.">
              {videos.length > 0 ? (
                <YoutubeLearningCenter videos={videos} toolName={name} />
              ) : (
                <div className="rounded-[28px] border border-dashed border-neutral-stroke p-8 text-sm text-muted-foreground">DISCOVA is ready to display embedded tutorials as soon as ToolVideo entries are connected in Contentful.</div>
              )}
            </SectionShell>

            <SectionShell title="Screenshot gallery">
              {gallery.length > 0 ? (
                <ScreenshotGallery images={gallery} toolName={name} />
              ) : (
                <div className="rounded-[28px] border border-neutral-stroke bg-neutral-surface/60 p-8">
                  <GalleryVerticalEnd className="h-8 w-8 text-brand-lilac" />
                  <p className="mt-3 text-sm text-muted-foreground">Cloudinary and Contentful gallery fields are supported. Add screenshots to populate this carousel-ready gallery.</p>
                </div>
              )}
            </SectionShell>

            <SectionShell title="Use cases">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {getUseCases(tool).map((useCase) => (
                  <div key={useCase} className="rounded-2xl border border-neutral-stroke bg-neutral-surface/60 p-4 text-sm font-semibold text-foreground">{useCase}</div>
                ))}
              </div>
            </SectionShell>

            {alternatives.length > 0 && (
              <SectionShell title={`${name} alternatives`} subtitle="Direct competitors and substitute products tracked by DISCOVA.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {alternatives.map((item) => (
                    <ToolAlternativeCard key={item.slug} tool={item} />
                  ))}
                </div>
              </SectionShell>
            )}

            {related.length > 0 && (
              <SectionShell title="Related tools" subtitle="More tools in the same category worth evaluating next.">
                <div className="grid gap-6 xl:grid-cols-2">
                  {related.map((item) => (
                    <ToolProfileCard key={fieldString(item, ["id"], getToolSlug(item))} tool={item} />
                  ))}
                </div>
              </SectionShell>
            )}

            <SectionShell title="FAQ">
              <ToolFaqAccordion faqs={faqs} />
            </SectionShell>

            <ReviewsSection toolId={fieldString(tool, ["id"], toolSlug)} toolName={name} initialReviews={reviews} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <PricingPanel tool={tool} />
            <VerificationPanel tool={tool} />
            <section className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/70 p-5">
              <h2 className="text-lg font-bold text-foreground">Featured collections</h2>
              <div className="mt-4 space-y-3">
                {["Best tools for growing teams", "AI productivity stack", "Creator workflow toolkit"].map((collection) => (
                  <Link key={collection} href="/collections" className="flex items-center justify-between rounded-input border border-neutral-stroke bg-white/[0.03] p-3 text-sm font-semibold text-foreground hover:border-brand-primary/40">
                    {collection}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
            <AskAIWidget tool={{ name, description: getToolDescription(tool), has_free: fieldBool(tool, ["has_free", "freeTier"]) }} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SignalSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/60 p-5">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <Check className="mt-1 h-4 w-4 shrink-0 text-brand-lilac" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
