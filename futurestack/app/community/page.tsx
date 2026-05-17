import type { Metadata } from "next";
import { CommunityClient } from "./community-client";

export const metadata: Metadata = {
  title: "Community — Africa's Digital Builder Network | DISCOVA",
  description:
    "Join 15,000+ African creators, founders, and builders. Share reviews, discover stacks, and grow together on DISCOVA.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
