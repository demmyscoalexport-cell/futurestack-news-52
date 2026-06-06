import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Privacy Policy | DISCOVA",
  description: "DISCOVA privacy policy overview.",
};

export default function PrivacyPage() {
  return (
    <MarketingInfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="DISCOVA is designed to protect user trust while enabling saved tools, discovery personalization, reviews, analytics, and product research workflows."
      points={[
        "We collect only the information needed to operate accounts, saved tools, submissions, reviews, analytics, and support.",
        "Server-only keys and service credentials must never be exposed to the browser.",
        "Analytics should be used to improve discovery quality, recommendations, and product reliability.",
        "A formal legal privacy policy should be reviewed before public launch.",
      ]}
      ctaLabel="Contact us"
      ctaHref="/contact"
    />
  );
}
