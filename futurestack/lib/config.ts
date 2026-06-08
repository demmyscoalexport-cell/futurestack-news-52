/**
 * Typed, validated environment configuration.
 * Import `config` instead of `process.env` throughout the app.
 */
import { cleanEnv } from "@/lib/env";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `\n❌  Missing required environment variable: "${key}"\n` +
        `   Copy .env.local.example → .env.local and fill in the value.\n`,
    );
  }
  return value;
}

const optional = (key: string, fallback = "") => cleanEnv(process.env[key]) ?? fallback;

export const config = {
  /** Clerk — optional; falls back to Supabase auth when unset */
  clerk: {
    publishableKey: optional("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    secretKey: optional("CLERK_SECRET_KEY"),
    webhookSecret: optional("CLERK_WEBHOOK_SECRET"),
    signInUrl: optional("NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/sign-in"),
    signUpUrl: optional("NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/sign-up"),
    afterSignInUrl: optional("NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", "/dashboard"),
    afterSignUpUrl: optional("NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", "/onboarding"),
    isConfigured: Boolean(
      optional("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
        optional("CLERK_SECRET_KEY"),
    ),
  },

  /** Supabase — optional; auth routes degrade gracefully without it */
  supabase: {
    url: optional("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
    isConfigured: Boolean(
      optional("NEXT_PUBLIC_SUPABASE_URL") &&
        optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    ),
  },

  /** AI providers — optional; features degrade gracefully */
  ai: {
    openaiKey: optional("OPENAI_API_KEY"),
    anthropicKey: optional("ANTHROPIC_API_KEY"),
    googleKey: optional("GOOGLE_GENERATIVE_AI_API_KEY"),
    falKey: optional("FAL_KEY"),
    replicateToken: optional("REPLICATE_API_TOKEN"),
  },

  /** Email via Resend */
  email: {
    resendKey: optional("RESEND_API_KEY"),
    from: optional("RESEND_FROM_EMAIL", "noreply@getdiscova.com"),
    fromName: optional("RESEND_FROM_NAME", "DISCOVA"),
  },

  /** Stripe payments */
  payments: {
    publishableKey: optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    secretKey: optional("STRIPE_SECRET_KEY"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  },

  /** Paystack payments (Africa-first) */
  paystack: {
    secretKey: optional("PAYSTACK_SECRET_KEY"),
    publicKey: optional("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"),
    webhookSecret: optional("PAYSTACK_WEBHOOK_SECRET"),
  },

  /** Push notifications */
  notifications: {
    oneSignalAppId: optional("NEXT_PUBLIC_ONESIGNAL_APP_ID"),
  },

  /** Monitoring & analytics */
  monitoring: {
    sentryDsn: optional("NEXT_PUBLIC_SENTRY_DSN"),
    sentryAuth: optional("SENTRY_AUTH_TOKEN"),
    posthogKey: optional("NEXT_PUBLIC_POSTHOG_KEY"),
    posthogHost: optional(
      "NEXT_PUBLIC_POSTHOG_HOST",
      "https://app.posthog.com",
    ),
  },

  /** Contentful CMS */
  contentful: {
    spaceId: optional("CONTENTFUL_SPACE_ID"),
    environment:
      optional("CONTENTFUL_ENVIRONMENT") ||
      optional("CONTENTFUL_ENVIRONMENT_ID", "master"),
    deliveryToken: optional("CONTENTFUL_DELIVERY_TOKEN"),
    previewToken: optional("CONTENTFUL_PREVIEW_TOKEN"),
    managementToken: optional("CONTENTFUL_MANAGEMENT_TOKEN"),
    webhookSecret: optional("CONTENTFUL_WEBHOOK_SECRET"),
    defaultLocale: optional("CONTENTFUL_DEFAULT_LOCALE", "en-US"),
    usePreviewApi: optional("CONTENTFUL_USE_PREVIEW_API", "false") === "true",
    isConfigured: Boolean(
      optional("CONTENTFUL_SPACE_ID") && optional("CONTENTFUL_DELIVERY_TOKEN"),
    ),
  },

  /** Application */
  app: {
    siteUrl: optional("NEXT_PUBLIC_SITE_URL", "https://getdiscova.com"),
    env: (process.env.NODE_ENV ?? "development") as
      | "development"
      | "production"
      | "test",
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
  },
} as const;

export type Config = typeof config;
