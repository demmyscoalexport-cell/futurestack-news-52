import type { Metadata } from "next";
import { getBlogIndexMeta } from "@/lib/blog/seo";
import { buildWebsiteSchema, buildBlogSchema } from "@/lib/blog/structured-data";

export const metadata: Metadata = getBlogIndexMeta();

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([buildWebsiteSchema(), buildBlogSchema()]),
        }}
      />
      {children}
    </>
  );
}
