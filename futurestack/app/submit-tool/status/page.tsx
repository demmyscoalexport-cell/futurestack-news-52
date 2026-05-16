"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Rocket } from "lucide-react";

export default function SubmitToolStatusLookupPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!id) { setError("Please enter a reference ID"); return; }
    router.push(`/submit-tool/status/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/submit-tool" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Submit
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-5">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Check Submission Status</h1>
          <p className="text-slate-400 text-sm mb-6">
            Enter the reference ID you received when you submitted your tool.
          </p>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Reference ID</label>
              <input
                value={slug}
                onChange={e => { setSlug(e.target.value); setError(""); }}
                placeholder="e.g. my-awesome-tool"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              <p className="text-xs text-slate-500 mt-1">
                This is the kebab-case version of your tool name (e.g. &quot;My Tool&quot; → &quot;my-tool&quot;)
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Look Up Status
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Haven&apos;t submitted yet?{" "}
            <Link href="/submit-tool" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              <Rocket className="w-3 h-3 inline mr-0.5" /> Submit your tool
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
