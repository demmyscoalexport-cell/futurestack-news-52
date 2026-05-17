/**
 * Inngest function: auto-affiliate
 *
 * Listens to discova/tool.added events and automatically assigns an
 * affiliate link to every new tool.
 *
 * Logic:
 *  1. Check if the tool's domain is in our known-affiliate-programs registry.
 *     If yes → use the tracked partner URL with our ref.
 *  2. Otherwise → build a UTM-tracked URL:
 *     {website}?ref=discova&utm_source=discova&utm_medium=directory&utm_campaign=tool-discovery
 *     This still tracks clicks through our /api/affiliate/[slug] redirect, even
 *     without a formal commission arrangement.
 */
import { inngest } from "../client";
import { db } from "@/lib/db";

// ── Known affiliate / referral programs ─────────────────────────────────────
// Format: domain (no www) → { affiliateUrl, partnerName, commissionRate }
// Add new entries here as you join more programs.
const KNOWN_PROGRAMS: Record<
  string,
  { affiliateUrl: string; partnerName: string; commissionRate: number }
> = {
  "notion.so": {
    affiliateUrl: "https://affiliate.notion.so/discova",
    partnerName: "Notion",
    commissionRate: 50,
  },
  "canva.com": {
    affiliateUrl: "https://partner.canva.com/c/discova",
    partnerName: "Canva",
    commissionRate: 30,
  },
  "webflow.com": {
    affiliateUrl: "https://webflow.com/?r=discova",
    partnerName: "Webflow",
    commissionRate: 50,
  },
  "convertkit.com": {
    affiliateUrl: "https://convertkit.com/?lmref=discova",
    partnerName: "ConvertKit",
    commissionRate: 30,
  },
  "kit.com": {
    affiliateUrl: "https://kit.com/?lmref=discova",
    partnerName: "Kit (ConvertKit)",
    commissionRate: 30,
  },
  "framer.com": {
    affiliateUrl: "https://www.framer.com/?via=discova",
    partnerName: "Framer",
    commissionRate: 20,
  },
  "typedream.com": {
    affiliateUrl: "https://typedream.com/?via=discova",
    partnerName: "Typedream",
    commissionRate: 30,
  },
  "beehiiv.com": {
    affiliateUrl: "https://www.beehiiv.com/?via=discova",
    partnerName: "Beehiiv",
    commissionRate: 30,
  },
  "lemlist.com": {
    affiliateUrl: "https://lemlist.com/?via=discova",
    partnerName: "Lemlist",
    commissionRate: 30,
  },
  "loom.com": {
    affiliateUrl: "https://www.loom.com/referrals/discova",
    partnerName: "Loom",
    commissionRate: 0,
  },
  "airtable.com": {
    affiliateUrl: "https://airtable.com/invite/r/discova",
    partnerName: "Airtable",
    commissionRate: 0,
  },
  "typeform.com": {
    affiliateUrl: "https://www.typeform.com/?tf_via=discova",
    partnerName: "Typeform",
    commissionRate: 0,
  },
  "descript.com": {
    affiliateUrl: "https://get.descript.com/discova",
    partnerName: "Descript",
    commissionRate: 15,
  },
  "jasper.ai": {
    affiliateUrl: "https://www.jasper.ai/?fpr=discova",
    partnerName: "Jasper AI",
    commissionRate: 25,
  },
  "writesonic.com": {
    affiliateUrl: "https://writesonic.com/?via=discova",
    partnerName: "Writesonic",
    commissionRate: 30,
  },
  "copy.ai": {
    affiliateUrl: "https://www.copy.ai/?via=discova",
    partnerName: "Copy.ai",
    commissionRate: 45,
  },
  "surfer": {
    affiliateUrl: "https://surferseo.com?fp_ref=discova",
    partnerName: "Surfer SEO",
    commissionRate: 25,
  },
  "semrush.com": {
    affiliateUrl: "https://www.semrush.com/partner/discova",
    partnerName: "SEMrush",
    commissionRate: 40,
  },
  "mailerlite.com": {
    affiliateUrl: "https://www.mailerlite.com/a/discova",
    partnerName: "MailerLite",
    commissionRate: 30,
  },
  "systeme.io": {
    affiliateUrl: "https://systeme.io/?sa=sa00discova",
    partnerName: "Systeme.io",
    commissionRate: 60,
  },
  "tidio.com": {
    affiliateUrl: "https://www.tidio.com/?via=discova",
    partnerName: "Tidio",
    commissionRate: 30,
  },
  "zapier.com": {
    affiliateUrl: "https://zapier.com/?utm_source=discova&utm_medium=referral",
    partnerName: "Zapier",
    commissionRate: 0,
  },
  "make.com": {
    affiliateUrl: "https://www.make.com/en/register?pc=discova",
    partnerName: "Make",
    commissionRate: 20,
  },
  "pipedrive.com": {
    affiliateUrl: "https://www.pipedrive.com/?via=discova",
    partnerName: "Pipedrive",
    commissionRate: 20,
  },
  "freshdesk.com": {
    affiliateUrl: "https://freshdesk.com/?via=discova",
    partnerName: "Freshdesk",
    commissionRate: 15,
  },
};

function extractRootDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    // Keep last 2 parts for most domains, last 3 for co.xx etc.
    if (parts.length > 2 && parts[parts.length - 2].length <= 3) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

function buildUtmUrl(website: string, slug: string): string {
  try {
    const url = new URL(website);
    url.searchParams.set("ref", "discova");
    url.searchParams.set("utm_source", "discova");
    url.searchParams.set("utm_medium", "directory");
    url.searchParams.set("utm_campaign", "tool-discovery");
    url.searchParams.set("utm_content", slug);
    return url.toString();
  } catch {
    // Fallback if URL parsing fails
    const sep = website.includes("?") ? "&" : "?";
    return `${website}${sep}ref=discova&utm_source=discova&utm_medium=directory&utm_campaign=tool-discovery`;
  }
}

export const autoAffiliate = inngest.createFunction(
  {
    id: "auto-affiliate",
    name: "Auto-Assign Affiliate Links",
    concurrency: { limit: 5 },
    triggers: [{ event: "discova/tool.added" }],
  },
  async ({ event, step, logger }) => {
    const { slug, name, website } = event.data as {
      slug: string;
      name: string;
      website: string;
    };

    if (!website) {
      logger.warn(`No website URL for ${name} (${slug}) — skipping affiliate assignment`);
      return { skipped: true, reason: "no_website" };
    }

    // Step 1: Look up tool ID
    const tool = await step.run("lookup-tool", async () => {
      const { rows } = await db.query<{ id: string }>(
        "SELECT id FROM tools WHERE slug = $1 LIMIT 1",
        [slug],
      );
      return rows[0] ?? null;
    });

    if (!tool) {
      logger.warn(`Tool ${slug} not found in DB — may not have inserted yet`);
      return { skipped: true, reason: "tool_not_found" };
    }

    // Step 2: Check if affiliate link already exists (idempotent)
    const existing = await step.run("check-existing-affiliate", async () => {
      const { rows } = await db.query(
        "SELECT id FROM affiliate_links WHERE tool_id = $1",
        [tool.id],
      );
      return rows[0] ?? null;
    });

    if (existing) {
      logger.info(`Affiliate link already exists for ${slug}`);
      return { skipped: true, reason: "already_exists" };
    }

    // Step 3: Determine the affiliate URL to use
    const affiliateData = await step.run("resolve-affiliate-url", async () => {
      const domain = extractRootDomain(website);
      const known = domain ? KNOWN_PROGRAMS[domain] : null;

      if (known) {
        logger.info(`Found known affiliate program for ${name}: ${known.partnerName} (${known.commissionRate}% commission)`);
        return {
          affiliate_url: known.affiliateUrl,
          partner_name: known.partnerName,
          commission_rate: known.commissionRate,
          notes: `Auto-assigned: known affiliate program for ${domain}`,
        };
      }

      // Build UTM-tracked URL (no commission, but tracks traffic)
      const utmUrl = buildUtmUrl(website, slug);
      logger.info(`No known program for ${name} (${domain}) — using UTM tracking: ${utmUrl}`);
      return {
        affiliate_url: utmUrl,
        partner_name: "UTM Tracked",
        commission_rate: 0,
        notes: `Auto-generated UTM tracking link. Upgrade to paid affiliate program when available.`,
      };
    });

    // Step 4: Insert the affiliate link
    await step.run("insert-affiliate-link", async () => {
      await db.query(
        `INSERT INTO affiliate_links (tool_id, affiliate_url, partner_name, commission_rate, notes, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (tool_id) DO NOTHING`,
        [
          tool.id,
          affiliateData.affiliate_url,
          affiliateData.partner_name,
          affiliateData.commission_rate,
          affiliateData.notes,
        ],
      );
      logger.info(`Affiliate link inserted for ${name} (${slug})`);
    });

    return {
      slug,
      name,
      affiliate_url: affiliateData.affiliate_url,
      partner_name: affiliateData.partner_name,
      commission_rate: affiliateData.commission_rate,
    };
  },
);
