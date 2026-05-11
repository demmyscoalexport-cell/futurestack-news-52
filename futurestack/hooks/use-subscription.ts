"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type Plan = "free" | "pro" | "team";

const FEATURE_GATES: Record<string, Plan[]> = {
  unlimited_stacks: ["pro", "team"],
  ask_ai_unlimited: ["pro", "team"],
  full_radar_archive: ["pro", "team"],
  comparison_history: ["pro", "team"],
  team_sharing: ["team"],
  api_access: ["team"],
  ad_free: ["pro", "team"],
  pro_newsletter: ["pro", "team"],
};

export function useSubscription() {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();
      if (profile?.plan) setPlan(profile.plan as Plan);
      setLoading(false);
    });
  }, []);

  const isPro = plan === "pro" || plan === "team";
  const isTeam = plan === "team";
  const isFree = plan === "free";

  const canUseFeature = useCallback(
    (featureName: string): boolean => {
      const allowedPlans = FEATURE_GATES[featureName];
      if (!allowedPlans) return true; // Unknown feature = allow
      return allowedPlans.includes(plan);
    },
    [plan],
  );

  const startUpgrade = useCallback(
    async (priceId: string, trigger: string) => {
      const { track } = await import("@/lib/analytics");
      track.upgradeStarted(plan, trigger);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    },
    [plan],
  );

  const openBillingPortal = useCallback(async () => {
    const res = await fetch("/api/stripe/portal");
    const { url, error } = await res.json();
    if (error) throw new Error(error);
    window.location.href = url;
  }, []);

  return {
    plan,
    isPro,
    isTeam,
    isFree,
    loading,
    canUseFeature,
    startUpgrade,
    openBillingPortal,
  };
}
