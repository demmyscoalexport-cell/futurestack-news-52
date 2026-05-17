import type { Metadata } from "next";
import { OpportunitiesClient } from "./opportunities-client";

export const metadata: Metadata = {
  title: "Opportunities — Jobs, Grants & Gigs for Africa | DISCOVA",
  description:
    "Remote jobs, startup grants, scholarships, AI gigs, freelance opportunities, and fellowships curated for African creators and founders.",
};

export default function OpportunitiesPage() {
  return <OpportunitiesClient />;
}
