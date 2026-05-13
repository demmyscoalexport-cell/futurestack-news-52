import type { Metadata } from "next";
import { getTools } from "@/lib/queries/tools";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { DiscoverClient } from "./discover-client";

export const metadata: Metadata = {
  title: "Discover — Africa's Digital Discovery Engine | DISCOVA",
  description:
    "Discover trending tools, AI apps, and workflows curated for African users. Works on 3G. Android-optimized. Naira-friendly.",
};

export default async function DiscoverPage() {
  const rawTools = await getTools({ limit: 100 });
  const tools = rawTools.map((row: Record<string, unknown>) => ({
    ...row,
    logo: resolveToolLogo(
      String(row.name ?? ""),
      row.logo as string | null,
      row.website as string,
    ),
  }));

  return <DiscoverClient tools={tools} />;
}
