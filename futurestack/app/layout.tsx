import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/discovery/mobile-bottom-nav";
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
    default: "DISCOVA — Africa's Digital Discovery Operating System",
    template: "%s | DISCOVA",
  },
  description:
    "Discover tools, apps, workflows, and opportunities built for African realities. The operating system for smarter work across Africa and emerging markets.",
  keywords: [
    "AI tools Africa",
    "digital tools Nigeria",
    "apps for Africa",
    "startup tools",
    "creator tools Africa",
    "Naija apps",
    "African tech",
    "productivity Africa",
    "tool discovery",
    "workflow builder",
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
    title: "DISCOVA — Africa Discovers. Africa Decides.",
    description:
      "The digital discovery operating system for Africa and emerging markets. Find tools that actually work for African life.",
    images: [
      {
        url: "/api/og/tool?slug=default",
        width: 1200,
        height: 630,
        alt: "DISCOVA — Africa's Digital Discovery Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@discovaHQ",
    title: "DISCOVA — Africa Discovers. Africa Decides.",
    description: "The digital discovery operating system for Africa and emerging markets.",
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
          <AuthProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <MobileBottomNav />
        <Analytics />
      </body>
    </html>
  );
}
