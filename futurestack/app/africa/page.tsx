import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getTools } from "@/lib/queries/tools";
import { resolveToolLogo } from "@/lib/logo-resolver";
import { AfricaClient } from "./africa-client";

export const metadata: Metadata = {
  title: "Africa Hub — Tools Built for African Realities | DISCOVA",
  description:
    "Discover digital tools rated for African users — works on 3G, Android-optimized, Naira-friendly, and Paystack-compatible.",
};

export default async function AfricaPage() {
  const rawTools = await getTools({ limit: 48 });
  const tools = rawTools.map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    logo: resolveToolLogo(String(row.name ?? ""), row.logo as string | null, row.website as string),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[100px]" />
            <div className="absolute top-10 right-1/3 h-[300px] w-[300px] rounded-full bg-green-600/6 blur-[80px]" />
          </div>
          <div className="container relative mx-auto px-4 lg:px-6 py-14 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-6 font-semibold">
                Africa Hub
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-5xl mb-4">
                Tools built for<br />
                <span className="gradient-text">African realities</span>
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto mb-6">
                Does it work on MTN? Can Nigerians pay for it? Does it run on Android? Does it need VPN? We answer these questions so you don&apos;t have to.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 font-medium">
                Africa Discovers. Africa Decides.
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-6 py-10">
          <AfricaClient tools={tools} />
        </div>

      </main>
      <Footer />
    </div>
  );
}
