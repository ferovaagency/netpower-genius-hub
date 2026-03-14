import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chat`;

export default function AIChatWidget() {
  const { isOpen, mode, closeChat, toggleChat } = useChat();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevModeRef = useRef(mode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "quote" && (!initialized || prevModeRef.current !== mode)) {
      setMessages([]);
      setInitialized(true);
      prevModeRef.current = mode;
      sendToAI([], "Quiero cotizar un proyecto");
      return;
    }
    if (!initialized) {
      setInitialized(true);
      prevModeRef.current = mode;
      sendToAI([], "Hola");
      return;
    }
    prevModeRef.current = mode;
  }, [isOpen, mode]);

  const sendToAI = useCallback(async (history: Msg[], userText: string) => {
    const userMsg: Msg = { role: "user", content: userText };
    const allMessages = [...history, userMsg];

    if (userText !== "Hola" || history.length > 0) {
      setMessages(allMessages);
    }

    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, mode }),
      });

      if (!resp.ok || !resp.body) {
        let errMsg = "Error al conectar con el asesor. Intenta de nuevo.";
        try {
          const data = await resp.json();
          errMsg = data.error || errMsg;
        } catch {}
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const updateAssistant = (content: string) => {
        assistantSoFar = content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) updateAssistant(assistantSoFar + delta);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) updateAssistant(assistantSoFar + delta);
          } catch {}
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendToAI(messages, text);
  };

  const visibleMessages = messages.filter((m, i) => {
    if (i === 0 && m.role === "user" && m.content === "Hola") return false;
    return true;
  });

  return (
    <>
      {/* Attractive floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-24 z-50 flex flex-col items-end gap-2"
          >
            {/* Tooltip bubble */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg max-w-[200px] relative"
            >
              <p className="text-xs font-semibold text-foreground">¿Necesitas ayuda? 💬</p>
              <p className="text-[10px] text-muted-foreground">Chatea con Neti, tu asesor IA</p>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
            </motion.div>

            {/* Button with pulse */}
            <button
              onClick={toggleChat}
              className="relative w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-button hover:scale-110 transition-transform group"
              aria-label="Chat con asesor IA"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              <div className="relative z-10 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              {/* Online dot */}
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-success border-2 border-card" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-primary px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary-foreground">Neti · Asesor IA</p>
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" /> En línea
                </p>
              </div>
              <button onClick={closeChat} className="p-1 text-primary-foreground/70 hover:text-primary-foreground transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {visibleMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:text-sm [&_ul]:text-sm [&_li]:text-sm [&_strong]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && visibleMessages[visibleMessages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1 h-10 px-4 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
