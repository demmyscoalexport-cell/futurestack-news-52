import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getCategoryStyle, getCategoryName, formatBlogDate } from "@/lib/blog/utils";
import type { BlogListItem } from "@/lib/blog/types";

interface BlogArticleCardProps {
  post: BlogListItem;
  variant?: "default" | "featured" | "horizontal" | "compact" | "minimal";
  className?: string;
  priority?: boolean;
}

const authorInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function BlogArticleCard({
  post,
  variant = "default",
  className,
  priority = false,
}: BlogArticleCardProps) {
  const href = `/blog/${post.slug}`;
  const catStyle = getCategoryStyle(post.category.slug);
  const catName = post.category.name || getCategoryName(post.category.slug);

  /* ── Featured (large hero card) ──────────────────────────────────── */
  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-discova-lg border border-neutral-stroke/60",
          "bg-neutral-surface hover:border-brand-primary/40 card-lift transition-all duration-300",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary/40">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-deep/95 via-neutral-deep/20 to-transparent z-10" />
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              priority={priority}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-violet-900/20 to-neutral-deep" />
          )}
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
          <Badge
            variant="outline"
            className={cn("text-xs mb-3 font-medium border", catStyle)}
          >
            {catName}
          </Badge>
          <h2 className="text-xl font-bold font-heading text-white line-clamp-2 group-hover:text-brand-lilac transition-colors leading-snug">
            {post.title}
          </h2>
          <p className="mt-2 text-sm text-neutral-dim line-clamp-2">{post.excerpt}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-brand-primary/20 text-brand-lilac">
                  {authorInitials(post.author.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-white">{post.author.name}</p>
                <p className="text-[10px] text-neutral-dim">
                  {formatBlogDate(post.publishedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-dim">
              <Clock className="h-3 w-3" />
              {post.readingTime} min read
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Horizontal ──────────────────────────────────────────────────── */
  if (variant === "horizontal") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex gap-4 p-4 rounded-discova-lg border border-neutral-stroke/60",
          "bg-neutral-surface hover:border-brand-primary/40 transition-all duration-200 card-lift",
          className
        )}
      >
        <div className="relative h-20 w-28 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="128px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-violet-900/20" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <Badge
            variant="outline"
            className={cn("text-[10px] w-fit mb-1.5 border font-medium", catStyle)}
          >
            {catName}
          </Badge>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-brand-lilac transition-colors leading-snug">
            {post.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{post.author.name}</span>
            <span>·</span>
            <span>{formatBlogDate(post.publishedAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {post.readingTime} min
            </span>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Compact ─────────────────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group flex gap-3", className)}>
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
          {post.featuredImage ? (
            <Image src={post.featuredImage} alt={post.title} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-violet-900/20" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-brand-lilac transition-colors leading-snug">
            {post.title}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBlogDate(post.publishedAt)} · {post.readingTime} min
          </p>
        </div>
      </Link>
    );
  }

  /* ── Minimal (list row) ──────────────────────────────────────────── */
  if (variant === "minimal") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0 hover:opacity-80 transition-opacity",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="outline" className={cn("text-[10px] shrink-0 border font-medium", catStyle)}>
            {catName}
          </Badge>
          <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-brand-lilac transition-colors">
            {post.title}
          </h4>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          <span className="hidden sm:block">{formatBlogDate(post.publishedAt)}</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    );
  }

  /* ── Default card ────────────────────────────────────────────────── */
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-discova-lg border border-neutral-stroke/60",
        "bg-neutral-surface hover:border-brand-primary/40 card-lift transition-all duration-300",
        className
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary/40">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            priority={priority}
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-primary/10 via-violet-900/15 to-neutral-surface">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <span className="text-xl">✦</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={cn("text-xs border font-medium", catStyle)}
          >
            {catName}
          </Badge>
          {post.featured && (
            <Badge variant="outline" className="text-xs border border-brand-gold/30 bg-brand-gold/10 text-brand-gold font-medium">
              Featured
            </Badge>
          )}
        </div>

        <h3 className="font-semibold font-heading text-foreground line-clamp-2 group-hover:text-brand-lilac transition-colors leading-snug text-[15px]">
          {post.title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-[10px] bg-brand-primary/10 text-brand-primary font-medium">
                {authorInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium text-foreground leading-none">
                {post.author.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatBlogDate(post.publishedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {post.readingTime} min
          </div>
        </div>
      </div>
    </Link>
  );
}
