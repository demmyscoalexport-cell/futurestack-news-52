"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, ChevronUp, ChevronDown, Send } from "lucide-react";

interface AskAIWidgetProps {
  tool: { name: string; description: string; has_free?: boolean };
}

type Message = { id: string; role: "user" | "assistant"; content: string };

export function AskAIWidget({ tool }: AskAIWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    `Is ${tool.name} worth it for a solo freelancer?`,
    `How does ${tool.name} compare to alternatives?`,
    `What can't ${tool.name} do?`,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, toolContext: tool }),
      });

      if (!res.body) throw new Error("No body returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // parse Vercel AI chunks natively since they start with 0:"text"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const textChunk = JSON.parse(line.substring(2));
              assistantMsg += textChunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantMsg }
                    : m,
                ),
              );
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <MessageCircle className="w-4 h-4" />
          </div>
          Ask AI about {tool.name}
        </span>
        <span className="text-slate-400">
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col h-[400px]">
          {/* Quick question chips */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4 shrink-0">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors text-left disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Message history */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Ask a question to begin...
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] \${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="text-sm px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="relative shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={`Ask anything about ${tool.name}...`}
              className="w-full bg-white dark:bg-slate-900 text-sm px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
