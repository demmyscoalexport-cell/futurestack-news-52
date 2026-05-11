"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface ProGateProps {
  children: ReactNode;
  feature?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  requireTeam?: boolean;
}

export function ProGate({
  children,
  feature,
  fallbackTitle = "Pro Feature",
  fallbackDescription = "Upgrade to FutureStack Pro to unlock this feature.",
  requireTeam = false,
}: ProGateProps) {
  const { plan, isPro, isTeam, loading } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-800/50 rounded-2xl h-32 w-full" />
    );
  }

  const hasAccess = requireTeam ? isTeam : isPro;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Blurred preview of the content */}
      <div className="pointer-events-none select-none blur-sm opacity-40 saturate-0">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{fallbackTitle}</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
          {fallbackDescription}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm"
        >
          <Zap className="w-4 h-4" />
          {requireTeam ? "Upgrade to Team" : "Upgrade to Pro"} — 14-day free
          trial
        </Link>
      </div>
    </div>
  );
}
