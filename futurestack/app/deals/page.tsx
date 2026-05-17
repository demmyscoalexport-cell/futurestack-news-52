import type { Metadata } from "next";
import { DealsClient } from "./deals-client";

export const metadata: Metadata = {
  title: "Deals — Best Tool Discounts for Africa | DISCOVA",
  description:
    "Exclusive deals, discounts, and lifetime offers on the best digital tools — curated for African creators, founders, and businesses.",
};

export default function DealsPage() {
  return <DealsClient />;
}
