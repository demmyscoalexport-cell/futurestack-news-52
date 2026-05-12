import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArticleCard } from "@/components/cards/article-card";
import { ToolCard } from "@/components/cards/tool-card";
import { RoleSelector } from "@/components/ui/role-selector";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { articles as fallbackArticles, tools, reviews } from "@/lib/data";
import { getArticleBySlug, getPublishedArticles } from "@/lib/queries/articles";
import {
  ArrowLeft,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const categoryColors: Record<string, string> = {
  "ai-tools": "bg-primary/10 text-primary border-primary/20",
  "saas-news": "bg-accent/10 text-accent border-accent/20",
  tutorials: "bg-success/10 text-success border-success/20",
  "case-studies": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  comparisons: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  "industry-trends":
    "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
};

const categoryLabels: Record<string, string> = {
  "ai-tools": "AI Tools",
  "saas-news": "SaaS News",
  tutorials: "Tutorial",
  "case-studies": "Case Study",
  comparisons: "Comparison",
  "industry-trends": "Industry Trends",
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // Try DB first, fall back to static data
  let article: any = await getArticleBySlug(slug);
  if (!article) {
    const staticArticle = fallbackArticles.find((a) => a.slug === slug);
    if (!staticArticle) notFound();
    article = staticArticle;
  }

  // Normalize shape from DB vs static data
  if (!article.author) article.author = { name: "FutureStack", role: "Editor", avatar: "" };
  if (!article.author.role) article.author.role = "Editor";
  if (article.readTime == null) article.readTime = article.reading_time || 5;
  if (!article.featuredImage) article.featuredImage = article.hero_image || article.cover_image_url || "";
  if (article.viewCount == null) article.viewCount = article.view_count || 0;
  if (article.featured == null) article.featured = article.is_featured || false;
  if (!article.publishedAt) article.publishedAt = article.published_at || new Date().toISOString();
  if (!article.updatedAt) article.updatedAt = article.updated_at || article.publishedAt;

  const [relatedArticles] = await Promise.all([
    getPublishedArticles({ limit: 3 }),
  ]);

  const filteredRelated = (relatedArticles as any[])
    .filter((a: any) => a.slug !== article.slug)
    .slice(0, 3);

  const comparedTools = tools.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Article Header */}
        <section className="border-b border-border bg-gradient-to-b from-background to-secondary/20 py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Back link */}
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge
                variant="outline"
                className={categoryColors[article.category]}
              >
                {categoryLabels[article.category]}
              </Badge>
              {article.featured && (
                <Badge
                  variant="outline"
                  className="bg-accent/10 text-accent border-accent/20"
                >
                  Featured
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl xl:text-5xl text-balance max-w-4xl">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              {article.excerpt}
            </p>

            {/* Author & Meta */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {article.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {article.author.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {article.author.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Published{" "}
                  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {article.updatedAt !== article.publishedAt && (
                  <span>
                    Updated{" "}
                    {new Date(article.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {article.viewCount.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Share buttons */}
            <div className="mt-6 flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Twitter className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Linkedin className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex gap-12">
              {/* Main Content */}
              <article className="flex-1 max-w-3xl">
                {/* Featured Image Placeholder */}
                <div className="aspect-[21/9] rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 mb-10" />

                {/* Article Body */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h2>Introduction</h2>
                  <p>
                    The landscape of AI tools is evolving rapidly, and staying
                    ahead means knowing which tools actually deliver on their
                    promises. In this comprehensive guide, we&apos;ll explore
                    the tools that are making a real difference for content
                    teams, freelancers, and marketers.
                  </p>

                  {/* Role Selector CTA */}
                  <Card className="my-8 p-6 bg-primary/5 border-primary/20">
                    <h3 className="text-lg font-semibold text-foreground mt-0 mb-4">
                      Get personalized tool recommendations
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Select your role to see which tools are best suited for
                      your workflow:
                    </p>
                    <RoleSelector variant="compact" />
                  </Card>

                  <h2>The Tools Compared</h2>
                  <p>
                    We&apos;ve tested each of these tools extensively over the
                    past month. Here&apos;s what we found when comparing them
                    head-to-head across key metrics like ease of use, output
                    quality, and value for money.
                  </p>
                </div>

                {/* Tool Comparison */}
                <div className="my-10">
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    Featured Tools in This Article
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {comparedTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} variant="compact" />
                    ))}
                  </div>
                </div>

                {/* Continue article */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h2>Key Takeaways</h2>
                  <p>
                    After extensive testing, here are the main insights we
                    gathered:
                  </p>
                  <ul>
                    <li>
                      The best tool depends heavily on your specific workflow
                      and budget
                    </li>
                    <li>
                      Free tiers can be surprisingly capable for individual use
                    </li>
                    <li>
                      Integration capabilities matter more than raw features
                    </li>
                    <li>
                      Consider the learning curve when calculating total cost of
                      ownership
                    </li>
                  </ul>

                  <h2>Conclusion</h2>
                  <p>
                    There&apos;s no one-size-fits-all answer when it comes to AI
                    tools. The best approach is to identify your specific needs,
                    try the free tiers where available, and scale up based on
                    actual results rather than promised features.
                  </p>
                </div>

                {/* Build Stack CTA */}
                <Card className="my-10 p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
                  <h3 className="text-lg font-semibold text-foreground">
                    Ready to build your stack?
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Combine these tools into a custom workflow that fits your
                    needs.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/stack-builder">
                      Start Stack Builder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>

                {/* Comments Section */}
                <div className="mt-12 pt-12 border-t border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments ({reviews.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Top
                      </Button>
                      <Button variant="ghost" size="sm">
                        New
                      </Button>
                    </div>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {review.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {review.userName}
                              </span>
                              {review.verified && (
                                <span className="flex items-center gap-1 text-xs text-success">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                              {review.location && (
                                <span className="text-xs text-muted-foreground">
                                  {review.location}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  review.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-foreground">
                              {review.content}
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ThumbsUp className="h-4 w-4" />
                                {review.upvotes}
                              </button>
                              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ThumbsDown className="h-4 w-4" />
                              </button>
                              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button variant="outline" className="mt-6 w-full">
                    Load more comments
                  </Button>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="hidden xl:block w-80 shrink-0">
                <div className="sticky top-24 space-y-8">
                  {/* Table of Contents */}
                  <Card className="p-5">
                    <h4 className="font-semibold text-foreground mb-4">
                      Table of Contents
                    </h4>
                    <nav className="space-y-2">
                      <a
                        href="#"
                        className="block text-sm text-primary hover:underline"
                      >
                        Introduction
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-muted-foreground hover:text-foreground"
                      >
                        The Tools Compared
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-muted-foreground hover:text-foreground"
                      >
                        Key Takeaways
                      </a>
                      <a
                        href="#"
                        className="block text-sm text-muted-foreground hover:text-foreground"
                      >
                        Conclusion
                      </a>
                    </nav>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="p-5">
                    <h4 className="font-semibold text-foreground mb-4">
                      Quick Actions
                    </h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Article
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save for Later
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Jump to Comments
                      </Button>
                    </div>
                  </Card>

                  {/* Newsletter */}
                  <Card className="p-5 bg-primary/5 border-primary/20">
                    <h4 className="font-semibold text-foreground mb-2">
                      Get more insights
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join 12,000+ readers getting weekly AI tool
                      recommendations.
                    </p>
                    <NewsletterForm variant="inline" />
                  </Card>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border bg-card py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                Related Articles
              </h2>
              <Button variant="ghost" asChild>
                <Link href={`/news?category=${article.category}`}>
                  View all in {categoryLabels[article.category]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRelated.map((related: any) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
