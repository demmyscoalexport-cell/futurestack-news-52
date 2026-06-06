import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogArticleCard } from "./article-card";
import type { BlogListItem } from "@/lib/blog/types";

interface RelatedArticlesProps {
  posts: BlogListItem[];
  currentSlug?: string;
  title?: string;
}

export function RelatedArticles({
  posts,
  currentSlug,
  title = "Continue reading",
}: RelatedArticlesProps) {
  const filtered = posts.filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border/40">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold font-heading text-foreground">{title}</h2>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-sm text-brand-primary hover:text-brand-lilac transition-colors font-medium"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((post) => (
          <BlogArticleCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
