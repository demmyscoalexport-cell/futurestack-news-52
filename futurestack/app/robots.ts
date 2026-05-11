import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/account"],
      },
    ],
    sitemap: "https://futurestack.live/sitemap.xml",
  };
}
