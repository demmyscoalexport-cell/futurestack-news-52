'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CheckCircle, Loader2, Mail, Users, Shield, Send } from 'lucide-react'

interface NewsletterFormProps {
  variant?: 'default' | 'inline' | 'hero'
  className?: string
}

export function NewsletterForm({ variant = 'default', className }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setStatus('success')
    setEmail('')
  }

  if (status === 'success') {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl bg-success/10 p-4 text-success', className)}>
        <CheckCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">You&apos;re subscribed!</p>
          <p className="text-sm text-success/80">Check your inbox for confirmation.</p>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={cn('rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8', className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">AI-Tool Radar</h3>
            <p className="text-muted-foreground">Weekly Newsletter</p>
          </div>
        </div>

        <p className="mt-4 text-foreground">
          Get the top 5 AI tools + 1 hidden gem every Tuesday.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            12,000+ subscribers
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-success" />
            No spam, ever
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-success" />
            Unsubscribe anytime
          </span>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe Free'
          )}
        </Button>
      </form>

      {/* Trust indicators */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-success" />
          12,000+ subscribers
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-success" />
          No spam
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-success" />
          Unsubscribe anytime
        </span>
      </div>
    </div>
  )
}
