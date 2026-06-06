import { Suspense } from "react";
import type { Metadata } from "next";
import { getBlogIndexMeta } from "@/lib/blog/seo";
import { getBlogPosts, getFeaturedBlogPosts } from "@/lib/blog/contentful";
import { BlogHero } from "@/components/blog/blog-hero";
import { BlogArticleCard } from "@/components/blog/article-card";
import { CategoryPills } from "@/components/blog/category-pills";
import { FeaturedCollections } from "@/components/blog/featured-collection";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Flame, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = getBlogIndexMeta();
export const revalidate = 300;

interface BlogPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { q, category, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const perPage = 12;

  const [featured, allPosts] = await Promise.all([
    getFeaturedBlogPosts(3),
    getBlogPosts({
      limit: perPage,
      skip: (currentPage - 1) * perPage,
      category: category && category !== "all" ? category : undefined,
      order: "-fields.publishDate",
    }),
  ]);

  const { posts, total, hasMore } = allPosts;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <BlogHero />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Featured Posts */}
        {!q && !category && currentPage === 1 && featured.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-4 w-4 text-brand-gold" />
              <h2 className="text-base font-bold font-heading text-foreground">Featured</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {featured[0] && (
                <div className="lg:col-span-2">
                  <BlogArticleCard post={featured[0]} variant="featured" priority className="h-full" />
                </div>
              )}
              <div className="flex flex-col gap-5">
                {featured.slice(1, 3).map((post) => (
                  <BlogArticleCard key={post.id} post={post} variant="horizontal" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Collections */}
        {!q && !category && currentPage === 1 && (
          <section className="mb-14">
            <FeaturedCollections />
          </section>
        )}

        {/* Filters + Articles */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {q ? (
                  <h2 className="text-base font-bold font-heading text-foreground">
                    Results for &ldquo;{q}&rdquo;
                  </h2>
                ) : category ? (
                  <h2 className="text-base font-bold font-heading text-foreground capitalize">
                    {category.replace(/-/g, " ")}
                  </h2>
                ) : (
                  <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-primary" />
                    Latest Articles
                  </h2>
                )}
              </div>
              {!q && (
                <p className="text-xs text-muted-foreground">
                  {total} article{total !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Category pills */}
          {!q && (
            <CategoryPills selected={category} className="mb-8" />
          )}

          {/* Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {posts.map((post, i) => (
                <BlogArticleCard
                  key={post.id}
                  post={post}
                  priority={i < 3}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {q ? `No articles found for "${q}"` : "No articles yet — check back soon."}
              </p>
              <Link href="/blog" className="mt-4 inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-lilac transition-colors">
                Browse all articles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Pagination */}
          {(hasMore || currentPage > 1) && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {currentPage > 1 && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(category ? { category } : {}),
                    ...(q ? { q } : {}),
                    page: String(currentPage - 1),
                  })}`}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-input border border-border/60 text-sm font-medium text-foreground hover:border-brand-primary/40 hover:bg-white/5 transition-all"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage}
              </span>
              {hasMore && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(category ? { category } : {}),
                    ...(q ? { q } : {}),
                    page: String(currentPage + 1),
                  })}`}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-input bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-all"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Newsletter */}
        <div className="mt-16">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
