module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#7c3aed',
        'brand-lilac': '#8b5cf6',
        'brand-cyan': '#06b6d4',
        'brand-gold': '#06b6d4',
        'neutral-deep': '#0a0a0b',
        'neutral-secondary': '#111214',
        'neutral-surface': '#181a1f',
        'neutral-elevated': '#1e2128',
        'neutral-stroke': '#2a2d35',
        'neutral-white': '#ffffff',
        'neutral-dim': '#8a91a5',
        'neutral-muted': '#b8bcc8',
      },
      borderRadius: {
        'discova-lg': '16px',
        input: '12px',
        pill: '999px',
      },
      fontFamily: {
        heading: ['Satoshi', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['3.25rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        h4: ['1.25rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      transitionDuration: {
        micro: '200ms',
        page: '300ms',
      },
    },
  },
};
