"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ArticleContentProps {
  content: string;
  className?: string;
}

function processMarkdown(md: string): string {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre class="blog-code-block" data-lang="${lang || "code"}"><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class='blog-inline-code'>$1</code>");

  // Headings (with IDs for ToC)
  html = html.replace(/^#### (.+)$/gm, (_, t) => {
    const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h4 id="${id}" class="blog-h4">${t}</h4>`;
  });
  html = html.replace(/^### (.+)$/gm, (_, t) => {
    const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h3 id="${id}" class="blog-h3">${t}</h3>`;
  });
  html = html.replace(/^## (.+)$/gm, (_, t) => {
    const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h2 id="${id}" class="blog-h2">${t}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, t) => {
    const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h1 id="${id}" class="blog-h1">${t}</h1>`;
  });

  // Blockquote
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="blog-blockquote">$1</blockquote>'
  );

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr class='blog-hr' />");

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="blog-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="blog-image" loading="lazy" />'
  );

  // Unordered lists
  html = html.replace(
    /((?:^[-*+] .+\n?)+)/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^[-*+] /, "")}</li>`)
        .join("");
      return `<ul class="blog-ul">${items}</ul>`;
    }
  );

  // Ordered lists
  html = html.replace(
    /((?:^\d+\. .+\n?)+)/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol class="blog-ol">${items}</ol>`;
    }
  );

  // Paragraphs
  const lines = html.split("\n\n");
  html = lines
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.startsWith("<ol") ||
        block.startsWith("<pre") ||
        block.startsWith("<blockquote") ||
        block.startsWith("<hr") ||
        block.startsWith("<img") ||
        block.trim() === ""
      )
        return block;
      return `<p class="blog-p">${block}</p>`;
    })
    .join("\n\n");

  return html;
}

export function ArticleContent({ content, className }: ArticleContentProps) {
  useEffect(() => {
    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll(".blog-code-block");
    codeBlocks.forEach((block) => {
      if (block.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className = "copy-btn";
      btn.addEventListener("click", () => {
        const code = block.querySelector("code");
        if (!code) return;
        navigator.clipboard.writeText(code.textContent ?? "");
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 2000);
      });
      (block as HTMLElement).style.position = "relative";
      block.appendChild(btn);
    });
  }, [content]);

  return (
    <>
      <style>{`
        .blog-prose h1.blog-h1 {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: var(--foreground);
          font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
          scroll-margin-top: 96px;
        }
        .blog-prose h2.blog-h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
          padding-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--border) / 0.4);
          scroll-margin-top: 96px;
        }
        .blog-prose h3.blog-h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
          color: var(--foreground);
          scroll-margin-top: 96px;
        }
        .blog-prose h4.blog-h4 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--foreground);
          scroll-margin-top: 96px;
        }
        .blog-prose p.blog-p {
          font-size: 1rem;
          line-height: 1.8;
          margin-bottom: 1.25rem;
          color: hsl(var(--foreground) / 0.9);
        }
        .blog-prose strong {
          font-weight: 700;
          color: var(--foreground);
        }
        .blog-prose em {
          font-style: italic;
        }
        .blog-prose a.blog-link {
          color: #7c66ff;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .blog-prose a.blog-link:hover {
          color: #c0b3ff;
        }
        .blog-prose ul.blog-ul {
          list-style: none;
          padding-left: 0;
          margin-bottom: 1.25rem;
        }
        .blog-prose ul.blog-ul li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          line-height: 1.7;
          color: hsl(var(--foreground) / 0.9);
        }
        .blog-prose ul.blog-ul li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #7c66ff;
          font-weight: 600;
        }
        .blog-prose ol.blog-ol {
          list-style: none;
          counter-reset: list-counter;
          padding-left: 0;
          margin-bottom: 1.25rem;
        }
        .blog-prose ol.blog-ol li {
          counter-increment: list-counter;
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          line-height: 1.7;
          color: hsl(var(--foreground) / 0.9);
        }
        .blog-prose ol.blog-ol li::before {
          content: counter(list-counter) ".";
          position: absolute;
          left: 0;
          color: #7c66ff;
          font-weight: 700;
          font-size: 0.875rem;
          top: 0.1rem;
        }
        .blog-prose blockquote.blog-blockquote {
          border-left: 3px solid #7c66ff;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          background: rgba(124, 102, 255, 0.05);
          border-radius: 0 12px 12px 0;
          font-size: 1.05rem;
          font-style: italic;
          color: hsl(var(--foreground) / 0.85);
        }
        .blog-prose pre.blog-code-block {
          background: #0d0c14;
          border: 1px solid hsl(var(--border) / 0.4);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.7;
        }
        .blog-prose pre.blog-code-block code {
          background: none;
          padding: 0;
          color: #e2e0f0;
          font-family: var(--font-mono, 'Geist Mono', monospace);
        }
        .blog-prose pre.blog-code-block .copy-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(124, 102, 255, 0.15);
          border: 1px solid rgba(124, 102, 255, 0.3);
          color: #c0b3ff;
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .blog-prose pre.blog-code-block .copy-btn:hover {
          background: rgba(124, 102, 255, 0.3);
        }
        .blog-prose code.blog-inline-code {
          background: hsl(var(--secondary));
          padding: 0.2em 0.45em;
          border-radius: 6px;
          font-size: 0.88em;
          font-family: var(--font-mono, 'Geist Mono', monospace);
          color: #c0b3ff;
          border: 1px solid hsl(var(--border) / 0.4);
        }
        .blog-prose img.blog-image {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid hsl(var(--border) / 0.3);
        }
        .blog-prose hr.blog-hr {
          border: none;
          border-top: 1px solid hsl(var(--border) / 0.4);
          margin: 2rem 0;
        }
      `}</style>
      <div
        className={cn("blog-prose", className)}
        dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
      />
    </>
  );
}
