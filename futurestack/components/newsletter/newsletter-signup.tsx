"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const subscribe = () => {
    startTransition(async () => {
      setMessage("");
      setIsError(false);
      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            topics: ["tools", "opportunities", "workflows"],
            frequency: "weekly",
          }),
        });
        const result = (await response.json()) as { message?: string; error?: string };
        if (!response.ok) {
          throw new Error(result.error ?? "Subscription failed");
        }
        setEmail("");
        setMessage(result.message ?? "Subscribed successfully.");
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Subscription failed");
      }
    });
  };

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        subscribe();
      }}
    >
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Subscribing..." : "Subscribe Free"}
        </Button>
      </div>
      {message && (
        <p className={isError ? "mt-2 text-xs text-destructive" : "mt-2 text-xs text-emerald-400"}>
          {message}
        </p>
      )}
    </form>
  );
}
