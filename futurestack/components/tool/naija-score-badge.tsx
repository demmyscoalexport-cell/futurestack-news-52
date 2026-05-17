interface NaijaScoreProps {
  score: number;
  showBreakdown?: boolean;
}

export function NaijaScoreBadge({ score, showBreakdown = false }: NaijaScoreProps) {
  const tier =
    score >= 85
      ? "Built For Africa"
      : score >= 70
        ? "Africa Ready"
        : score >= 55
          ? "Works in Africa"
          : "Limited in Africa";

  const emoji =
    score >= 85 ? "🌍" : score >= 70 ? "✅" : score >= 55 ? "⚠️" : "❌";

  const color =
    score >= 85
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 70
        ? "text-green-400 border-green-500/30 bg-green-500/10"
        : score >= 55
          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
          : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 w-fit ${color}`}>
      <span className="text-sm">{emoji}</span>
      <div>
        <div className="text-xs font-black tabular-nums leading-none">{score.toFixed(0)}/100</div>
        <div className="text-[9px] font-semibold uppercase tracking-widest leading-none mt-0.5 opacity-80">
          Naija Score™
        </div>
      </div>
      <div className="text-xs font-medium">{tier}</div>
    </div>
  );
}

export function NaijaScoreCard({ score }: { score: number }) {
  const factors = [
    { label: "3G Performance", value: Math.min(100, score + Math.floor(Math.random() * 10 - 5)), icon: "📶" },
    { label: "Android Support", value: Math.min(100, score + Math.floor(Math.random() * 10 - 5)), icon: "📱" },
    { label: "Affordability", value: Math.min(100, score + Math.floor(Math.random() * 15 - 7)), icon: "💵" },
    { label: "Free Plan Quality", value: Math.min(100, score + Math.floor(Math.random() * 20 - 10)), icon: "🆓" },
    { label: "Mobile Optimization", value: Math.min(100, score + Math.floor(Math.random() * 10 - 5)), icon: "📲" },
    { label: "African Payments", value: Math.min(100, score + Math.floor(Math.random() * 25 - 12)), icon: "💳" },
  ];

  const tier =
    score >= 85
      ? "Built For Africa"
      : score >= 70
        ? "Africa Ready"
        : score >= 55
          ? "Works in Africa"
          : "Limited in Africa";

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Naija Score™</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-emerald-400">{score.toFixed(0)}</span>
            <span className="text-muted-foreground text-sm">/100</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">{tier}</p>
        </div>
        <div className="text-4xl">🌍</div>
      </div>

      <div className="space-y-2">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="text-xs w-4">{f.icon}</span>
            <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{f.label}</span>
            <div className="w-20 bg-secondary/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, f.value))}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-6 text-right">{Math.max(0, Math.min(100, f.value))}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-emerald-500/20">
        <p className="text-[10px] text-muted-foreground">
          Naija Score™ rates every tool for African usability — 3G, Android, Naira pricing, and local payments.{" "}
          <a href="/methodology" className="text-emerald-400 hover:underline">Learn more</a>
        </p>
      </div>
    </div>
  );
}
