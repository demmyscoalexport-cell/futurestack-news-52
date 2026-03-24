import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ToolBadge as ToolBadgeType } from '@/lib/types'
import { Globe, Sparkles, Zap, Star, TrendingUp, Award } from 'lucide-react'

interface ToolBadgeProps {
  badge: ToolBadgeType
  size?: 'sm' | 'default'
  className?: string
}

const badgeConfig: Record<ToolBadgeType, { label: string; className: string; icon?: React.ElementType }> = {
  'free': {
    label: 'Free',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    icon: undefined,
  },
  'pro': {
    label: 'Pro',
    className: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
    icon: Sparkles,
  },
  'africa-friendly': {
    label: 'Africa-Friendly',
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    icon: Globe,
  },
  'no-code': {
    label: 'No-Code',
    className: 'bg-chart-4/10 text-chart-4 border-chart-4/20 hover:bg-chart-4/20',
    icon: Zap,
  },
  'new': {
    label: 'New',
    className: 'bg-chart-5/10 text-chart-5 border-chart-5/20 hover:bg-chart-5/20',
    icon: Star,
  },
  'trending': {
    label: 'Trending',
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    icon: TrendingUp,
  },
  'editor-pick': {
    label: "Editor's Pick",
    className: 'bg-foreground/10 text-foreground border-foreground/20 hover:bg-foreground/20',
    icon: Award,
  },
}

export function ToolBadge({ badge, size = 'default', className }: ToolBadgeProps) {
  const config = badgeConfig[badge]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'transition-colors',
        config.className,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {Icon && <Icon className={cn('mr-1', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />}
      {config.label}
    </Badge>
  )
}
