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

const BASE_URL = "https://discova.africa";

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
    icon: [
      { url: "/discova-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/discova-logo.png" },
    ],
  },
  alternates: {
    canonical: BASE_URL,
  },
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
