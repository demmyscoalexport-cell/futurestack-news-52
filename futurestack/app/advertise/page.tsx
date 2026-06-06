import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Advertise on DISCOVA",
  description: "Advertising and sponsored placement information for DISCOVA.",
};

export default function AdvertisePage() {
  return (
    <MarketingInfoPage
      eyebrow="Advertise"
      title="Reach people actively researching software."
      description="DISCOVA advertising is designed for useful product education, verified discovery, tutorials, and clearly labeled sponsored visibility."
      points={[
        "Promotions should help users understand product fit, pricing, tutorials, and alternatives.",
        "Sponsored placements are separate from verification and editorial trust signals.",
        "Campaigns can support category pages, tool pages, newsletters, and learning content.",
        "DISCOVA prioritizes transparent, high-signal placements over intrusive ads.",
      ]}
      ctaLabel="Talk to sales"
      ctaHref="/contact"
    />
  );
}
