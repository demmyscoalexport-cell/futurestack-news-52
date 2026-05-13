"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Send, Sparkles, Zap, Globe, Smartphone, Wifi,
  DollarSign, BookOpen, Briefcase, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTED_PROMPTS = [
  { icon: Wifi, text: "What are the best AI tools that work on slow internet in Nigeria?" },
  { icon: DollarSign, text: "Give me a complete toolkit for a Nigerian creator with a $0 budget" },
  { icon: Smartphone, text: "What Android-optimized tools should every African entrepreneur use?" },
  { icon: Briefcase, text: "Build me a startup stack for a Lagos-based SaaS founder" },
  { icon: BookOpen, text: "What free AI tools can African students use for research?" },
  { icon: Globe, text: "What tools accept Paystack or Flutterwave payments?" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm DISCOVA AI — your Africa-aware digital discovery assistant.\n\nI can help you find tools that work on 3G, recommend stacks for your budget, suggest Naira-friendly apps, and build workflows for African realities.\n\nWhat would you like to discover today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const query = text || input.trim();
    if (!query || loading) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context:
            "You are DISCOVA AI — the AI assistant for DISCOVA, Africa's digital discovery operating system. You help African creators, founders, freelancers, and businesses discover tools that work for their realities: slow internet, Android devices, Naira budgets, Paystack/Flutterwave payments, and startup affordability. Always consider African context in your recommendations. Be practical, specific, and mention pricing in Naira where possible. Recommend tools that have free plans or affordable African-friendly pricing.",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I couldn't generate a response. Please try again." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">

        {/* Hero bar */}
        <div className="border-b border-border/30 bg-card/40">
          <div className="container mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">DISCOVA AI</h1>
                <p className="text-xs text-muted-foreground">Africa-aware tool discovery assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setMessages([{
                role: "assistant",
                content: "Hello! I'm DISCOVA AI — your Africa-aware digital discovery assistant.\n\nI can help you find tools that work on 3G, recommend stacks for your budget, suggest Naira-friendly apps, and build workflows for African realities.\n\nWhat would you like to discover today?",
              }])}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 container mx-auto px-4 lg:px-6 py-6 max-w-3xl flex flex-col">

          {/* Suggestions (only shown when fresh) */}
          {messages.length === 1 && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Try asking:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.text}
                      onClick={() => send(p.text)}
                      className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-card p-3 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all group"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-4 mb-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mr-2.5 shrink-0 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="sticky bottom-4">
            <div className="flex gap-2 rounded-xl border border-border/60 bg-background p-1 shadow-lg">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask about tools, stacks, workflows, opportunities..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                disabled={loading}
              />
              <Button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="h-9 w-9 shrink-0 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              DISCOVA AI considers African realities — 3G, Android, Naira budgets, and local payments.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
