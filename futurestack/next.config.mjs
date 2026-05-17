import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.picard.replit.dev", "*.replit.dev", "*.repl.co"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "ui-avatars.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "**.supabase.co" },
      { hostname: "**.supabase.in" },
      { hostname: "logo.clearbit.com" },
      { hostname: "cdn.simpleicons.org" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "**.amazonaws.com" },
      { hostname: "**.cloudinary.com" },
      { hostname: "www.google.com" },
      // GNews article images — allow all external hostnames
      { hostname: "**" },
    ],
  },
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
