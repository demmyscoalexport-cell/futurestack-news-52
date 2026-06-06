import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  title: string;
  description: string;
  slug: string;
  articleCount?: number;
  icon?: string;
  color?: string;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: "1",
    title: "Best AI Tools",
    description: "Curated picks for every use case and budget",
    slug: "best-ai-tools",
    articleCount: 12,
    icon: "🏆",
    color: "from-brand-primary/20 to-violet-900/20",
  },
  {
    id: "2",
    title: "AI Tool Comparisons",
    description: "Head-to-head tests so you can decide faster",
    slug: "ai-tool-comparisons",
    articleCount: 8,
    icon: "⚡",
    color: "from-blue-600/20 to-cyan-800/20",
  },
  {
    id: "3",
    title: "AI Guides",
    description: "Step-by-step guides for every skill level",
    slug: "ai-guides",
    articleCount: 15,
    icon: "📖",
    color: "from-emerald-600/20 to-teal-800/20",
  },
  {
    id: "4",
    title: "Case Studies",
    description: "Real stories of AI transforming businesses",
    slug: "case-studies",
    articleCount: 6,
    icon: "🎯",
    color: "from-amber-600/20 to-orange-800/20",
  },
  {
    id: "5",
    title: "Tutorials",
    description: "Learn how to master the tools that matter",
    slug: "tutorials",
    articleCount: 18,
    icon: "🎓",
    color: "from-pink-600/20 to-rose-800/20",
  },
  {
    id: "6",
    title: "Industry Reports",
    description: "Data-driven insights on the AI landscape",
    slug: "industry-reports",
    articleCount: 4,
    icon: "📊",
    color: "from-purple-600/20 to-violet-800/20",
  },
];

interface FeaturedCollectionsProps {
  collections?: Collection[];
  className?: string;
}

export function FeaturedCollections({
  collections = DEFAULT_COLLECTIONS,
  className,
}: FeaturedCollectionsProps) {
  return (
    <section className={cn("", className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-primary" />
          <h2 className="text-base font-bold font-heading text-foreground">Collections</h2>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-lilac transition-colors font-medium"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/blog/category/${col.slug}`}
            className={cn(
              "group flex flex-col items-start gap-2 p-4 rounded-discova-lg border border-neutral-stroke/60",
              "hover:border-brand-primary/40 card-lift transition-all duration-200 bg-neutral-surface",
              "bg-gradient-to-br", col.color
            )}
          >
            <span className="text-2xl">{col.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-brand-lilac transition-colors leading-snug">
                {col.title}
              </p>
              {col.articleCount !== undefined && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {col.articleCount} articles
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
