import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { StackShareClient } from "./stack-share-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: stack } = await supabase
    .from("stacks")
    .select("name, description, profiles(full_name)")
    .eq("id", id)
    .single();

  if (!stack) return { title: "Stack Not Found" };

  const author = (stack.profiles as any)?.full_name || "A FutureStack User";
  return {
    title: `${stack.name} — AI Stack by ${author}`,
    description:
      stack.description ||
      `${author}'s curated AI tool stack on FutureStack News`,
    openGraph: {
      title: `${stack.name} — AI Stack by ${author} | FutureStack News`,
      description: stack.description || `See ${author}'s full AI tool stack`,
      images: [{ url: `/api/og/stack?id=${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${stack.name} — AI Stack`,
      images: [`/api/og/stack?id=${id}`],
    },
  };
}

async function getStack(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stacks")
    .select(
      `
      *,
      profiles(full_name, avatar_url),
      stack_tools(
        position,
        tools(id, name, slug, logo, tagline, tool_scores(futurestack_score))
      )
    `,
    )
    .eq("id", id)
    .single();
  return data;
}

export default async function StackPage({ params }: PageProps) {
  const { id } = await params;
  const stack = await getStack(id);
  if (!stack) return notFound();

  const tools = (stack.stack_tools || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((st: any) => st.tools)
    .filter(Boolean);

  return <StackShareClient stack={stack} tools={tools} stackId={id} />;
}
