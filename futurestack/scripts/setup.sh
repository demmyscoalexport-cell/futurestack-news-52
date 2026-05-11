#!/usr/bin/env bash
# FutureStack — One-shot setup script
# Run from the futurestack/ directory: bash scripts/setup.sh
set -e

echo ""
echo "🚀 FutureStack Setup"
echo "══════════════════════════════════════════"

# 1. Check env vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase env vars. Ensure .env.local is populated."
  exit 1
fi

echo "✅ Env vars detected"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"

# 2. Install deps
echo ""
echo "📦 Installing dependencies..."
npm install --silent

# 3. Run seed (quick mode — no AI image generation)
echo ""
echo "🌱 Running database seed (with logo fallbacks)..."
node scripts/seed-with-images.mjs --quick

echo ""
echo "══════════════════════════════════════════"
echo "✅ Setup complete!"
echo ""
echo "To also generate AI images for tool logos:"
echo "  node scripts/seed-with-images.mjs"
echo ""
echo "To start the dev server:"
echo "  npm run dev"
echo ""
