export type UserRole =
  | "founder"
  | "developer"
  | "designer"
  | "marketer"
  | "student"
  | "agency"
  | "freelancer"
  | "creator";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface UserPreferences {
  role: UserRole | "";
  industry: string;
  goals: string[];
  interests: string[];
  experience: ExperienceLevel | "";
  existingTools: string[];
  monthlyBudget: number;
  africaFocus: boolean;
  onboardingCompleted: boolean;
  updatedAt: string;
}

export const STORAGE_KEY = "discova-preferences";

export const DEFAULT_PREFERENCES: UserPreferences = {
  role: "",
  industry: "",
  goals: [],
  interests: [],
  experience: "",
  existingTools: [],
  monthlyBudget: 50,
  africaFocus: false,
  onboardingCompleted: false,
  updatedAt: "",
};

export const ROLE_OPTIONS: { id: UserRole; label: string; desc: string }[] = [
  { id: "founder", label: "Founder / Startup", desc: "Ship faster with the right MVP stack" },
  { id: "developer", label: "Developer", desc: "Code, deploy, and automate with AI" },
  { id: "designer", label: "Designer / Creative", desc: "Design, video, and brand assets" },
  { id: "marketer", label: "Marketer", desc: "Growth, content, and campaigns" },
  { id: "student", label: "Student", desc: "Learn, research, and build projects" },
  { id: "agency", label: "Agency Owner", desc: "Scale client delivery and ops" },
  { id: "freelancer", label: "Freelancer", desc: "Win clients and deliver faster" },
  { id: "creator", label: "Content Creator", desc: "YouTube, social, and audience growth" },
];

export const INDUSTRY_OPTIONS = [
  "SaaS & Tech",
  "E-commerce",
  "Education",
  "Media & Entertainment",
  "Finance & Fintech",
  "Healthcare",
  "Real Estate",
  "Non-profit / NGO",
  "African SME / Local Business",
  "Other",
];

export const GOAL_OPTIONS = [
  "Write content faster",
  "Automate workflows",
  "Build apps & MVPs",
  "Generate images & video",
  "Analyze data",
  "Improve sales & marketing",
  "Learn new skills",
  "Reduce tool costs",
];

export const INTEREST_OPTIONS = [
  "Writing AI",
  "Coding assistants",
  "Design & UI",
  "Video & audio",
  "Automation",
  "AI agents",
  "Productivity",
  "Africa-friendly tools",
];

const ROLE_SEARCH: Record<UserRole, string> = {
  founder: "startup founder AI tools MVP",
  developer: "AI coding assistant developer",
  designer: "AI design tools creative",
  marketer: "AI marketing growth tools",
  student: "best AI tools for students free",
  agency: "agency automation AI stack",
  freelancer: "freelancer productivity AI",
  creator: "content creator AI video writing",
};

const GOAL_SEARCH: Record<string, string> = {
  "Write content faster": "AI writing assistant",
  "Automate workflows": "workflow automation no-code",
  "Build apps & MVPs": "AI app builder coding",
  "Generate images & video": "AI video image generator",
  "Analyze data": "AI data analysis research",
  "Improve sales & marketing": "AI sales marketing CRM",
  "Learn new skills": "AI learning education tools",
  "Reduce tool costs": "free AI tools budget",
};

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  const payload = { ...prefs, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function buildPersonalizedSearchQuery(prefs: UserPreferences): string {
  const parts: string[] = [];
  if (prefs.role && ROLE_SEARCH[prefs.role]) parts.push(ROLE_SEARCH[prefs.role]);
  for (const goal of prefs.goals.slice(0, 2)) {
    if (GOAL_SEARCH[goal]) parts.push(GOAL_SEARCH[goal]);
  }
  if (prefs.africaFocus || prefs.industry.includes("African")) parts.push("Africa friendly");
  if (prefs.monthlyBudget <= 0) parts.push("free");
  return parts.join(" ").trim() || "trending AI tools";
}

export function getRecommendedCategories(prefs: UserPreferences): string[] {
  const map: Partial<Record<UserRole, string[]>> = {
    founder: ["productivity", "automation", "code", "marketing"],
    developer: ["code", "automation", "productivity", "data"],
    designer: ["design", "video", "writing"],
    marketer: ["marketing", "writing", "analytics", "automation"],
    student: ["writing", "productivity", "education", "code"],
    agency: ["automation", "productivity", "marketing", "design"],
    freelancer: ["writing", "productivity", "design", "marketing"],
    creator: ["video", "writing", "design", "audio"],
  };
  const base = prefs.role ? map[prefs.role] ?? ["writing", "productivity"] : ["writing", "productivity"];
  if (prefs.interests.includes("Africa-friendly tools")) return [...base, "africa"];
  return base;
}
