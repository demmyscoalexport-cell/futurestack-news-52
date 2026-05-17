import type { Metadata } from "next";
import { WorkflowsClient } from "./workflows-client";

export const metadata: Metadata = {
  title: "Workflows — How Tools Work Together | DISCOVA",
  description:
    "Step-by-step workflow guides for creators, founders, and businesses in Africa. Learn how to combine tools for maximum impact.",
};

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
