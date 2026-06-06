import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "Cookie Policy | DISCOVA",
  description: "DISCOVA cookie policy overview.",
};

export default function CookiesPage() {
  return (
    <MarketingInfoPage
      eyebrow="Cookies"
      title="Cookie Policy"
      description="DISCOVA uses cookies and local browser storage where needed for authentication, saved tools, analytics, and product experience improvements."
      points={[
        "Authentication cookies keep users signed in securely.",
        "Local storage supports saved tools and lightweight personalization in the browser.",
        "Analytics cookies may help understand usage patterns and improve discovery quality.",
        "A formal cookie consent flow should be reviewed before public launch in regulated markets.",
      ]}
      ctaLabel="Manage account"
      ctaHref="/account"
    />
  );
}
