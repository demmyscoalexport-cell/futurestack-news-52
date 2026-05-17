"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  ExternalLink,
  Zap,
  Star,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  tool_scores: { futurestack_score: number }[];
}

interface StackShareClientProps {
  stack: any;
  tools: Tool[];
  stackId: string;
}

export function StackShareClient({
  stack,
  tools,
  stackId,
}: StackShareClientProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = `https://discova.africa/stacks/${stackId}`;
  const shareText = `My power stack: ${stack.name} — built with ${tools.length} hand-picked tools on DISCOVA 🌍`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );

  const shareLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );

  const author = stack.profiles?.full_name || "DISCOVA User";
  const avgScore = tools.length
    ? (
        tools.reduce(
          (sum, t) => sum + (t.tool_scores?.[0]?.futurestack_score || 0),
          0,
        ) / tools.length
      ).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Stack Hero Card — this is what makes people WANT to screenshot */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12">
          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              {author.charAt(0)}
            </div>
            <div>
              <div className="text-sm text-slate-400">Stack by</div>
              <div className="font-bold text-white">{author}</div>
            </div>
          </div>

          {/* Stack name */}
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            {stack.name}
          </h1>
          {stack.description && (
            <p className="text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed">
              {stack.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-sm">
              <span className="text-slate-500 mr-1">Tools:</span>
              <span className="font-bold text-white">{tools.length}</span>
            </div>
            {avgScore && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                <span className="text-slate-400">Avg DISCOVA Score™:</span>
                <span className="font-black text-emerald-400">{avgScore}</span>
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={shareTwitter}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Twitter className="w-4 h-4" /> Share on X
            </button>
            <button
              onClick={shareLinkedIn}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Linkedin className="w-4 h-4" /> Share on LinkedIn
            </button>
            <Link
              href="/stack-builder"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Zap className="w-4 h-4" /> Build My Own
            </Link>
          </div>
        </div>
      </div>

      {/* Tool Grid — the visual "screenshot moment" */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-black mb-6 text-slate-400 uppercase tracking-wider text-sm">
          {tools.length} Tools in this Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, i) => {
            const score = tool.tool_scores?.[0]?.futurestack_score;
            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]"
              >
                {/* Position */}
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                  {i + 1}
                </div>

                {/* Logo */}
                {tool.logo ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={tool.logo}
                      alt={tool.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg shrink-0">
                    {tool.name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {tool.name}
                  </div>
                  <div className="text-slate-500 text-sm truncate">
                    {tool.tagline}
                  </div>
                </div>

                {/* Score badge */}
                {score && (
                  <div className="shrink-0 text-right">
                    <div className="text-emerald-400 font-black text-lg leading-none">
                      {Number(score).toFixed(1)}
                    </div>
                    <div className="text-slate-600 text-xs">Score</div>
                  </div>
                )}

                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-800/30 rounded-3xl p-10 text-center">
          <div className="text-2xl font-black mb-3">Build your own stack</div>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Tell our AI your role and goals — get a personalised stack of tools
            in seconds.
          </p>
          <Link
            href="/stack-builder"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" /> Open Stack Builder →
          </Link>
        </div>
      </div>
    </div>
  );
}
