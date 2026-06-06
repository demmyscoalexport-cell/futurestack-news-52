import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostBySlug, getRelatedBlogPosts, FALLBACK_POSTS_FULL } from "@/lib/blog/contentful";
import { getBlogPostMeta } from "@/lib/blog/seo";
import {
  buildArticleSchema,
  buildFAQSchema,
  buildBreadcrumbSchema,
} from "@/lib/blog/structured-data";
import { extractHeadings, getCategoryStyle, getCategoryName, formatBlogDate } from "@/lib/blog/utils";
import { ArticleContent } from "@/components/blog/article-content";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons, StickyShareButtons } from "@/components/blog/share-buttons";
import { RelatedArticles } from "@/components/blog/related-articles";
import { AuthorCard } from "@/components/blog/author-card";
import { ToolRecommendations } from "@/components/blog/tool-recommendations";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowLeft, ChevronRight, Lightbulb, List } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article Not Found | DISCOVA Blog" };
  return getBlogPostMeta(post);
}

export async function generateStaticParams() {
  return FALLBACK_POSTS_FULL.map((p) => ({ slug: p.slug }));
}

const SITE_URL = "https://getdiscova.com";

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, related] = await Promise.all([
    getBlogPostBySlug(slug),
    getBlogPostBySlug(slug).then((p) =>
      p ? getRelatedBlogPosts(p, 3) : []
    ),
  ]);

  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const catStyle = getCategoryStyle(post.category.slug);
  const catName = post.category.name || getCategoryName(post.category.slug);

  const schemas = [
    buildArticleSchema(post, url),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Blog", url: `${SITE_URL}/blog` },
      { name: post.category.name, url: `${SITE_URL}/blog/category/${post.category.slug}` },
      { name: post.title, url },
    ]),
    ...(post.faqs?.length ? [buildFAQSchema(post.faqs)] : []),
  ];

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      {/* Reading progress */}
      <ReadingProgress />

      <article className="min-h-screen bg-background">
        {/* Hero */}
        <header className="border-b border-neutral-stroke/40 bg-neutral-deep/60">
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {catName}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
            </nav>

            {/* Category + Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Link href={`/blog/category/${post.category.slug}`}>
                <Badge
                  variant="outline"
                  className={cn("text-xs border font-medium hover:opacity-80 transition-opacity", catStyle)}
                >
                  {catName}
                </Badge>
              </Link>
              {post.tags.slice(0, 3).map((tag) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="text-xs border-border/60 text-muted-foreground hover:border-brand-primary/40 hover:text-foreground transition-all"
                  >
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-[1.1] text-foreground mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-6">
              {post.excerpt}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <AuthorCard author={post.author} variant="inline" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatBlogDate(post.publishedAt)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </div>
              </div>
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="container mx-auto px-4 max-w-5xl mt-8">
            <div className="relative aspect-[16/9] rounded-discova-lg overflow-hidden border border-neutral-stroke/40">
              <Image
                src={post.featuredImage}
                alt={post.featuredImageAlt ?? post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="container mx-auto px-4 max-w-5xl py-10">
          <div className="flex gap-10 xl:gap-14">
            {/* Sticky share (desktop) */}
            <div className="hidden xl:block w-12 shrink-0">
              <StickyShareButtons url={url} title={post.title} />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* TLDR */}
              {post.tldr && (
                <div className="mb-8 p-5 rounded-discova-lg border border-brand-primary/20 bg-brand-primary/5">
                  <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    TL;DR
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{post.tldr}</p>
                </div>
              )}

              {/* Key Takeaways */}
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <div className="mb-8 p-5 rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface">
                  <p className="text-sm font-bold font-heading text-foreground mb-3 flex items-center gap-1.5">
                    <List className="h-4 w-4 text-brand-primary" />
                    Key Takeaways
                  </p>
                  <ul className="space-y-2">
                    {post.keyTakeaways.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-brand-primary font-semibold shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, "0")}.
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ToC (mobile / tablet) */}
              {headings.length >= 3 && (
                <div className="xl:hidden mb-8">
                  <TableOfContents headings={headings} />
                </div>
              )}

              {/* Content */}
              <ArticleContent content={post.content} />

              {/* FAQs */}
              {post.faqs && post.faqs.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-xl font-bold font-heading text-foreground mb-5">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {post.faqs.map((faq, i) => (
                      <details
                        key={i}
                        className="group rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface overflow-hidden"
                      >
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-foreground hover:bg-white/5 transition-colors list-none">
                          {faq.question}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform flex-shrink-0 ml-3" />
                        </summary>
                        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Author bio */}
              <div className="mt-12">
                <AuthorCard author={post.author} variant="full" />
              </div>

              {/* Share (mobile bottom) */}
              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-border/40 xl:hidden">
                <span className="text-xs text-muted-foreground font-medium">Share:</span>
                <ShareButtons url={url} title={post.title} />
              </div>
            </div>

            {/* Sidebar (desktop) */}
            <aside className="hidden lg:flex flex-col gap-6 w-64 shrink-0">
              {/* ToC */}
              {headings.length >= 3 && (
                <div className="sticky top-24">
                  <TableOfContents headings={headings} />
                  {/* Recommended tools */}
                  {post.recommendedTools && post.recommendedTools.length > 0 && (
                    <div className="mt-4">
                      <ToolRecommendations
                        tools={post.recommendedTools}
                        title="Tools in this article"
                      />
                    </div>
                  )}
                  {/* Newsletter */}
                  <div className="mt-4">
                    <NewsletterSignup variant="inline" title="Get weekly AI insights" />
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <RelatedArticles posts={related} currentSlug={post.slug} />
          )}

          {/* Bottom newsletter */}
          <div className="mt-14">
            <NewsletterSignup />
          </div>
        </div>
      </article>
    </>
  );
}
