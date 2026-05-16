import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/* Accept a loose article shape so both DB rows and static data work */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArticle = any;

interface ArticleCardProps {
  article: AnyArticle;
  variant?: "default" | "featured" | "compact" | "horizontal";
  className?: string;
}

const categoryColors: Record<string, string> = {
  "ai-tools":        "bg-primary/10 text-primary border-primary/20",
  "saas-news":       "bg-accent/10 text-accent border-accent/20",
  tutorials:         "bg-success/10 text-success border-success/20",
  "case-studies":    "bg-chart-4/10 text-chart-4 border-chart-4/20",
  comparisons:       "bg-chart-5/10 text-chart-5 border-chart-5/20",
  "industry-trends": "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
  automation:        "bg-green-500/10 text-green-400 border-green-500/20",
  design:            "bg-pink-500/10 text-pink-400 border-pink-500/20",
  marketing:         "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "africa-tech":     "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const categoryLabels: Record<string, string> = {
  "ai-tools":        "AI Tools",
  "saas-news":       "SaaS News",
  tutorials:         "Tutorial",
  "case-studies":    "Case Study",
  comparisons:       "Comparison",
  "industry-trends": "Industry Trends",
  automation:        "Automation",
  design:            "Design",
  marketing:         "Marketing",
  "africa-tech":     "Africa Tech",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function getArticleHref(article: AnyArticle): string {
  return `/news/${article.slug}`;
}

function getCategoryLabel(cat: string): string {
  return categoryLabels[cat] || cat || "Article";
}

function getCategoryColor(cat: string): string {
  return categoryColors[cat] || "bg-secondary text-muted-foreground border-border/40";
}

export function ArticleCard({ article, variant = "default", className }: ArticleCardProps) {
  const authorName = article.author?.name || article.author_name || "DISCOVA AI";
  const sourceName: string | null = article.source_name || null;
  const featuredImage: string = article.featuredImage || article.hero_image || article.cover_image_url || "";
  const publishedAt: string = article.publishedAt || article.published_at || new Date().toISOString();
  const readTime: number = article.readTime || article.reading_time || 5;
  const category: string = article.category || article.category_slug || "ai-tools";
  const authorInitials = authorName.split(" ").map((n: string) => n[0]).join("");

  if (variant === "featured") {
    return (
      <Card className={cn("group relative overflow-hidden border-border/40", className)}>
        <Link href={getArticleHref(article)} className="block">
          <div className="relative aspect-[16/9] overflow-hidden bg-secondary/40">
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent z-10" />
            {featuredImage ? (
              <Image src={featuredImage} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-900/20" />
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
            <div className="flex flex-wrap gap-2 mb-2.5">
              <Badge variant="outline" className={cn("text-xs", getCategoryColor(category))}>
                {getCategoryLabel(category)}
              </Badge>
              {sourceName && (
                <Badge variant="outline" className="text-xs bg-secondary/60 text-muted-foreground border-border/40">
                  {sourceName}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="mt-1.5 text-xs text-white/70 line-clamp-2">{article.excerpt}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
              <span>{sourceName || authorName}</span>
              <span>·</span>
              <span>{formatDate(publishedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime} min</span>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  if (variant === "horizontal") {
    return (
      <Card className={cn("group flex overflow-hidden border-border/40 hover:border-primary/30 transition-all", className)}>
        <Link href={getArticleHref(article)} className="flex flex-1">
          <div className="relative w-36 shrink-0 overflow-hidden bg-secondary/40">
            {featuredImage ? (
              <Image src={featuredImage} alt={article.title} fill className="object-cover" sizes="144px" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-900/20" />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-4">
            <Badge variant="outline" className={cn("text-xs w-fit mb-1.5", getCategoryColor(category))}>
              {getCategoryLabel(category)}
            </Badge>
            <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors text-sm">
              {article.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{sourceName || authorName}</span>
              <span>·</span>
              <span>{formatDate(publishedAt)}</span>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("group", className)}>
        <Link href={getArticleHref(article)} className="flex gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
            {featuredImage ? (
              <Image src={featuredImage} alt={article.title} fill className="object-cover" sizes="56px" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-900/20" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(publishedAt)}</p>
          </div>
        </Link>
      </div>
    );
  }

  /* ── Default card ── */
  return (
    <Card className={cn("group overflow-hidden border-border/40 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all", className)}>
      <Link href={getArticleHref(article)}>
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary/40">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-violet-900/20" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Badge variant="outline" className={cn("text-xs", getCategoryColor(category))}>
              {getCategoryLabel(category)}
            </Badge>
            {sourceName && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ExternalLink className="h-2.5 w-2.5" />
                {sourceName}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {sourceName || authorName}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>{formatDate(publishedAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
