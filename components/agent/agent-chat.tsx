"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Wrench, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  createdAt: Date;
}

const SUGGESTED_QUERIES = [
  "When is my next class?",
  "What assignments do I have due this week?",
  "Show me all high priority announcements.",
  "I'm free until 2 PM — is there anything on campus I could drop into?",
  "Which labs have a projector and can fit at least 30 people?",
  "Book Room 7A02 tomorrow from 3 PM to 5 PM.",
  "Register me for the Guest Lecture on Deep Learning.",
  "I need a room for 5 people with a projector, tomorrow between 2 and 4.",
];

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your **CampusOS AI Assistant**. I have live access to campus schedules, room bookings, upcoming events, announcements, and assignment deadlines.\n\nHow can I help you today?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  async function sendMessage(textToSend?: string) {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: queryText,
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        toolsUsed: data.toolsUsed || [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatMarkdown(content: string) {
    // Simple markdown formatter helper for bold, bullet points, and code
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono">$1</code>');

      if (line.trim().startsWith("- ")) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^-\s*/, "") }}
          />
        );
      }

      return (
        <p
          key={idx}
          className={idx > 0 ? "mt-1.5" : ""}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto space-y-4">
      {/* Header banner */}
      <Card className="p-4 bg-card/60 backdrop-blur border-border flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-base flex items-center gap-2">
              CampusOS Assistant
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-normal">
                Live Data Connected
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini 2.5 Flash Function Calling · Responds with live campus state
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: "Hello! I am your **CampusOS AI Assistant**. How can I help you today?",
                createdAt: new Date(),
              },
            ])
          }
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Chat
        </Button>
      </Card>

      {/* Main chat window */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card/40 backdrop-blur shadow-sm">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-sm"
                        : "bg-muted/80 text-foreground border border-border/60 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? msg.content : formatMarkdown(msg.content)}
                  </div>

                  {/* Tool used badge */}
                  {msg.role === "assistant" && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-amber-500" />
                        Tools used:
                      </span>
                      {msg.toolsUsed.map((tool) => (
                        <Badge
                          key={tool}
                          variant="outline"
                          className="text-[10px] py-0 px-2 font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  CampusOS AI is querying live data & thinking...
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Suggested Queries Chips */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
          <p className="text-[11px] text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Sample Judge Queries:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {SUGGESTED_QUERIES.map((query) => (
              <button
                key={query}
                onClick={() => sendMessage(query)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-full bg-background hover:bg-primary/10 hover:text-primary border border-border/60 text-muted-foreground transition-all duration-150 text-left disabled:opacity-50"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3 md:p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about schedules, rooms, events, assignments..."
              disabled={isLoading}
              className="flex-1 bg-background text-sm"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              size="md"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 gap-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
