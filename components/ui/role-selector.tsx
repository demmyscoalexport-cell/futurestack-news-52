'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { User, Users, Rocket } from 'lucide-react'

interface RoleSelectorProps {
  value?: UserRole
  onChange?: (role: UserRole) => void
  variant?: 'default' | 'compact' | 'pills'
  className?: string
}

const roles: { id: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: 'freelancer',
    label: 'Freelancer',
    description: 'Solo professional doing client work',
    icon: User,
  },
  {
    id: 'agency',
    label: 'Agency',
    description: 'Team of 2-50 serving clients',
    icon: Users,
  },
  {
    id: 'saas-founder',
    label: 'SaaS Founder',
    description: 'Building a product or startup',
    icon: Rocket,
  },
]

export function RoleSelector({ value, onChange, variant = 'default', className }: RoleSelectorProps) {
  const [selected, setSelected] = useState<UserRole | undefined>(value)

  const handleSelect = (role: UserRole) => {
    setSelected(role)
    onChange?.(role)
  }

  if (variant === 'pills') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              selected === role.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            <role.icon className="h-4 w-4" />
            {role.label}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              'flex-1 rounded-lg border p-3 text-center transition-all',
              selected === role.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            <role.icon className="mx-auto h-5 w-5" />
            <span className="mt-1 block text-sm font-medium">{role.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-3', className)}>
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => handleSelect(role.id)}
          className={cn(
            'group relative flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all',
            selected === role.id
              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
              : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50'
          )}
        >
          {/* Selection indicator */}
          {selected === role.id && (
            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Icon */}
          <div className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl transition-colors',
            selected === role.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}>
            <role.icon className="h-7 w-7" />
          </div>

          {/* Label */}
          <span className={cn(
            'mt-4 text-lg font-semibold transition-colors',
            selected === role.id ? 'text-foreground' : 'text-foreground'
          )}>
            {role.label}
          </span>

          {/* Description */}
          <span className="mt-1 text-sm text-muted-foreground">
            {role.description}
          </span>
        </button>
      ))}
    </div>
  )
}
