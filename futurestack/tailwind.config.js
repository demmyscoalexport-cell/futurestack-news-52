module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#7c66ff',
        'brand-lilac': '#c0b3ff',
        'brand-gold': '#f3c344',
        'neutral-deep': '#06030e',
        'neutral-surface': '#12111a',
        'neutral-stroke': '#23212d',
        'neutral-white': '#ffffff',
        'neutral-dim': '#8b8a91'
      },
      borderRadius: {
        // Use discova-lg — not "lg" — so existing rounded-lg (shadcn) stays unchanged.
        'discova-lg': '16px',
        'input': '12px',
        'pill': '999px'
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      }
    }
  }
}
