import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BlogAuthor } from "@/lib/blog/types";

interface AuthorCardProps {
  author: BlogAuthor;
  variant?: "inline" | "full" | "mini";
  className?: string;
}

export function AuthorCard({ author, variant = "inline", className }: AuthorCardProps) {
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (variant === "mini") {
    return (
      <Link
        href={`/blog/author/${author.slug}`}
        className={cn("flex items-center gap-2 group", className)}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={author.avatar} />
          <AvatarFallback className="text-[10px] bg-brand-primary/10 text-brand-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground group-hover:text-brand-lilac transition-colors">
          {author.name}
        </span>
      </Link>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("rounded-discova-lg border border-neutral-stroke/60 bg-neutral-surface p-6", className)}>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={author.avatar} />
            <AvatarFallback className="text-xl bg-brand-primary/10 text-brand-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/blog/author/${author.slug}`}
              className="font-bold text-lg text-foreground hover:text-brand-lilac transition-colors"
            >
              {author.name}
            </Link>
            {author.role && (
              <p className="text-sm text-brand-primary mt-0.5 font-medium">{author.role}</p>
            )}
            {author.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{author.bio}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {author.twitter && (
                <a
                  href={`https://twitter.com/${author.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {author.linkedin && (
                <a
                  href={`https://linkedin.com/in/${author.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* inline */
  return (
    <Link
      href={`/blog/author/${author.slug}`}
      className={cn("flex items-center gap-3 group", className)}
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={author.avatar} />
        <AvatarFallback className="text-sm bg-brand-primary/10 text-brand-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium text-foreground group-hover:text-brand-lilac transition-colors">
          {author.name}
        </p>
        {author.role && (
          <p className="text-xs text-muted-foreground">{author.role}</p>
        )}
      </div>
    </Link>
  );
}
