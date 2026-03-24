import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FutureStack News - Your AI-Powered Edge in SaaS & Automation',
    template: '%s | FutureStack News',
  },
  description: 'Discover, compare, and build AI-powered tool stacks for freelancers, agencies, and SaaS founders. Stay ahead with the latest AI tools and automation strategies.',
  keywords: ['AI tools', 'SaaS', 'automation', 'productivity', 'freelancer tools', 'agency stack', 'no-code'],
  authors: [{ name: 'FutureStack News' }],
  creator: 'FutureStack News',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'FutureStack News',
    title: 'FutureStack News - Your AI-Powered Edge in SaaS & Automation',
    description: 'Discover, compare, and build AI-powered tool stacks for freelancers, agencies, and SaaS founders.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutureStack News',
    description: 'Your AI-Powered Edge in SaaS & Automation',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
