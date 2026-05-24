export function FeaturedOn() {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-6">
      <span className="text-[10px] font-semibold text-neutral-dim uppercase tracking-wider">
        Featured on
      </span>
      <div className="flex items-center gap-6 sm:gap-8">
        <a
          href="https://www.producthunt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-neutral-stroke/50 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-brand-primary/30 transition-colors"
        >
          <span className="text-base">🚀</span>
          Product Hunt
        </a>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-neutral-stroke/50 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-brand-primary/30 transition-colors"
        >
          <svg viewBox="0 0 76 65" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          Vercel
        </a>
      </div>
    </div>
  );
}
