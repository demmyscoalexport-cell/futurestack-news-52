"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface RoleSelectorProps {
  value?: UserRole;
  onChange?: (role: UserRole) => void;
  variant?: "default" | "compact" | "pills";
  className?: string;
}

const roles: {
  id: UserRole;
  label: string;
  description: string;
  emoji: string;
  image: string;
  imageAlt: string;
  accentColor: string;
  selectedBorder: string;
  selectedBg: string;
}[] = [
  {
    id: "freelancer",
    label: "Freelancer",
    description: "Solo professional doing client work",
    emoji: "💻",
    image:
      "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=220&fit=crop&q=80&auto=format",
    imageAlt: "Freelancer working at a laptop",
    accentColor: "text-blue-400",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-500/5",
  },
  {
    id: "agency",
    label: "Agency",
    description: "Team of 2–50 serving clients",
    emoji: "🏢",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=220&fit=crop&q=80&auto=format",
    imageAlt: "Agency team collaborating",
    accentColor: "text-violet-400",
    selectedBorder: "border-violet-500",
    selectedBg: "bg-violet-500/5",
  },
  {
    id: "saas-founder",
    label: "SaaS Founder",
    description: "Building a product or startup",
    emoji: "🚀",
    image:
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=220&fit=crop&q=80&auto=format",
    imageAlt: "SaaS founder reviewing a product dashboard",
    accentColor: "text-emerald-400",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-500/5",
  },
];

export function RoleSelector({
  value,
  onChange,
  variant = "default",
  className,
}: RoleSelectorProps) {
  const [selected, setSelected] = useState<UserRole | undefined>(value);

  const handleSelect = (role: UserRole) => {
    setSelected(role);
    onChange?.(role);
  };

  if (variant === "pills") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected === role.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <span>{role.emoji}</span>
            {role.label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-2", className)}>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              "flex-1 rounded-lg border p-3 text-center transition-all",
              selected === role.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            <span className="mx-auto block text-xl">{role.emoji}</span>
            <span className="mt-1 block text-sm font-medium">{role.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {roles.map((role) => {
        const isSelected = selected === role.id;
        return (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            className={cn(
              "group relative flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-all duration-200",
              isSelected
                ? cn(role.selectedBorder, role.selectedBg, "shadow-lg")
                : "border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            {/* Selection checkmark */}
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Persona illustration */}
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={role.image}
                alt={role.imageAlt}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-300",
                  isSelected ? "scale-105" : "group-hover:scale-103",
                )}
                loading="lazy"
              />
              {/* Dark gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {/* Emoji badge */}
              <div className="absolute bottom-2.5 left-3 flex h-8 w-8 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm text-lg border border-white/10">
                {role.emoji}
              </div>
            </div>

            {/* Text content */}
            <div className="px-4 py-3">
              <span
                className={cn(
                  "block text-base font-semibold transition-colors",
                  isSelected ? role.accentColor : "text-foreground group-hover:text-foreground",
                )}
              >
                {role.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">
                {role.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
