import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Star, Users } from 'lucide-react'
import type { Stack } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StackCardProps {
  stack: Stack
  variant?: 'default' | 'featured' | 'compact'
  onClone?: (stack: Stack) => void
  className?: string
}

const roleColors: Record<string, string> = {
  'freelancer': 'bg-success/10 text-success border-success/20',
  'agency': 'bg-primary/10 text-primary border-primary/20',
  'saas-founder': 'bg-accent/10 text-accent border-accent/20',
}

const roleLabels: Record<string, string> = {
  'freelancer': 'Freelancer',
  'agency': 'Agency',
  'saas-founder': 'SaaS Founder',
}

export function StackCard({ stack, variant = 'default', onClone, className }: StackCardProps) {
  const displayTools = stack.tools.slice(0, 4)
  const remainingCount = stack.tools.length - 4

  if (variant === 'featured') {
    return (
      <Card className={cn('relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent', className)}>
        <div className="p-6">
          {/* Tool Icons */}
          <div className="flex items-center gap-2">
            {displayTools.map((tool) => (
              <div
                key={tool.id}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ring-2 ring-background"
                title={tool.name}
              >
                <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                +{remainingCount}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mt-4">
            <Link href={`/stacks/${stack.slug}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              {stack.name}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {stack.description}
            </p>
          </div>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className={cn('text-xs', roleColors[stack.targetRole])}>
              {roleLabels[stack.targetRole]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stack.category}
            </Badge>
          </div>

          {/* Creator & Stats */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {stack.creator.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">@{stack.creator.name.toLowerCase().replace(' ', '')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                {stack.cloneCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {stack.rating}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/stacks/${stack.slug}`}>View Details</Link>
            </Button>
            <Button className="flex-1" onClick={() => onClone?.(stack)}>
              <Copy className="mr-2 h-4 w-4" />
              Clone Stack
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4 transition-all hover:shadow-md hover:border-primary/30', className)}>
        <div className="flex items-start gap-3">
          {/* Mini tool icons */}
          <div className="flex -space-x-2">
            {stack.tools.slice(0, 3).map((tool) => (
              <div
                key={tool.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary ring-2 ring-background"
              >
                <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/stacks/${stack.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
              {stack.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {stack.tools.length} tools · {stack.cloneCount} clones
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={() => onClone?.(stack)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  // Default card
  return (
    <Card className={cn('group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30', className)}>
      <div className="p-5">
        {/* Tool Icons */}
        <div className="flex items-center gap-2">
          {displayTools.map((tool) => (
            <div
              key={tool.id}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ring-2 ring-background transition-transform group-hover:scale-105"
              title={tool.name}
            >
              <span className="text-sm font-bold text-primary">{tool.name[0]}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4">
          <Link href={`/stacks/${stack.slug}`} className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {stack.name}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {stack.description}
          </p>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn('text-xs', roleColors[stack.targetRole])}>
            {roleLabels[stack.targetRole]}
          </Badge>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            @{stack.creator.name.toLowerCase().replace(' ', '')}
          </span>
          <span>{stack.tools.length} tools</span>
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            {stack.cloneCount.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/stacks/${stack.slug}`}>View</Link>
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onClone?.(stack)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Clone
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Leaderboard row for top stacks
export function StackLeaderboardRow({
  stack,
  rank,
  onClone,
}: {
  stack: Stack
  rank: number
  onClone?: (stack: Stack) => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-secondary/50 hover:border-primary/30">
      {/* Rank */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold',
        rank === 1 && 'bg-accent/20 text-accent',
        rank === 2 && 'bg-muted text-muted-foreground',
        rank === 3 && 'bg-muted text-muted-foreground',
        rank > 3 && 'bg-secondary text-muted-foreground'
      )}>
        #{rank}
      </div>

      {/* Tool icons */}
      <div className="flex -space-x-2">
        {stack.tools.slice(0, 4).map((tool) => (
          <div
            key={tool.id}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary ring-2 ring-background"
          >
            <span className="text-xs font-bold text-primary">{tool.name[0]}</span>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/stacks/${stack.slug}`} className="font-medium text-foreground hover:text-primary transition-colors">
          {stack.name}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">{stack.description}</p>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Copy className="h-3.5 w-3.5" />
          {stack.cloneCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          {stack.rating}
        </span>
      </div>

      {/* Clone button */}
      <Button size="sm" onClick={() => onClone?.(stack)}>
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Clone
      </Button>
    </div>
  )
}
