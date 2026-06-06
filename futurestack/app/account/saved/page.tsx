import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Saved Tools | DISCOVA",
  description: "Access your saved DISCOVA tools and collections.",
};

export default function SavedToolsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-neutral-stroke bg-neutral-surface/60 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-lilac">
            Saved tools
          </p>
          <h1 className="mt-4 text-4xl font-bold">Your saved DISCOVA tools</h1>
          <p className="mt-4 text-muted-foreground">
            Saved tools are available from your collections. Tool cards also save locally for fast browsing, and account-level saved tools can be connected to Supabase profiles as the user dashboard expands.
          </p>
          <Link
            href="/collections"
            className="mt-8 inline-flex rounded-input bg-brand-primary px-5 py-3 text-sm font-semibold text-neutral-white hover:bg-brand-primary/90"
          >
            Open collections
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
