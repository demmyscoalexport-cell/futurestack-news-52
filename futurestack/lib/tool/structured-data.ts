import {
  fieldBool,
  getCategoryLabel,
  getFaqs,
  getHeroVisual,
  getPricingLabel,
  getRating,
  getReviewCount,
  getToolName,
  getToolSlug,
  getToolSummary,
  getToolWebsite,
  getVideos,
  type ToolRecord,
  youtubeEmbedUrl,
} from "@/lib/tool-intelligence";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getdiscova.com";

export function buildToolPageSchemas(tool: ToolRecord) {
  const name = getToolName(tool);
  const slug = getToolSlug(tool);
  const pageUrl = `${SITE_URL}/tools/${slug}`;
  const faqs = getFaqs(tool);
  const videos = getVideos(tool);
  const rating = getRating(tool);
  const reviewCount = getReviewCount(tool);

  const softwareApp: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description: getToolSummary(tool),
    applicationCategory: getCategoryLabel(tool),
    operatingSystem: "Web, iOS, Android",
    url: pageUrl,
    image: getHeroVisual(tool) || (typeof tool.logo === "string" ? tool.logo : undefined),
    offers: {
      "@type": "Offer",
      price: fieldBool(tool, ["has_free", "freeTier"]) ? "0" : "Contact vendor",
      priceCurrency: "USD",
      description: getPricingLabel(tool),
    },
  };

  if (rating > 0 && reviewCount > 0) {
    softwareApp.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  const schemas: Record<string, unknown>[] = [
    softwareApp,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tools", item: `${SITE_URL}/tools` },
        { "@type": "ListItem", position: 2, name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    ...videos.map((video) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: `${name} tutorial and product walkthrough on DISCOVA.`,
      thumbnailUrl: video.thumbnail ? [video.thumbnail] : undefined,
      embedUrl: youtubeEmbedUrl(video.youtubeUrl),
    })),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${name} on DISCOVA`,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "DISCOVA", url: SITE_URL },
      about: { "@type": "SoftwareApplication", name, url: getToolWebsite(tool) || pageUrl },
    },
  ];

  return schemas;
}
