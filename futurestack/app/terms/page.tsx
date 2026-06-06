import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Terms of Service | DISCOVA",
  description: "DISCOVA terms of service overview.",
};

export default function TermsPage() {
  return (
    <MarketingInfoPage
      eyebrow="Terms"
      title="Terms of Service"
      description="These terms summarize how users, tool owners, partners, and contributors should use DISCOVA responsibly."
      points={[
        "Tool listings, reviews, and submissions must be accurate, lawful, and non-spammy.",
        "DISCOVA may moderate, update, reject, or remove content that harms user trust.",
        "Verification and sponsored placement are separate systems with separate trust meanings.",
        "A formal legal terms document should be reviewed before public launch.",
      ]}
      ctaLabel="Explore tools"
      ctaHref="/tools"
    />
  );
}
