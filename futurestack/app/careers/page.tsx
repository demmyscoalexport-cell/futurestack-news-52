import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Careers at DISCOVA",
  description: "Explore future roles and opportunities to help build DISCOVA.",
};

export default function CareersPage() {
  return (
    <MarketingInfoPage
      eyebrow="Careers"
      title="Help build the future of software discovery."
      description="DISCOVA is building a trusted discovery ecosystem for software, AI tools, tutorials, comparisons, and workflow intelligence."
      points={[
        "Future roles will span product, engineering, content, partnerships, research, and community.",
        "We value builders who care about trust, usefulness, performance, and practical user outcomes.",
        "Our platform needs people who can turn complex software markets into clear user decisions.",
        "Check back as DISCOVA expands hiring and contributor programs.",
      ]}
      ctaLabel="View opportunities"
      ctaHref="/opportunities"
    />
  );
}
