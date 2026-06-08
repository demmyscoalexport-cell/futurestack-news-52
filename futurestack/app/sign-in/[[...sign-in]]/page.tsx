import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";

export default function SignInPage() {
  if (!config.clerk.isConfigured) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to DISCOVA
      </Link>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-neutral-surface border border-neutral-stroke shadow-2xl",
          },
        }}
      />
    </div>
  );
}
