import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "DISCOVA Docs",
  description: "Documentation hub for DISCOVA platform, submissions, APIs, and integrations.",
};

export default function DocsPage() {
  return (
    <MarketingInfoPage
      eyebrow="Docs"
      title="DISCOVA documentation hub."
      description="This hub will collect platform documentation for tool submissions, editorial standards, API workflows, Contentful operations, and Supabase-powered product intelligence."
      points={[
        "Tool owners can use the Submit Tool flow to request listings and updates.",
        "Editors can use Contentful models for long-form descriptions, videos, galleries, FAQs, and verification status.",
        "Developers can use the documented Supabase migration and Contentful setup guides before deploy.",
        "API and integration documentation will expand as public integrations are enabled.",
      ]}
      ctaLabel="Read setup guide"
      ctaHref="/methodology"
    />
  );
}
