import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Twitter, Linkedin, Youtube, Github } from "lucide-react";

const footerLinks = {
  explore: [
    { name: "Tools Directory", href: "/tools" },
    { name: "Stacks", href: "/stacks" },
    { name: "Stack Builder", href: "/stack-builder" },
    { name: "News Archive", href: "/news" },
  ],
  resources: [
    { name: "API Docs", href: "/docs" },
    { name: "Submit a Tool", href: "/submit-tool" },
    { name: "Advertise", href: "/advertise" },
    { name: "Affiliate Program", href: "/affiliate" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Press Kit", href: "/press" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

const socialLinks = [
  {
    name: "Twitter",
    href: "https://twitter.com/futurestacknews",
    icon: Twitter,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/futurestacknews",
    icon: Linkedin,
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@futurestacknews",
    icon: Youtube,
  },
  { name: "GitHub", href: "https://github.com/futurestacknews", icon: Github },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        {/* Newsletter Section */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h3 className="text-xl font-semibold text-foreground">
                AI-Tool Radar Newsletter
              </h3>
              <p className="mt-2 text-muted-foreground">
                Get the top 5 AI tools + 1 hidden gem every Tuesday. Join
                12,000+ subscribers.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">
                FutureStack<span className="text-primary">News</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your AI-Powered Edge in SaaS & Automation. Discover, compare, and
              build tool stacks.
            </p>
            {/* Social Links */}
            <div className="mt-6 flex gap-2">
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

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-foreground">Explore</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
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
            &copy; {new Date().getFullYear()} FutureStack News. All rights
            reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for freelancers, agencies, and SaaS founders worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
