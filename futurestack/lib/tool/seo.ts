import type { Metadata } from "next";
import {
  getToolName,
  getToolSlug,
  getToolSummary,
  type ToolRecord,
} from "@/lib/tool-intelligence";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getdiscova.com";

export function buildToolMetadata(tool: ToolRecord): Metadata {
  const name = getToolName(tool);
  const slug = getToolSlug(tool);
  const description = getToolSummary(tool);

  return {
    title: `${name}: Reviews, Pricing, Tutorials & Alternatives | DISCOVA`,
    description,
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title: `${name} software intelligence page`,
      description,
      url: `${SITE_URL}/tools/${slug}`,
      images: [
        {
          url: `/api/og/tool?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `${name} UI Preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on DISCOVA`,
      description,
      images: [`/api/og/tool?slug=${slug}`],
    },
  };
}
