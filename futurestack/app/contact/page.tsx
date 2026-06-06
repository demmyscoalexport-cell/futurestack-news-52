import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Contact DISCOVA",
  description: "Contact DISCOVA for partnerships, support, sales, editorial, and platform questions.",
};

export default function ContactPage() {
  return (
    <MarketingInfoPage
      eyebrow="Contact"
      title="Talk to the DISCOVA team."
      description="Use this page as the central contact destination for partnerships, enterprise sales, editorial inquiries, and platform support."
      points={[
        "Sales and enterprise: request a guided walkthrough for teams and organizations.",
        "Editorial: submit updates, corrections, tutorials, or verified product information.",
        "Partnerships: discuss integrations, sponsored placements, and regional programs.",
        "Support: report broken links, listing issues, or account questions.",
      ]}
      ctaLabel="Submit a tool"
      ctaHref="/submit-tool"
    />
  );
}
