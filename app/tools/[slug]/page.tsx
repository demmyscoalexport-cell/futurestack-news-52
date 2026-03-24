import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ToolBadge } from '@/components/ui/tool-badge'
import { ToolCard } from '@/components/cards/tool-card'
import { StackCard } from '@/components/cards/stack-card'
import { tools, stacks, reviews } from '@/lib/data'
import { 
  ArrowLeft, 
  ExternalLink, 
  Plus, 
  Heart,
  Share2,
  Star,
  Check,
  X as XIcon,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Globe,
  Smartphone,
  Zap,
  Calendar,
  DollarSign
} from 'lucide-react'

interface ToolPageProps {
  params: Promise<{ slug: string }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = tools.find(t => t.slug === slug)

  if (!tool) {
    notFound()
  }

  const relatedTools = tools
    .filter(t => t.id !== tool.id && t.category === tool.category)
    .slice(0, 4)

  const toolStacks = stacks
    .filter(s => s.tools.some(t => t.id === tool.id))
    .slice(0, 3)

  const ratingDistribution = [
    { stars: 5, percentage: 68 },
    { stars: 4, percentage: 22 },
    { stars: 3, percentage: 7 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Tool Header */}
        <section className="border-b border-border bg-gradient-to-b from-background to-secondary/20 py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Back link */}
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tools
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
              {/* Tool Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                    <span className="text-3xl font-bold text-primary">{tool.name[0]}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{tool.name}</h1>
                      {/* Rating */}
                      <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">{tool.rating}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">by OpenAI</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tool.reviewCount.toLocaleString()} reviews
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
                  {tool.description}
                </p>

                {/* Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {tool.badges.map(badge => (
                    <ToolBadge key={badge} badge={badge} />
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" asChild>
                    <a href={tool.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Stack
                  </Button>
                  <Button size="lg" variant="outline">
                    <Heart className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button size="lg" variant="ghost">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Quick Stats Card */}
              <Card className="mt-8 lg:mt-0 lg:w-80 shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </span>
                    <span className="font-medium text-foreground">
                      {tool.pricing.hasFree ? 'Free + Paid' : 'Paid only'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Integrations
                    </span>
                    <span className="font-medium text-foreground">
                      {tool.integrations.length}+ apps
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="h-4 w-4" />
                      Platforms
                    </span>
                    <span className="font-medium text-foreground">
                      {tool.platforms.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      Africa Notes
                    </span>
                    <span className="font-medium text-foreground">
                      {tool.africaFriendly ? 'Works well' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Last Updated
                    </span>
                    <span className="font-medium text-foreground">
                      {new Date(tool.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-12">
                {/* Overview */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Overview</h2>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Pros */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-success">
                          <Check className="h-5 w-5" />
                          Pros
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {tool.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground">
                              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Cons */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                          <XIcon className="h-5 w-5" />
                          Cons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {tool.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground">
                              <XIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Best For */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Best For</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {tool.bestFor.map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Pricing</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {tool.pricing.plans.map((plan, i) => (
                      <Card key={i} className={i === 1 ? 'border-primary ring-1 ring-primary' : ''}>
                        <CardHeader>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="text-2xl font-bold text-foreground">
                            {plan.price}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.period}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {plan.features.map((feature, j) => (
                              <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                                <Check className="h-4 w-4 text-success" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full mt-4" 
                            variant={i === 1 ? 'default' : 'outline'}
                          >
                            {plan.price === '$0' ? 'Start Free' : 'Get Started'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">User Reviews</h2>

                  {/* Rating Overview */}
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <div className="flex gap-8">
                        {/* Overall Rating */}
                        <div className="text-center">
                          <div className="text-5xl font-bold text-foreground">{tool.rating}</div>
                          <div className="mt-2 flex justify-center">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= Math.round(tool.rating)
                                    ? 'fill-accent text-accent'
                                    : 'fill-muted text-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {tool.reviewCount.toLocaleString()} reviews
                          </div>
                        </div>

                        {/* Distribution */}
                        <div className="flex-1 space-y-2">
                          {ratingDistribution.map(item => (
                            <div key={item.stars} className="flex items-center gap-3">
                              <span className="w-8 text-sm text-muted-foreground">
                                {item.stars} star
                              </span>
                              <Progress value={item.percentage} className="h-2 flex-1" />
                              <span className="w-10 text-sm text-muted-foreground text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review List */}
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {review.userName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{review.userName}</span>
                                {review.verified && (
                                  <span className="flex items-center gap-1 text-xs text-success">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                  </span>
                                )}
                                {review.location && (
                                  <span className="text-xs text-muted-foreground">{review.location}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Star rating */}
                              <div className="mt-1 flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'fill-accent text-accent'
                                        : 'fill-muted text-muted'
                                    }`}
                                  />
                                ))}
                              </div>

                              <p className="mt-3 text-foreground">{review.content}</p>

                              <div className="mt-4 flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  <ThumbsUp className="h-4 w-4" />
                                  {review.upvotes}
                                </button>
                                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-4">
                    <Button variant="outline">Load more reviews</Button>
                    <Button>Write a Review</Button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Appears in Stacks */}
                {toolStacks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Appears in Stacks</h3>
                    <div className="space-y-4">
                      {toolStacks.map(stack => (
                        <StackCard key={stack.id} stack={stack} variant="compact" />
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link href="/stacks">View all stacks</Link>
                    </Button>
                  </div>
                )}

                {/* Similar Tools */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Similar Tools</h3>
                  <div className="space-y-4">
                    {relatedTools.map(relatedTool => (
                      <ToolCard key={relatedTool.id} tool={relatedTool} variant="compact" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
