export function FutureStackScoreBadge({ score }: { score: number }) {
  const tier =
    score >= 85
      ? "Exceptional"
      : score >= 70
        ? "Strong"
        : score >= 55
          ? "Good"
          : "Needs Work";
  const color =
    score >= 85
      ? "text-emerald-400"
      : score >= 70
        ? "text-indigo-400"
        : score >= 55
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 border border-slate-200 dark:border-slate-700 w-fit">
      <div className={`text-2xl font-black tabular-nums ${color}`}>
        {score.toFixed(1)}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
        <div className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px]">
          {tier}
        </div>
        <div>DISCOVA Score™</div>
      </div>
    </div>
  );
}
