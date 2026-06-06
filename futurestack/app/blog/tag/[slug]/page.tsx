import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/blog/contentful";
import { BlogArticleCard } from "@/components/blog/article-card";
import { NewsletterSignup } from "@/components/blog/newsletter-signup";
import { ArrowLeft, Tag } from "lucide-react";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  return {
    title: `#${name} — Tag | DISCOVA Blog`,
    description: `Browse all articles tagged with #${name} on the DISCOVA Blog.`,
    alternates: { canonical: `https://getdiscova.com/blog/tag/${slug}` },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const tagName = slug.replace(/-/g, " ");

  const { posts } = await getBlogPosts({ limit: 24 });
  const tagged = posts.filter((p) => p.tags.some((t) => t.slug === slug));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neutral-stroke/40 bg-neutral-deep/60">
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-3 w-3" />
            All articles
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 text-brand-primary" />
            <h1 className="text-3xl font-black font-heading text-foreground capitalize">
              #{tagName}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {tagged.length > 0
              ? `${tagged.length} article${tagged.length !== 1 ? "s" : ""} tagged with #${tagName}`
              : "Explore related articles"}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {(tagged.length > 0 ? tagged : posts.slice(0, 9)).map((post) => (
            <BlogArticleCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-14">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
