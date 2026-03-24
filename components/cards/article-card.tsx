import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Eye } from 'lucide-react'
import type { Article } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  className?: string
}

const categoryColors: Record<string, string> = {
  'ai-tools': 'bg-primary/10 text-primary border-primary/20',
  'saas-news': 'bg-accent/10 text-accent border-accent/20',
  'tutorials': 'bg-success/10 text-success border-success/20',
  'case-studies': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'comparisons': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  'industry-trends': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
}

const categoryLabels: Record<string, string> = {
  'ai-tools': 'AI Tools',
  'saas-news': 'SaaS News',
  'tutorials': 'Tutorial',
  'case-studies': 'Case Study',
  'comparisons': 'Comparison',
  'industry-trends': 'Industry Trends',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ArticleCard({ article, variant = 'default', className }: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <Card className={cn('group relative overflow-hidden', className)}>
        <Link href={`/news/${article.slug}`} className="block">
          {/* Image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={cn('text-xs', categoryColors[article.category])}>
                {categoryLabels[article.category]}
              </Badge>
              {article.featured && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                  Featured
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            {/* Excerpt */}
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>

            {/* Meta */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {article.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{article.author.name}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{formatDate(article.publishedAt)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{article.readTime} min read</span>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Card className={cn('group flex overflow-hidden transition-all hover:shadow-md hover:border-primary/30', className)}>
        <Link href={`/news/${article.slug}`} className="flex flex-1">
          {/* Image */}
          <div className="relative w-40 shrink-0 overflow-hidden bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center p-4">
            <Badge variant="outline" className={cn('text-xs w-fit', categoryColors[article.category])}>
              {categoryLabels[article.category]}
            </Badge>

            <h3 className="mt-2 font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{article.author.name}</span>
              <span>·</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('group', className)}>
        <Link href={`/news/${article.slug}`} className="flex gap-3">
          {/* Image */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(article.publishedAt)}
            </p>
          </div>
        </Link>
      </div>
    )
  }

  // Default card
  return (
    <Card className={cn('group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30', className)}>
      <Link href={`/news/${article.slug}`}>
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn('text-xs', categoryColors[article.category])}>
              {categoryLabels[article.category]}
            </Badge>
            {article.featured && (
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-3 font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {article.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{article.author.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(article.publishedAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}
