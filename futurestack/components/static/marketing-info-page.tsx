import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface MarketingInfoPageProps {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function MarketingInfoPage({
  eyebrow,
  title,
  description,
  points,
  ctaLabel = "Explore DISCOVA",
  ctaHref = "/tools",
}: MarketingInfoPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-lilac">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {points.map((point) => (
              <div
                key={point}
                className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/60 p-5 text-sm leading-7 text-muted-foreground"
              >
                {point}
              </div>
            ))}
          </div>
          <Link
            href={ctaHref}
            className="mt-10 inline-flex rounded-input bg-brand-primary px-5 py-3 text-sm font-semibold text-neutral-white hover:bg-brand-primary/90"
          >
            {ctaLabel}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
