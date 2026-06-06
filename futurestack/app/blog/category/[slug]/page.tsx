import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPosts } from "@/lib/blog/contentful";
import { getBlogCategoryMeta } from "@/lib/blog/seo";
import { BLOG_CATEGORIES, getCategoryStyle } from "@/lib/blog/utils";
import { BlogArticleCard } from "@/components/blog/article-card";
import { CategoryPills } from "@/components/blog/category-pills";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return { title: "Category | DISCOVA Blog" };
  return getBlogCategoryMeta({ id: slug, name: cat.name, slug });
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const perPage = 12;

  const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) notFound();

  const { posts, total, hasMore } = await getBlogPosts({
    category: slug,
    limit: perPage,
    skip: (currentPage - 1) * perPage,
  });

  const catStyle = getCategoryStyle(slug);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neutral-stroke/40 bg-neutral-deep/60">
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-3 w-3" />
            All articles
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className={cn("text-sm border font-semibold px-3 py-1", catStyle)}>
              {cat.name}
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-foreground">
            {cat.name} Articles
          </h1>
          <p className="text-muted-foreground mt-2">
            {total} article{total !== 1 ? "s" : ""} on {cat.name}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Category navigation */}
        <CategoryPills selected={slug} className="mb-8" />

        {/* Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {posts.map((post) => (
              <BlogArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-medium">No articles in this category yet.</p>
            <Link href="/blog" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-lilac transition-colors">
              Browse all articles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Pagination */}
        {(hasMore || currentPage > 1) && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {currentPage > 1 && (
              <Link
                href={`/blog/category/${slug}?page=${currentPage - 1}`}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-input border border-border/60 text-sm font-medium text-foreground hover:border-brand-primary/40 hover:bg-white/5 transition-all"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-2">Page {currentPage}</span>
            {hasMore && (
              <Link
                href={`/blog/category/${slug}?page=${currentPage + 1}`}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-input bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-all"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}

        <div className="mt-14">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
