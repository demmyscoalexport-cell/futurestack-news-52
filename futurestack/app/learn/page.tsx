import type { Metadata } from "next";
import { LearnClient } from "./learn-client";

export const metadata: Metadata = {
  title: "Learn — Digital Skills for Africa | DISCOVA",
  description:
    "Free tutorials, guides, and courses on AI tools, no-code, digital marketing, and modern workflows — built for African learners.",
};

export default function LearnPage() {
  return <LearnClient />;
}
