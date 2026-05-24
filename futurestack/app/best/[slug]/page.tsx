import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToolProfileCard } from "@/components/cards/tool-profile-card";
import { PageHero } from "@/components/discovery/page-hero";
import { SEO_LANDING_PAGES, getSeoPage } from "@/lib/seo-pages";
import { getTrendingTools } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SEO_LANDING_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://getdiscova.com/best/${page.slug}`,
    },
    alternates: { canonical: `https://getdiscova.com/best/${page.slug}` },
  };
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();

  let tools = await getTrendingTools(12);
  if (!tools?.length) tools = fallbackTools.slice(0, 12);

  if (page.categories?.length) {
    tools = tools.filter((t) => page.categories!.includes(t.category as string));
    if (tools.length < 6) tools = (await getTrendingTools(24))?.filter((t) => page.categories!.includes(t.category as string)) ?? fallbackTools.slice(0, 12);
  }

  if (page.africaFocus) {
    const africa = tools.filter((t) => t.africa_friendly || t.africaFriendly);
    if (africa.length >= 4) tools = africa;
  }

  if (page.freeOnly) {
    const free = tools.filter((t) => t.has_free || t.pricing_model === "free" || t.pricing_model === "freemium");
    if (free.length >= 4) tools = free;
  }

  const related = SEO_LANDING_PAGES.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-mobile-nav">
        <PageHero title={page.headline} subtitle={page.description} />

        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              Top picks for this guide
            </h2>
            <Link
              href={`/tools?search=${encodeURIComponent(page.searchQuery)}`}
              className="text-sm text-brand-primary hover:text-brand-lilac flex items-center gap-1"
            >
              Search all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.slice(0, 9).map((tool) => (
              <ToolProfileCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <section className="border-t border-neutral-stroke/40 bg-neutral-surface/20 py-10">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <h2 className="text-lg font-black text-foreground mb-4">Related guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/best/${r.slug}`}
                  className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-4 hover:border-brand-primary/40 card-lift transition-all"
                >
                  <p className="font-bold text-foreground text-sm">{r.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
