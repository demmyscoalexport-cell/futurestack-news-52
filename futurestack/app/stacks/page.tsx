import { getPublicStacks } from "@/lib/queries/stacks";
import { stacks as fallbackStacks } from "@/lib/data";
import { StacksContent } from "./stacks-content";

export const metadata = {
  title: "Curated AI Stacks",
  description:
    "Browse pre-built AI tool stacks for freelancers, agencies, and SaaS founders. Clone and customize.",
};

export default async function StacksPage() {
  const stacks = await getPublicStacks({ limit: 50 });
  return (
    <StacksContent initialStacks={stacks.length ? stacks : fallbackStacks} />
  );
}
