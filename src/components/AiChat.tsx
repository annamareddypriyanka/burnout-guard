import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, Shield } from "lucide-react";
import { getChatKeywordResponse } from "@/lib/burnout";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Check for keyword-based response first
    const keywordResponse = getChatKeywordResponse(text);
    if (keywordResponse) {
      setMessages([...allMessages, { role: "assistant", content: keywordResponse }]);
      setIsLoading(false);
      return;
    }

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) upsert("I'm a bit overwhelmed right now. Please try again in a moment.");
        else if (resp.status === 402) upsert("The AI service needs credits to continue. Please check your account.");
        else upsert("Sorry, I couldn't connect right now. Please try again later.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      upsert("Sorry, something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm flex flex-col" style={{ height: "min(500px, 60vh)" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Supportive Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 gap-3">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
              <MessageCircle className="h-8 w-8 mx-auto opacity-40" />
              <p>Share how you're feeling. I'm here to listen.</p>
              <div className="flex items-center justify-center gap-1 text-xs">
                <Shield className="h-3 w-3" />
                <span>Your messages are not stored</span>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How are you feeling?"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
