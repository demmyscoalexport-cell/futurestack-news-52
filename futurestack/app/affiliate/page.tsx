import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "DISCOVA Affiliate Program",
  description: "Learn about DISCOVA affiliate and partner opportunities.",
};

export default function AffiliatePage() {
  return (
    <MarketingInfoPage
      eyebrow="Affiliate Program"
      title="Partner with DISCOVA."
      description="DISCOVA supports tracked partner links and affiliate workflows for software vendors, creators, and ecosystem partners."
      points={[
        "Affiliate links are tracked through DISCOVA redirect routes for attribution.",
        "Sponsored and partner placements should remain clearly labeled and separate from verification.",
        "Partners can support tutorials, offers, product education, and regional software access.",
        "Contact the team to discuss fit, compliance, and disclosure requirements.",
      ]}
      ctaLabel="Contact partnerships"
      ctaHref="/contact"
    />
  );
}
