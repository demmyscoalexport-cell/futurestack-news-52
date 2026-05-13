import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
      </div>

      {/* Logo bar */}
      <header className="relative z-10 flex items-center px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm">
            <Image
              src="/discova-logo.png"
              alt="Discova"
              width={130}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
        </Link>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
