import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
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

const BASE_URL = "https://futurestack.live";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FutureStack News — Your AI-Powered Edge in SaaS & Automation",
    template: "%s | FutureStack News",
  },
  description:
    "Discover, compare, and build AI-powered tool stacks for freelancers, agencies, and SaaS founders. Weekly AI radar, smart comparisons, and expert reviews.",
  keywords: [
    "AI tools",
    "SaaS tools",
    "automation",
    "productivity",
    "AI news",
    "tool comparisons",
    "stack builder",
    "freelancer tools",
  ],
  authors: [{ name: "FutureStack News", url: BASE_URL }],
  creator: "FutureStack News",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "FutureStack News",
    title: "FutureStack News — Your AI-Powered Edge in SaaS & Automation",
    description:
      "Discover, compare, and build AI-powered tool stacks. Weekly AI radar, smart comparisons, expert reviews.",
    images: [
      {
        url: "/api/og/tool?slug=default",
        width: 1200,
        height: 630,
        alt: "FutureStack News",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@futurestack",
    title: "FutureStack News",
    description: "Your AI-Powered Edge in SaaS & Automation",
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
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
