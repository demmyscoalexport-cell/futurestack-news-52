"use client";

import { useState, useEffect } from "react";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthRoutes } from "@/components/providers/auth-mode-provider";

interface SaveToolButtonProps {
  toolId: string;
  toolSlug: string;
  className?: string;
}

export function SaveToolButton({
  toolId,
  toolSlug,
  className,
}: SaveToolButtonProps) {
  const router = useRouter();
  const { signIn } = useAuthRoutes();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!toolId) {
      setChecking(false);
      return;
    }
    fetch(`/api/save-tool?toolId=${encodeURIComponent(toolId)}`)
      .then((r) => r.json())
      .then((d) => setSaved(d.saved ?? false))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [toolId]);

  async function handleToggle() {
    if (loading || checking) return;
    setLoading(true);

    try {
      const res = await fetch("/api/save-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });

      if (res.status === 401) {
        router.push(`${signIn}?redirectTo=/tools/${toolSlug}`);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const isSaved = saved;

  return (
    <button
      onClick={handleToggle}
      disabled={loading || checking}
      className={
        className ||
        `flex-1 inline-flex justify-center items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isSaved
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
        }`
      }
    >
      {loading || checking ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <BookmarkPlus className="w-4 h-4" />
      )}
      {isSaved ? "Saved" : "Save Tool"}
    </button>
  );
}
