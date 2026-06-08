module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#7c66ff',
        'brand-lilac': '#c0b3ff',
        'brand-gold': '#f3c344',
        'neutral-deep': '#06030e',
        'neutral-secondary': '#1a1824',
        'neutral-surface': '#12111a',
        'neutral-elevated': '#1a1824',
        'neutral-stroke': '#23212d',
        'neutral-white': '#ffffff',
        'neutral-dim': '#8b8a91',
        'neutral-muted': '#8b8a91',
      },
      borderRadius: {
        'discova-lg': '16px',
        input: '12px',
        pill: '999px',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
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
