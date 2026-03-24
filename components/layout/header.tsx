'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  Search,
  Menu,
  X,
  Layers,
  Newspaper,
  Wrench,
  LayoutGrid,
  Hammer,
  Radio,
  User,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navigation = [
  { name: 'Home', href: '/', icon: Layers },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Tools', href: '/tools', icon: Wrench },
  { name: 'Stacks', href: '/stacks', icon: LayoutGrid },
  { name: 'Builder', href: '/stack-builder', icon: Hammer },
  { name: 'Radar', href: '/radar', icon: Radio },
]

export function Header() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold text-foreground sm:inline-block">
            FutureStack<span className="text-primary">News</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground',
                pathname === item.href
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="hidden sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Login Button */}
          <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
            <Link href="/dashboard">
              <User className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>

          {/* CTA Button */}
          <Button size="sm" className="hidden sm:flex" asChild>
            <Link href="/stack-builder">Build Stack</Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Layers className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold">FutureStack</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile Search */}
                <div className="border-b border-border p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tools, articles..."
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 space-y-1 p-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary',
                        pathname === item.href
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Mobile CTA */}
                <div className="border-t border-border p-4 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/stack-builder" onClick={() => setIsMobileMenuOpen(false)}>
                      Build Your Stack
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Search Overlay */}
      {isSearchOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-background p-4 shadow-lg">
          <div className="container mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tools, articles, stacks..."
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
