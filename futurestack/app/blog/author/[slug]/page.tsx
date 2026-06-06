import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/blog/contentful";
import { getBlogAuthorMeta } from "@/lib/blog/seo";
import { BlogArticleCard } from "@/components/blog/article-card";
import { AuthorCard } from "@/components/blog/author-card";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import { ArrowLeft } from "lucide-react";
import type { BlogAuthor } from "@/lib/blog/types";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author: BlogAuthor = {
    id: slug,
    name: slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    slug,
    bio: "",
  };
  return getBlogAuthorMeta(author);
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const { slug } = await params;

  const authorName = slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  const author: BlogAuthor = {
    id: slug,
    name: authorName,
    slug,
    bio: `${authorName} is a content strategist and AI enthusiast at DISCOVA, covering the latest in artificial intelligence, productivity, and technology tools.`,
    role: "Content Strategist",
  };

  const { posts } = await getBlogPosts({ limit: 9 });
  const authorPosts = posts.filter((p) => p.author.slug === slug || p.author.name === authorName);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neutral-stroke/40 bg-neutral-deep/60">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Blog
          </Link>
          <AuthorCard author={author} variant="full" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h2 className="text-lg font-bold font-heading text-foreground mb-6">
          Articles by {author.name}
          {authorPosts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({authorPosts.length})
            </span>
          )}
        </h2>

        {authorPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {authorPosts.map((post) => (
              <BlogArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.slice(0, 6).map((post) => (
              <BlogArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-14">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
