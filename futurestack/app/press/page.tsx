import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "DISCOVA Press Kit",
  description: "Press and media information for DISCOVA.",
};

export default function PressPage() {
  return (
    <MarketingInfoPage
      eyebrow="Press"
      title="DISCOVA press and media resources."
      description="DISCOVA is a software discovery platform combining rich product intelligence, tutorials, comparisons, collections, and verified listings."
      points={[
        "Positioning: software and AI discovery ecosystem, not a generic directory.",
        "Audience: founders, creators, businesses, students, agencies, and teams.",
        "Core surfaces: premium tool cards, product intelligence pages, video learning, and comparisons.",
        "Press inquiries can use the contact page while the full media kit is prepared.",
      ]}
      ctaLabel="Contact DISCOVA"
      ctaHref="/contact"
    />
  );
}
