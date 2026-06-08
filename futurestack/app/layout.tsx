import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ClerkAuthBridge } from "@/components/providers/clerk-auth-bridge";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/discovery/mobile-bottom-nav";
import { config } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const BASE_URL = "https://getdiscova.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "DISCOVA — Software Intelligence Platform",
    template: "%s | DISCOVA",
  },
  description:
    "Discover, research, compare, and evaluate the world's best software. The operating system for software intelligence.",
  keywords: [
    "AI tools",
    "software discovery",
    "tool comparison",
    "SaaS intelligence",
    "product research",
    "software reviews",
  ],
  authors: [{ name: "DISCOVA", url: BASE_URL }],
  creator: "DISCOVA",
  icons: {
    icon: [{ url: "/discova-logo.png", type: "image/png" }],
    apple: [{ url: "/discova-logo.png" }],
  },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "DISCOVA",
    title: "DISCOVA — Software Intelligence Platform",
    description:
      "The most trusted platform for discovering, researching, and comparing software.",
    images: [
      {
        url: "/api/og/tool?slug=default",
        width: 1200,
        height: 630,
        alt: "DISCOVA — Software Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@discovaHQ",
    title: "DISCOVA — Software Intelligence Platform",
    description: "Discover, research, compare, and evaluate software without leaving DISCOVA.",
    images: ["/api/og/tool?slug=default"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#06030e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authTree = config.clerk.isConfigured ? (
    <ClerkAuthBridge
      publishableKey={config.clerk.publishableKey}
      signInUrl={config.clerk.signInUrl}
      signUpUrl={config.clerk.signUpUrl}
      afterSignInUrl={config.clerk.afterSignInUrl}
      afterSignUpUrl={config.clerk.afterSignUpUrl}
    >
      {children}
    </ClerkAuthBridge>
  ) : (
    <AuthProvider>{children}</AuthProvider>
  );

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{page_path:window.location.pathname});`}
            </Script>
          </>
        )}
      </head>
      <body className="font-sans antialiased bg-background text-foreground pb-mobile-nav">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>{authTree}</ErrorBoundary>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
        <MobileBottomNav />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
