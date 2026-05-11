"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  tools: any[];
  articles: any[];
  total: number;
}

export function SearchBar() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({
    tools: [],
    articles: [],
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ tools: [], articles: [], total: 0 });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors w-64"
      >
        <span className="flex-1 text-left">Search FutureStack...</span>
        <kbd className="hidden sm:flex px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
          <span className="text-xs mr-0.5">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tools, AI models, categories..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="p-4 text-center text-sm text-slate-500">
              Searching the intelligence engine...
            </div>
          )}

          {!loading && query && results.total === 0 && (
            <CommandEmpty>No results found for "{query}".</CommandEmpty>
          )}

          {!loading && results.tools.length > 0 && (
            <CommandGroup heading="AI Tools & Platforms">
              {results.tools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/tools/${tool.slug}`);
                  }}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {tool.logo ? (
                      <img
                        src={tool.logo}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <div className="text-xs font-bold">
                        {tool.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{tool.name}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {tool.tagline}
                    </div>
                  </div>
                  {tool.tool_scores?.[0]?.futurestack_score && (
                    <div className="shrink-0 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                      {tool.tool_scores[0].futurestack_score.toFixed(1)}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.articles.length > 0 && (
            <>
              {results.tools.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Editorial Insights">
                {results.articles.map((article) => (
                  <CommandItem
                    key={article.id}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/news/${article.slug}`);
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="font-semibold line-clamp-1">
                        {article.title}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {article.meta_description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
