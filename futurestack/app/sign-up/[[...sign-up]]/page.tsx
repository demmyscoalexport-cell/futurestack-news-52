import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";

export default function SignUpPage() {
  if (!config.clerk.isConfigured) {
    redirect("/signup");
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to DISCOVA
      </Link>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
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
