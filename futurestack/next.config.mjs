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
    ],
  },
};

export default nextConfig;
