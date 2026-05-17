export interface Guide {
  id: number;
  slug: string;
  title: string;
  desc: string;
  readTime: string;
  readTimeMinutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  emoji: string;
  featured: boolean;
}

export const GUIDES: Guide[] = [
  {
    id: 1,
    slug: "ai-tools-african-creators",
    title: "Complete Guide to AI Tools for African Creators",
    desc: "Everything a Nigerian, Ghanaian, or Kenyan creator needs to know about using AI tools effectively in 2026.",
    readTime: "15 min read",
    readTimeMinutes: 15,
    level: "Beginner",
    category: "AI Tools",
    emoji: "🤖",
    featured: true,
  },
  {
    id: 2,
    slug: "whatsapp-business-system",
    title: "How to Build a WhatsApp Business System From Scratch",
    desc: "Step-by-step guide to setting up a complete WhatsApp commerce system — catalog, orders, payments, and customer follow-up.",
    readTime: "12 min read",
    readTimeMinutes: 12,
    level: "Beginner",
    category: "Business",
    emoji: "💬",
    featured: true,
  },
  {
    id: 3,
    slug: "no-code-saas-2026",
    title: "No-Code SaaS in 2026: Build Your First Product",
    desc: "How African founders are launching software businesses without writing a single line of code.",
    readTime: "20 min read",
    readTimeMinutes: 20,
    level: "Intermediate",
    category: "No-Code",
    emoji: "🚀",
    featured: false,
  },
  {
    id: 4,
    slug: "freelancing-with-ai",
    title: "Freelancing with AI: Double Your Income in 90 Days",
    desc: "How to use AI tools to dramatically increase your freelancing output and attract international clients.",
    readTime: "18 min read",
    readTimeMinutes: 18,
    level: "Intermediate",
    category: "Freelancing",
    emoji: "💼",
    featured: false,
  },
  {
    id: 5,
    slug: "free-design-tools-african-smbs",
    title: "Best Free Design Tools for African SMBs",
    desc: "Design professional materials without paying for Adobe. A complete guide to free and freemium design tools.",
    readTime: "10 min read",
    readTimeMinutes: 10,
    level: "Beginner",
    category: "Design",
    emoji: "🎨",
    featured: false,
  },
  {
    id: 6,
    slug: "paystack-flutterwave-developer-guide",
    title: "Understanding Paystack + Flutterwave: A Developer's Guide",
    desc: "Integrate African payment gateways into your web and mobile applications with step-by-step code examples.",
    readTime: "25 min read",
    readTimeMinutes: 25,
    level: "Advanced",
    category: "Developer",
    emoji: "💳",
    featured: false,
  },
];
