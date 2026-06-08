import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthUnavailable({
  action = "sign in",
}: {
  action?: "sign in" | "create an account";
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Compass className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Sign-in temporarily unavailable</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t connect to the authentication service needed to {action}.
        Please try again in a few minutes.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to DISCOVA</Link>
      </Button>
    </div>
  );
}
