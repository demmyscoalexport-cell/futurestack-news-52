import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleCard } from "@/components/cards/article-card";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { articles as fallbackArticles } from "@/lib/data";
import { getArticleBySlug, getPublishedArticles } from "@/lib/queries/articles";
import {
  ArrowLeft,
  Clock,
  Eye,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { ArticleActions } from "./article-actions";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const categoryColors: Record<string, string> = {
  "ai-tools": "bg-primary/10 text-primary border-primary/20",
  "saas-news": "bg-accent/10 text-accent border-accent/20",
  tutorials: "bg-success/10 text-success border-success/20",
  "case-studies": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  comparisons: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  "industry-trends": "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
};

const categoryLabels: Record<string, string> = {
  "ai-tools": "AI Tools",
  "saas-news": "SaaS News",
  tutorials: "Tutorial",
  "case-studies": "Case Study",
  comparisons: "Comparison",
  "industry-trends": "Industry Trends",
};

/** Simple markdown → HTML converter for article bodies */
function markdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  const closeList = () => {
    if (inUl) { html.push("</ul>"); inUl = false; }
    if (inOl) { html.push("</ol>"); inOl = false; }
  };

  const closeBlockquote = () => {
    if (inBlockquote) { html.push("</blockquote>"); inBlockquote = false; }
  };

  const inlineFormat = (text: string) =>
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headings
    if (/^#{1,6}\s/.test(trimmed)) {
      closeList(); closeBlockquote();
      const level = (trimmed.match(/^(#+)/) || ["", ""])[1].length;
      const text = trimmed.replace(/^#+\s+/, "");
      const tag = level <= 2 ? "h2" : level === 3 ? "h3" : "h4";
      const cls = level <= 2
        ? "text-2xl font-bold text-foreground mt-10 mb-4"
        : level === 3
        ? "text-xl font-semibold text-foreground mt-8 mb-3"
        : "text-lg font-semibold text-foreground mt-6 mb-2";
      html.push(`<${tag} class="${cls}">${inlineFormat(text)}</${tag}>`);
      i++; continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeList();
      if (!inBlockquote) {
        html.push('<blockquote class="border-l-4 border-primary/40 pl-4 my-4 italic text-muted-foreground">');
        inBlockquote = true;
      }
      html.push(`<p>${inlineFormat(trimmed.slice(2))}</p>`);
      i++; continue;
    } else {
      closeBlockquote();
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      closeBlockquote();
      if (inOl) { html.push("</ol>"); inOl = false; }
      if (!inUl) { html.push('<ul class="list-disc pl-6 my-4 space-y-2 text-foreground/90">'); inUl = true; }
      html.push(`<li class="leading-relaxed">${inlineFormat(trimmed.replace(/^[-*+]\s/, ""))}</li>`);
      i++; continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      closeBlockquote();
      if (inUl) { html.push("</ul>"); inUl = false; }
      if (!inOl) { html.push('<ol class="list-decimal pl-6 my-4 space-y-2 text-foreground/90">'); inOl = true; }
      html.push(`<li class="leading-relaxed">${inlineFormat(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeList(); closeBlockquote();
      html.push('<hr class="border-border/40 my-8" />');
      i++; continue;
    }

    // Empty line
    if (trimmed === "") {
      closeList(); closeBlockquote();
      i++; continue;
    }

    // Paragraph
    closeList(); closeBlockquote();
    html.push(`<p class="text-foreground/85 leading-relaxed mb-4">${inlineFormat(trimmed)}</p>`);
    i++;
  }

  closeList(); closeBlockquote();
  return html.join("\n");
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // Try DB first, fall back to static data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let article: any = await getArticleBySlug(slug);
  if (!article) {
    const staticArticle = fallbackArticles.find((a) => a.slug === slug);
    if (!staticArticle) notFound();
    article = staticArticle;
  }

  // Normalize shape from DB vs static data
  if (!article.author) article.author = { name: "DISCOVA AI", role: "Staff Writer", avatar: "" };
  if (!article.author.role) article.author.role = "Staff Writer";
  if (article.readTime == null) article.readTime = article.reading_time || 5;
  if (!article.featuredImage) article.featuredImage = article.hero_image || article.cover_image_url || "";
  if (article.viewCount == null) article.viewCount = article.view_count || 0;
  if (article.featured == null) article.featured = article.is_featured || false;
  if (!article.publishedAt) article.publishedAt = article.published_at || new Date().toISOString();
  if (!article.updatedAt) article.updatedAt = article.updated_at || article.publishedAt;

  // Use DB content field (markdown), fallback to excerpt
  const bodyMarkdown: string = article.content || article.excerpt || "";
  const bodyHtml = markdownToHtml(bodyMarkdown);

  const relatedArticles = await getPublishedArticles({ limit: 4 });
  const filteredRelated = (relatedArticles as unknown as { slug: string; id: string }[])
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-mobile-nav">
        <section className="relative overflow-hidden hero-glow border-b border-neutral-stroke/40 py-10 sm:py-12 lg:py-14">
          <div className="orb-glow top-0 right-0 h-[300px] w-[400px] bg-brand-primary/10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className={categoryColors[article.category] || "bg-secondary text-foreground"}>
                {categoryLabels[article.category] || article.category || "Article"}
              </Badge>
              {article.featured && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Featured</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground lg:text-4xl xl:text-5xl leading-tight max-w-4xl">
              {article.title}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {article.excerpt}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {article.author.name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground text-sm">{article.author.name}</p>
                  <p className="text-xs text-muted-foreground">{article.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTime} min read
                </span>
                {article.viewCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {article.viewCount.toLocaleString()} views
                  </span>
                )}
              </div>
            </div>

            {/* Source attribution for GNews articles */}
            {article.source_name && article.source_url && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span>Originally reported by</span>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {article.source_name}
                </a>
                <span>· Expanded for DISCOVA readers by AI</span>
              </div>
            )}

            <ArticleActions title={article.title} slug={slug} />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-10 lg:py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex gap-12 max-w-5xl mx-auto">
              {/* Main Content */}
              <article className="flex-1 min-w-0">
                {/* Featured Image */}
                {article.featuredImage && (
                  <div className="relative aspect-[21/9] rounded-discova-lg overflow-hidden mb-10 bg-neutral-surface border border-neutral-stroke/40">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                )}
                {!article.featuredImage && (
                  <div className="aspect-[21/9] rounded-discova-lg bg-gradient-to-br from-brand-primary/15 to-brand-lilac/20 mb-10 border border-neutral-stroke/40" />
                )}

                {/* Article Body — rendered from DB markdown */}
                {bodyHtml ? (
                  <div
                    className="text-base [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 [&_p]:text-foreground/85 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_li]:text-foreground/85 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:italic [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:border-border/40 [&_hr]:my-8 [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Content coming soon...</p>
                )}

                {/* CTA */}
                <div className="mt-10 glass-panel border border-brand-primary/20 rounded-discova-lg p-6 sm:p-8">
                  <h3 className="text-lg font-black text-foreground">
                    Find the right tools for your stack
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Discover, compare, and combine the best AI tools for your workflow.
                  </p>
                  <Link
                    href="/tools"
                    className="mt-4 inline-flex items-center gap-2 rounded-input bg-brand-primary px-4 py-2.5 text-sm font-bold text-neutral-white hover:bg-brand-primary/90 transition-colors"
                  >
                    Explore Tools <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="hidden xl:block w-72 shrink-0">
                <div className="sticky top-24 space-y-6">
                  <div className="glass-panel border border-neutral-stroke/60 rounded-discova-lg p-5">
                    <h4 className="font-semibold text-foreground mb-4 text-sm">Quick Actions</h4>
                    <ArticleActions title={article.title} slug={slug} variant="sidebar" />
                  </div>

                  <div className="glass-panel border border-brand-primary/20 rounded-discova-lg p-5">
                    <h4 className="font-semibold text-foreground mb-2 text-sm">Get more insights</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Join 12,000+ readers getting weekly AI tool recommendations.
                    </p>
                    <NewsletterForm variant="inline" />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {filteredRelated.length > 0 && (
          <section className="border-t border-neutral-stroke/40 bg-neutral-surface/30 py-10 lg:py-14">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-foreground">Related Articles</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/news">
                    View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filteredRelated.map((related: any) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
