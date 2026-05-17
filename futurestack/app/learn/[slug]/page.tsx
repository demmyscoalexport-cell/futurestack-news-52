import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { getGuideBySlug, getRelatedGuides } from "./guide-content";
import { GuideActions } from "./guide-actions";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

const difficultyColor: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Advanced: "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

/** Simple markdown → HTML converter */
function markdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  let inCodeBlock = false;
  let codeLines: string[] = [];

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

    // Code block open/close
    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
        closeList(); closeBlockquote();
        inCodeBlock = true;
        codeLines = [];
        const lang = trimmed.slice(3).trim();
        html.push(`<pre class="bg-secondary/60 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code class="language-${lang}">`);
      } else {
        html.push(codeLines.map(l => l.replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("\n"));
        html.push("</code></pre>");
        inCodeBlock = false;
        codeLines = [];
      }
      i++; continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++; continue;
    }

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

    // Table (simple)
    if (trimmed.startsWith("|")) {
      closeList(); closeBlockquote();
      if (!html[html.length - 1]?.includes("<table")) {
        html.push('<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse">');
      }
      const cells = trimmed.split("|").filter((c) => c.trim() !== "");
      if (cells.every((c) => /^[-: ]+$/.test(c))) {
        // separator row — skip
      } else {
        const isHeader = trimmed.includes("---") || (html[html.length - 1]?.includes("<table") && !html.join("").includes("<tr"));
        const tag = html.join("").split("<table").length === 2 && !html.join("").includes("<tr") ? "th" : "td";
        const cls = tag === "th"
          ? "border border-border/40 bg-secondary/40 px-3 py-2 text-left font-semibold text-foreground"
          : "border border-border/40 px-3 py-2 text-foreground/80";
        html.push(`<tr>${cells.map(c => `<${tag} class="${cls}">${inlineFormat(c.trim())}</${tag}>`).join("")}</tr>`);
      }
      i++;
      // Check if next line is still a table row
      if (i >= lines.length || !lines[i].trim().startsWith("|")) {
        html.push("</table></div>");
      }
      continue;
    }

    // Close open table if we moved past it
    if (html[html.length - 1]?.includes("<tr") && !html.join("").endsWith("</table></div>")) {
      const lastTableIdx = html.lastIndexOf(html.find(h => h.includes("<table"))!);
      if (!html.join("").endsWith("</table></div>")) {
        html.push("</table></div>");
      }
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

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) notFound();

  const relatedGuides = getRelatedGuides(slug, guide.category, 3);
  const bodyHtml = markdownToHtml(guide.content);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/30 bg-gradient-to-b from-background to-secondary/10 py-10 lg:py-14">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/learn" className="hover:text-foreground transition-colors">Learn</Link>
              <span>/</span>
              <Link
                href={`/learn?category=${encodeURIComponent(guide.category)}`}
                className="hover:text-foreground transition-colors"
              >
                {guide.category}
              </Link>
              <span>/</span>
              <span className="text-foreground line-clamp-1 max-w-[200px]">{guide.title}</span>
            </nav>

            {/* Back link */}
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Learn
            </Link>

            {/* Badge row */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 px-3 py-1 text-xs text-cyan-300">
                <GraduationCap className="h-3 w-3" />
                {guide.category}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs ${difficultyColor[guide.level]}`}>
                {guide.level}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-foreground lg:text-4xl xl:text-5xl leading-tight max-w-4xl">
              {guide.emoji} {guide.title}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {guide.desc}
            </p>

            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {guide.readTime}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Free guide
              </span>
            </div>

            <GuideActions title={guide.title} slug={slug} />
          </div>
        </section>

        {/* Content */}
        <section className="py-10 lg:py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex gap-12 max-w-5xl mx-auto">
              {/* Main content */}
              <article className="flex-1 min-w-0">
                {/* Decorative header bar */}
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-primary mb-8" />

                {bodyHtml ? (
                  <div
                    className="text-base [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 [&_p]:text-foreground/85 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_li]:text-foreground/85 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:italic [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-secondary/60 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:border-border/40 [&_hr]:my-8 [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:text-sm [&_th]:border [&_th]:border-border/40 [&_th]:bg-secondary/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border/40 [&_td]:px-3 [&_td]:py-2 [&_td]:text-foreground/80"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Content coming soon...</p>
                )}

                {/* CTA */}
                <div className="mt-12 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 via-primary/10 to-cyan-900/20 p-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Ready to put this into practice?
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Discover the best tools for your workflow on DISCOVA — curated for African founders and creators.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/tools"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                      Explore Tools <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/learn"
                      className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      More Guides
                    </Link>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="hidden xl:block w-72 shrink-0">
                <div className="sticky top-24 space-y-6">
                  {/* Guide meta */}
                  <div className="rounded-xl border border-border/40 bg-card p-5">
                    <h4 className="font-semibold text-foreground mb-4 text-sm">About this Guide</h4>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{guide.readTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span>{guide.level} level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span>{guide.category}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <GuideActions title={guide.title} slug={slug} variant="sidebar" />
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-900/10 p-5">
                    <h4 className="font-semibold text-foreground mb-2 text-sm">Weekly learning digest</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Get 1 actionable guide and 1 tool deep-dive every week, free.
                    </p>
                    <NewsletterForm variant="inline" />
                  </div>

                  {/* Related guides */}
                  {relatedGuides.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-card p-5">
                      <h4 className="font-semibold text-foreground mb-4 text-sm">Related Guides</h4>
                      <div className="space-y-3">
                        {relatedGuides.map((related) => (
                          <Link
                            key={related.slug}
                            href={`/learn/${related.slug}`}
                            className="flex items-start gap-2.5 group"
                          >
                            <span className="text-lg shrink-0 mt-0.5">{related.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {related.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{related.readTime}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Related guides (mobile/tablet) */}
        {relatedGuides.length > 0 && (
          <section className="border-t border-border/30 bg-secondary/10 py-10 lg:py-14">
            <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Keep Learning</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/learn">
                    All guides <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedGuides.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/learn/${related.slug}`}
                    className="block rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{related.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${difficultyColor[related.level]}`}>
                            {related.level}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                          {related.title}
                        </h3>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{related.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
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

export async function generateStaticParams() {
  const { GUIDES } = await import("./guide-content");
  return GUIDES.map((g) => ({ slug: g.slug }));
}
