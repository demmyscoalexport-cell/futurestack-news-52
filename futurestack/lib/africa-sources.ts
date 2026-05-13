/**
 * DISCOVA — Africa Sources Registry
 *
 * - RSS feeds from major African tech publications
 * - GNews queries targeting Nigeria/Africa tech
 * - Africa scoring rubric for tools
 * - Curated list of Africa-built / Africa-friendly tools
 */

// ── RSS Feed Registry ─────────────────────────────────────────────────────────

export interface AfricaRssFeed {
  url: string;
  name: string;
  country: string;
  category: string;
  tags: string[];
}

export const AFRICA_RSS_FEEDS: AfricaRssFeed[] = [
  {
    url: "https://techpoint.africa/feed",
    name: "Techpoint Africa",
    country: "Nigeria",
    category: "africa-tech",
    tags: ["nigeria", "africa", "tech", "startup"],
  },
  {
    url: "https://techcabal.com/feed/",
    name: "TechCabal",
    country: "Pan-Africa",
    category: "africa-tech",
    tags: ["africa", "tech", "startup", "fintech"],
  },
  {
    url: "https://disrupt-africa.com/feed/",
    name: "Disrupt Africa",
    country: "Pan-Africa",
    category: "africa-tech",
    tags: ["africa", "startup", "investment", "innovation"],
  },
  {
    url: "https://venturesafrica.com/feed/",
    name: "Ventures Africa",
    country: "Pan-Africa",
    category: "africa-tech",
    tags: ["africa", "business", "tech", "enterprise"],
  },
  {
    url: "https://wee-tracker.com/feed/",
    name: "Wee Tracker",
    country: "Pan-Africa",
    category: "saas-news",
    tags: ["africa", "investment", "funding", "startup"],
  },
];

// ── GNews Queries for Africa-Relevant Tools & News ────────────────────────────

export const AFRICA_GNEWS_QUERIES = [
  { q: "Nigeria startup tech app 2025", category: "africa-tech" },
  { q: "African SaaS platform launch tools", category: "africa-tech" },
  { q: "Kenya Ghana fintech digital payment", category: "africa-tech" },
  { q: "Africa digital tools founders freelancers", category: "africa-tech" },
  { q: "Nigerian entrepreneur software business", category: "africa-tech" },
];

// ── Africa Scoring Rubric ─────────────────────────────────────────────────────
//
// Score 0–10:
//   >= 7 → africa_friendly = true, auto-approve (status = 'active')
//   >= 4 → africa_friendly = true, needs review (status = 'pending_review')
//   <  4 → africa_friendly = false, needs review

export interface AfricaScore {
  score: number;
  autoApprove: boolean;
  africaFriendly: boolean;
  reasons: string[];
}

export function scoreAfricaFriendly(tool: {
  hasFree?: boolean;
  pricingModel?: string;
  tags?: string[];
  name?: string;
  description?: string;
  tagline?: string;
  websiteUrl?: string;
}): AfricaScore {
  let score = 0;
  const reasons: string[] = [];
  const text = [tool.name, tool.description, tool.tagline, ...(tool.tags ?? [])]
    .join(" ")
    .toLowerCase();

  // 1. Free tier — most critical for African users
  if (tool.hasFree || tool.pricingModel === "free" || tool.pricingModel === "freemium") {
    score += 3;
    reasons.push("Has free tier");
  }

  // 2. Africa payment method support
  if (/paystack|flutterwave|m.?pesa|mobile.?money|interswitch|opay|wave\b/.test(text)) {
    score += 3;
    reasons.push("Accepts Africa payment methods");
  }

  // 3. Built in Africa or Africa-focused
  if (/nigeria|kenya|ghana|south africa|africa|lagos|nairobi|accra|abuja|cairo/.test(text)) {
    score += 2;
    reasons.push("Africa-focused");
  }

  // 4. Mobile-first (Android, WhatsApp, USSD)
  if (/\bmobile\b|android|whatsapp|ussd|\bapp\b/.test(text)) {
    score += 1;
    reasons.push("Mobile-friendly");
  }

  // 5. Affordable / USD pricing
  if (/affordable|budget|free plan|\$[0-9]|\busd\b/.test(text)) {
    score += 1;
    reasons.push("Affordable pricing");
  }

  // 6. Low-bandwidth / offline capable
  if (/offline|low.?bandwidth|lite|lightweight/.test(text)) {
    score += 1;
    reasons.push("Low-bandwidth friendly");
  }

  // 7. No geo-restriction mentioned
  if (/global|worldwide|international|available.everywhere/.test(text)) {
    score += 1;
    reasons.push("Global access");
  }

  return {
    score,
    autoApprove: score >= 7,
    africaFriendly: score >= 4,
    reasons,
  };
}

// ── Curated Africa-Built & Africa-Essential Tools ────────────────────────────
//
// These are inserted by sync-africa-tools.ts on first run.
// They are auto-approved (trusted sources).

export interface AfricaTool {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  pricingModel: "free" | "freemium" | "paid" | "enterprise";
  hasFree: boolean;
  africaFriendly: boolean;
  tags: string[];
  country: string;
}

export const AFRICA_CURATED_TOOLS: AfricaTool[] = [
  // ── Nigeria Fintech ────────────────────────────────────────────────────────
  {
    name: "Paystack",
    slug: "paystack",
    tagline: "Payments for Africa's ambitious businesses",
    description: "Accept payments from anyone, anywhere in Africa. Nigeria's leading payment gateway with Visa, Mastercard, bank transfer, and USSD support.",
    websiteUrl: "https://paystack.com",
    logoUrl: "https://logo.clearbit.com/paystack.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "payments", "fintech", "africa-built", "free"],
    country: "Nigeria",
  },
  {
    name: "Flutterwave",
    slug: "flutterwave",
    tagline: "Send and receive payments across Africa",
    description: "Pan-African payment infrastructure. Accept payments in 150+ currencies, pay vendors globally, and access financial services across 34+ African countries.",
    websiteUrl: "https://flutterwave.com",
    logoUrl: "https://logo.clearbit.com/flutterwave.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["africa", "payments", "fintech", "africa-built", "pan-african"],
    country: "Nigeria",
  },
  {
    name: "Moniepoint",
    slug: "moniepoint",
    tagline: "Africa's all-in-one business payments platform",
    description: "Business banking and payments for African SMEs. Pos terminals, online payments, payroll, and expense management built for Nigerian businesses.",
    websiteUrl: "https://moniepoint.com",
    logoUrl: "https://logo.clearbit.com/moniepoint.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "payments", "banking", "sme", "africa-built"],
    country: "Nigeria",
  },
  {
    name: "PiggyVest",
    slug: "piggyvest",
    tagline: "Nigeria's best savings and investment app",
    description: "Save money automatically, invest in fixed-income, and access pocket money when you need it. Nigeria's leading personal finance platform.",
    websiteUrl: "https://piggyvest.com",
    logoUrl: "https://logo.clearbit.com/piggyvest.com",
    category: "productivity",
    pricingModel: "free",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "savings", "fintech", "africa-built", "free"],
    country: "Nigeria",
  },
  {
    name: "Cowrywise",
    slug: "cowrywise",
    tagline: "Invest for your future, in Nigeria",
    description: "Investment platform for Nigerians. Mutual funds, dollar investments, and savings plans starting from ₦100. Mobile-first and low bandwidth.",
    websiteUrl: "https://cowrywise.com",
    logoUrl: "https://logo.clearbit.com/cowrywise.com",
    category: "productivity",
    pricingModel: "free",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "investment", "fintech", "africa-built", "free"],
    country: "Nigeria",
  },
  {
    name: "Kuda Bank",
    slug: "kuda-bank",
    tagline: "The bank of the free — zero fees for Nigerians",
    description: "Full digital bank for Nigerians. Zero maintenance fees, free transfers, budgeting tools, and instant account opening via mobile.",
    websiteUrl: "https://kudabank.com",
    logoUrl: "https://logo.clearbit.com/kudabank.com",
    category: "productivity",
    pricingModel: "free",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "banking", "fintech", "africa-built", "free", "mobile"],
    country: "Nigeria",
  },
  {
    name: "Chipper Cash",
    slug: "chipper-cash",
    tagline: "Send money across Africa for free",
    description: "Cross-border money transfers across 7 African countries. Free personal transfers, P2P payments, and bill payments via mobile.",
    websiteUrl: "https://chippercash.com",
    logoUrl: "https://logo.clearbit.com/chippercash.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["africa", "money-transfer", "fintech", "africa-built", "free", "pan-african"],
    country: "Nigeria",
  },
  {
    name: "Termii",
    slug: "termii",
    tagline: "Messaging and OTP API for African businesses",
    description: "Business messaging API for Africa. SMS, WhatsApp, voice OTP, and email notifications. Nigeria-first with 30+ African country coverage.",
    websiteUrl: "https://termii.com",
    logoUrl: "https://logo.clearbit.com/termii.com",
    category: "marketing",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "messaging", "api", "sms", "africa-built", "free"],
    country: "Nigeria",
  },
  {
    name: "Mono",
    slug: "mono",
    tagline: "Open banking data API for African developers",
    description: "Connect to Nigerian bank accounts, access financial data, and verify identities via API. Powers Africa's leading fintech apps.",
    websiteUrl: "https://mono.co",
    logoUrl: "https://logo.clearbit.com/mono.co",
    category: "code",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["nigeria", "open-banking", "api", "developer", "africa-built", "free"],
    country: "Nigeria",
  },
  {
    name: "Smile Identity",
    slug: "smile-identity",
    tagline: "KYC and identity verification built for Africa",
    description: "Verify identities across 30+ African countries using government IDs, biometrics, and liveness detection. No VPN required.",
    websiteUrl: "https://smileidentity.com",
    logoUrl: "https://logo.clearbit.com/smileidentity.com",
    category: "code",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["africa", "kyc", "identity", "api", "africa-built", "free"],
    country: "Pan-Africa",
  },
  // ── Kenya/East Africa ──────────────────────────────────────────────────────
  {
    name: "M-Pesa",
    slug: "m-pesa",
    tagline: "Africa's leading mobile money platform",
    description: "Mobile payments, money transfer, and financial services used by 50M+ people across Kenya, Tanzania, and 6 other African countries.",
    websiteUrl: "https://safaricom.co.ke/personal/m-pesa",
    logoUrl: "https://logo.clearbit.com/safaricom.co.ke",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["kenya", "mobile-money", "fintech", "africa-built", "free", "ussd"],
    country: "Kenya",
  },
  // ── Global tools with strong Africa adoption ──────────────────────────────
  {
    name: "Wave Accounting",
    slug: "wave-accounting",
    tagline: "Free accounting software for small businesses",
    description: "100% free accounting, invoicing, and receipt scanning for small businesses. No monthly fees — ideal for African SMEs and freelancers.",
    websiteUrl: "https://waveapps.com",
    logoUrl: "https://logo.clearbit.com/waveapps.com",
    category: "productivity",
    pricingModel: "free",
    hasFree: true,
    africaFriendly: true,
    tags: ["accounting", "invoicing", "free", "sme", "freelancer"],
    country: "Global",
  },
  {
    name: "Zoho CRM",
    slug: "zoho-crm",
    tagline: "Affordable CRM built for growing businesses",
    description: "CRM, email, project management, and HR tools starting from free. One of the most affordable enterprise suites for African businesses.",
    websiteUrl: "https://zoho.com",
    logoUrl: "https://logo.clearbit.com/zoho.com",
    category: "marketing",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["crm", "business", "affordable", "free", "mobile"],
    country: "Global",
  },
  {
    name: "Canva",
    slug: "canva",
    tagline: "Design anything — free for everyone",
    description: "Drag-and-drop graphic design platform. Free plan with 250k+ templates. Works in low bandwidth. Used by millions of African creators.",
    websiteUrl: "https://canva.com",
    logoUrl: "https://logo.clearbit.com/canva.com",
    category: "design",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["design", "free", "mobile", "creator", "low-bandwidth"],
    country: "Global",
  },
  {
    name: "Notion",
    slug: "notion",
    tagline: "All-in-one workspace for notes, docs, and projects",
    description: "Free for personal use. Combines notes, databases, wikis, and project management in one tool. Works great for African remote teams.",
    websiteUrl: "https://notion.so",
    logoUrl: "https://logo.clearbit.com/notion.so",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["productivity", "notes", "free", "remote-work", "docs"],
    country: "Global",
  },
  {
    name: "WhatsApp Business",
    slug: "whatsapp-business",
    tagline: "Sell and communicate with customers on WhatsApp",
    description: "Free business profile, catalog, and messaging tools on Africa's most-used app. Run your entire business communication on mobile.",
    websiteUrl: "https://business.whatsapp.com",
    logoUrl: "https://logo.clearbit.com/whatsapp.com",
    category: "marketing",
    pricingModel: "free",
    hasFree: true,
    africaFriendly: true,
    tags: ["whatsapp", "messaging", "mobile", "free", "nigeria", "africa"],
    country: "Global",
  },
  {
    name: "Google Workspace",
    slug: "google-workspace",
    tagline: "Gmail, Docs, Drive — free for everyone",
    description: "Google's suite of productivity tools. Free personal accounts with Gmail, Docs, Sheets, Drive, and Meet — essential for African freelancers.",
    websiteUrl: "https://workspace.google.com",
    logoUrl: "https://logo.clearbit.com/google.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["google", "productivity", "free", "docs", "email", "mobile"],
    country: "Global",
  },
  {
    name: "Mailchimp",
    slug: "mailchimp",
    tagline: "Email marketing free up to 500 contacts",
    description: "Send email newsletters, automations, and landing pages free for up to 500 contacts. Perfect for African small businesses.",
    websiteUrl: "https://mailchimp.com",
    logoUrl: "https://logo.clearbit.com/mailchimp.com",
    category: "marketing",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["email", "marketing", "free", "newsletter", "small-business"],
    country: "Global",
  },
  {
    name: "Freshdesk",
    slug: "freshdesk",
    tagline: "Free customer support software for growing teams",
    description: "Customer support ticketing free for unlimited agents on the Sprout plan. Used by thousands of African startups for customer service.",
    websiteUrl: "https://freshdesk.com",
    logoUrl: "https://logo.clearbit.com/freshdesk.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["support", "customer-service", "free", "saas"],
    country: "Global",
  },
  // ── African EdTech ─────────────────────────────────────────────────────────
  {
    name: "uLesson",
    slug: "ulesson",
    tagline: "Affordable education for African students",
    description: "Video-based learning for secondary school students in Nigeria, Ghana, Uganda, Rwanda, and Kenya. Works offline. Starts from ₦500/week.",
    websiteUrl: "https://ulesson.com",
    logoUrl: "https://logo.clearbit.com/ulesson.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["edtech", "nigeria", "africa-built", "offline", "mobile", "affordable"],
    country: "Nigeria",
  },
  // ── African Healthcare ────────────────────────────────────────────────────
  {
    name: "Helium Health",
    slug: "helium-health",
    tagline: "Hospital management software for Africa",
    description: "Electronic health records, practice management, and insurance billing for African hospitals and clinics. Used in 30+ countries.",
    websiteUrl: "https://heliumhealth.com",
    logoUrl: "https://logo.clearbit.com/heliumhealth.com",
    category: "productivity",
    pricingModel: "paid",
    hasFree: false,
    africaFriendly: true,
    tags: ["healthcare", "africa-built", "hospital", "emr", "nigeria"],
    country: "Nigeria",
  },
  // ── Freelancing / Remote Work ─────────────────────────────────────────────
  {
    name: "Andela",
    slug: "andela",
    tagline: "Connect with Africa's top tech talent",
    description: "Pan-African tech talent marketplace. Hire vetted African engineers and designers, or join as talent to work with global companies.",
    websiteUrl: "https://andela.com",
    logoUrl: "https://logo.clearbit.com/andela.com",
    category: "productivity",
    pricingModel: "freemium",
    hasFree: true,
    africaFriendly: true,
    tags: ["talent", "africa-built", "remote-work", "hiring", "pan-african"],
    country: "Nigeria",
  },
];
