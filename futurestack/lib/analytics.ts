"use client";

import posthog from "posthog-js";

// Only initialize on client, not during SSR
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: false, // We handle this manually
  });
}

export const track = {
  toolViewed: (toolSlug: string, source: string) =>
    posthog.capture("tool_viewed", { tool_slug: toolSlug, source }),

  toolSaved: (toolSlug: string) =>
    posthog.capture("tool_saved", { tool_slug: toolSlug }),

  stackBuilt: (role: string, toolCount: number) =>
    posthog.capture("stack_built", { role, tool_count: toolCount }),

  stackSaved: (stackId: string) =>
    posthog.capture("stack_saved", { stack_id: stackId }),

  reviewSubmitted: (toolSlug: string) =>
    posthog.capture("review_submitted", { tool_slug: toolSlug }),

  searchPerformed: (query: string, resultsCount: number) =>
    posthog.capture("search_performed", { query, results_count: resultsCount }),

  upgradeStarted: (plan: string, trigger: string) =>
    posthog.capture("upgrade_started", { plan, trigger }),

  askAIUsed: (toolSlug: string) =>
    posthog.capture("ask_ai_used", { tool_slug: toolSlug }),

  comparisonViewed: (tool1: string, tool2: string) =>
    posthog.capture("comparison_viewed", { tool_1: tool1, tool_2: tool2 }),

  pageViewed: (path: string) => posthog.capture("$pageview", { path }),

  radarViewed: (week: number) => posthog.capture("radar_viewed", { week }),

  emailSubscribed: (source: string) =>
    posthog.capture("email_subscribed", { source }),
};

export default posthog;
