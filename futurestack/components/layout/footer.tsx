import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Twitter, Linkedin, Youtube, Github, Instagram } from "lucide-react";

const footerLinks = {
  discover: [
    { name: "Tools Directory", href: "/tools" },
    { name: "Compare Tools", href: "/compare" },
    { name: "My Collections", href: "/collections" },
    { name: "Power Stacks", href: "/stacks" },
    { name: "Workflows", href: "/workflows" },
    { name: "Opportunities", href: "/opportunities" },
    { name: "Africa Hub", href: "/africa" },
    { name: "Deals", href: "/deals" },
  ],
  community: [
    { name: "Community", href: "/community" },
    { name: "Insights & News", href: "/news" },
    { name: "Submit a Tool", href: "/submit-tool" },
    { name: "Enterprise", href: "/enterprise" },
    { name: "Affiliate Program", href: "/affiliate" },
    { name: "Advertise", href: "/advertise" },
  ],
  company: [
    { name: "About DISCOVA", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Press Kit", href: "/press" },
    { name: "API Docs", href: "/docs" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

const socialLinks = [
  { name: "Twitter/X", href: "https://twitter.com/discovaHQ", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com/company/discova", icon: Linkedin },
  { name: "YouTube", href: "https://youtube.com/@discovaHQ", icon: Youtube },
  { name: "Instagram", href: "https://instagram.com/discovaHQ", icon: Instagram },
  { name: "GitHub", href: "https://github.com/discova", icon: Github },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 lg:px-8">

        {/* Newsletter */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs text-primary mb-3">
                🌍 Africa&apos;s Digital Weekly
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Stay ahead of Africa&apos;s digital revolution
              </h3>
              <p className="mt-2 text-muted-foreground">
                Top tools, opportunities, and workflows curated for African builders — every Tuesday. Join 15,000+ subscribers.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <Input type="email" placeholder="Enter your email" className="flex-1" />
              <Button>Subscribe Free</Button>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="1.5" fill="white"/>
                  <line x1="10" y1="3" x2="10" y2="5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="10" y1="14.5" x2="10" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="5.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14.5" y1="10" x2="17" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-black text-lg tracking-tight text-foreground">
                DIS<span className="gradient-text">COVA</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Africa&apos;s digital discovery operating system. Built for African realities. Designed for global ambition.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              🌍 Africa Discovers. Africa Decides.
            </div>
            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Discover</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Community</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 lg:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DISCOVA. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for Africa and emerging markets. Designed for global ambition. 🌍
          </p>
        </div>
      </div>
    </footer>
  );
}
