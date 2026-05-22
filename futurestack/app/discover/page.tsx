import type { Metadata } from "next";
import type { Tool } from "@/lib/types";
import { getTools } from "@/lib/queries/tools";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover — Africa's Digital Discovery Engine | DISCOVA",
  description:
    "Discover trending tools, AI apps, and workflows curated for African users. Works on 3G. Android-optimized. Naira-friendly.",
};

interface PageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const { section } = await searchParams;

  const rawTools = await getTools({ limit: 100 });
  const tools = rawTools.map((row) => ({
    ...row,
    logo: resolveToolLogo(
      String(row.name ?? ""),
      (row.logo as string | null) ?? null,
      String(row.website_url ?? row.website ?? ""),
    ),
  })) as Tool[];

  return <DiscoverClient tools={tools} initialSection={section} />;
}
