import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2, Sparkles, ShoppingCart, ExternalLink, CreditCard, MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { products, formatCOP, categories } from "@/data/store-data";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/store";
import { supabase } from "@/integrations/supabase/client";
import DataConsentCheckbox from "@/components/DataConsentCheckbox";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-chat`;

type CatalogItem = { id: string; slug: string; name: string; brand: string; category: string; price: number; sale_price: number | null; stock: number };

function buildCatalogContext(items: CatalogItem[]): string {
  if (items.length === 0) return "";
  return items
    .map((p) => {
      const price = p.sale_price ?? p.price;
      return `- id:${p.id} | ${p.name} | ${p.brand || "—"} | ${p.category || ""} | ${formatCOP(price)} | stock:${p.stock ?? 0}`;
    })
    .join("\n");
}

// Parse [[PRODUCT:slug]], [[WHATSAPP:text]], [PRODUCT_SUGGESTIONS:...], [[QUOTE_DATA:{...}]] markers
type SuggestionsMarker = { type: "suggestions"; ids: string[] };
type WhatsappMarker = { type: "whatsapp"; label: string };
type QuoteMarker = { type: "quote"; raw: string; data: Record<string, string> };
type Part = string | Product | WhatsappMarker | SuggestionsMarker | QuoteMarker;

function parseMarkers(text: string): Part[] {
  const parts: Part[] = [];
  const regex = /\[\[PRODUCT:([^\]]+)\]\]|\[\[WHATSAPP(?::([^\]]*))?\]\]|\[PRODUCT_SUGGESTIONS:\s*([^\]]+)\]|\[\[QUOTE_DATA:(\{[\s\S]*?\})\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[0].startsWith("[[PRODUCT:")) {
      const slug = match[1].trim();
      const product = products.find((p) => p.slug === slug);
      if (product) parts.push(product);
    } else if (match[0].startsWith("[[WHATSAPP")) {
      parts.push({ type: "whatsapp", label: match[2]?.trim() || "Chatear por WhatsApp" });
    } else if (match[0].startsWith("[[QUOTE_DATA:")) {
      let data: Record<string, string> = {};
      try { data = JSON.parse(match[4]); } catch { /* ignore */ }
      parts.push({ type: "quote", raw: match[4], data });
    } else {
      const ids = match[3].split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) parts.push({ type: "suggestions", ids });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}


function MiniProductCard({
  product,
  onAddToCart,
  onViewProduct,
  onCheckout,
}: {
  product: Product;
  onAddToCart: () => void;
  onViewProduct: () => void;
  onCheckout: () => void;
}) {
  const category = categories.find((c) => c.id === product.categoryId);
  const hasImage = product.images && product.images.length > 0 && product.images[0];

  return (
    <div className="my-2 bg-background border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-2.5">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
          {hasImage ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl">{category?.icon || "📦"}</span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">{product.shortDesc}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-sm font-bold text-primary">
              {formatCOP(product.salePrice || product.price)}
            </span>
            {product.salePrice && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatCOP(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex border-t border-border divide-x divide-border">
        <button
          onClick={onAddToCart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-primary hover:bg-primary/5 transition"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Agregar
        </button>
        <button
          onClick={onViewProduct}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent transition"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver
        </button>
        <button
          onClick={onCheckout}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-success hover:bg-success/5 transition"
        >
          <CreditCard className="w-3.5 h-3.5" /> Comprar
        </button>
      </div>
    </div>
  );
}

export default function AIChatWidget() {
  const { isOpen, mode, closeChat, toggleChat, openChat: openChatContext } = useChat();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [consent, setConsent] = useState(false);
  const [suggestionsCache, setSuggestionsCache] = useState<Record<string, Product>>({});
  const [dbCatalog, setDbCatalog] = useState<CatalogItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevModeRef = useRef(mode);
  const submittedQuotesRef = useRef<Set<string>>(new Set());
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem("neti_session_id");
      if (!sid) {
        sid = (crypto as any).randomUUID?.() || `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem("neti_session_id", sid);
      }
      sessionIdRef.current = sid;
    }
  }

  // Detect [[QUOTE_DATA:{...}]] in assistant messages and persist once
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const m = msg.content.match(/\[\[QUOTE_DATA:(\{[\s\S]*?\})\]\]/);
      if (!m) continue;
      const key = m[1];
      if (submittedQuotesRef.current.has(key)) continue;
      submittedQuotesRef.current.add(key);
      let data: any = {};
      try { data = JSON.parse(m[1]); } catch { continue; }
      const transcript = messages.map(x => `${x.role === "user" ? "Cliente" : "Neti"}: ${x.content.replace(/\[\[QUOTE_DATA:[\s\S]*?\]\]/g, "")}`).join("\n");
      supabase.from("quote_requests").insert({
        source: "neti_chat",
        customer_name: data.name || null,
        customer_email: data.email || null,
        customer_phone: data.phone || null,
        city: data.city || null,
        nit_cedula: data.nit_cedula || data.nit || data.cedula || null,
        subject: "Cotización solicitada vía Neti (AI chat)",
        message: data.project || "",
        details: { project: data.project || "", budget: data.budget || "", notes: data.notes || "", transcript },
        status: "new",
      }).then(({ error }) => {
        if (error) console.error("Failed to save quote:", error);
      });
      // Sync to Brevo list #9 (fire and forget)
      if (data.email) {
        supabase.functions.invoke("brevo-sync-contact", {
          body: {
            email: data.email,
            name: data.name || "",
            phone: data.phone || "",
            city: data.city || "",
            nit_cedula: data.nit_cedula || data.nit || data.cedula || "",
            project: data.project || "",
            source: "neti_chat",
          },
        }).catch((e) => console.error("Brevo sync failed:", e));
      }
    }
  }, [messages]);

  // Persist the Neti conversation (upsert by session_id) so admins can review it later.
  useEffect(() => {
    if (!sessionIdRef.current || messages.length === 0) return;
    const sid = sessionIdRef.current;
    // Capture the last known contact data from any QUOTE_DATA marker.
    let name: string | null = null, email: string | null = null, phone: string | null = null;
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const m = msg.content.match(/\[\[QUOTE_DATA:(\{[\s\S]*?\})\]\]/);
      if (m) {
        try {
          const d = JSON.parse(m[1]);
          name = d.name || name; email = d.email || email; phone = d.phone || phone;
        } catch {}
      }
    }
    const cleanMsgs = messages.map(x => ({
      role: x.role,
      content: x.content.replace(/\[\[QUOTE_DATA:[\s\S]*?\]\]/g, "").trim(),
    }));
    const t = setTimeout(() => {
      supabase.from("neti_conversations").upsert({
        session_id: sid,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        messages: cleanMsgs,
        message_count: cleanMsgs.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" }).then(({ error }) => {
        if (error) console.error("Failed to save conversation:", error);
      });
    }, 800);
    return () => clearTimeout(t);
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load real product catalog from DB once (for AI context with real IDs)
  useEffect(() => {
    supabase
      .from("products")
      .select("id, slug, name, brand, category, price, sale_price, stock")
      .eq("active", true)
      .limit(500)
      .then(({ data }) => setDbCatalog((data as any) || []));
  }, []);

  // Fetch product details for any [PRODUCT_SUGGESTIONS:...] markers in messages
  useEffect(() => {
    const ids = new Set<string>();
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const matches = msg.content.matchAll(/\[PRODUCT_SUGGESTIONS:\s*([^\]]+)\]/g);
      for (const m of matches) {
        m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => ids.add(id));
      }
    }
    const missing = [...ids].filter((id) => !suggestionsCache[id]);
    if (missing.length === 0) return;
    supabase
      .from("products")
      .select("id, slug, name, short_description, description, price, sale_price, sku, stock, images, category, brand, specs")
      .in("id", missing)
      .then(({ data }) => {
        if (!data) return;
        const next: Record<string, Product> = {};
        for (const r of data as any[]) {
          next[r.id] = {
            id: r.id, slug: r.slug, name: r.name, description: r.description ?? "",
            shortDesc: r.short_description ?? "", price: Number(r.price),
            salePrice: r.sale_price ? Number(r.sale_price) : null,
            sku: r.sku ?? "", stock: r.stock ?? 0, images: r.images ?? [],
            categoryId: r.category ?? "", brandId: r.brand ?? "",
            specs: r.specs ?? {}, metaTitle: "", metaDesc: "", active: true, featured: false,
          } as Product;
        }
        setSuggestionsCache((prev) => ({ ...prev, ...next }));
      });
  }, [messages, suggestionsCache]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Re-focus input after assistant finishes replying so the user can keep typing.
  useEffect(() => {
    if (!isOpen) return;
    if (!isLoading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isLoading, isOpen]);

  // Aparece 15s después de cargar la ruta (una vez por sesión) con mensaje transaccional B2B.
  useEffect(() => {
    if (sessionStorage.getItem("netpower_chat_shown")) return;
    const timer = setTimeout(() => {
      setShowPopup(true);
      sessionStorage.setItem("netpower_chat_shown", "1");
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

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

  const sendToAI = useCallback(
    async (history: Msg[], userText: string) => {
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
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: allMessages,
            mode,
            catalog: buildCatalogContext(dbCatalog),
          }),
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
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }
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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error de conexión. Intenta de nuevo." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, dbCatalog]
  );

  const handleSend = () => {
    if (!consent) return;
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendToAI(messages, text);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    sendToAI(messages, `Agregué "${product.name}" al carrito. ¿Algo más?`);
  };

  const handleViewProduct = (product: Product) => {
    closeChat();
    navigate(`/producto/${product.slug}`);
  };

  const handleCheckout = (product: Product) => {
    addItem(product);
    closeChat();
    navigate("/carrito");
  };

  const closePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem("netpower_chat_shown", "1");
  };

  const openChat = () => {
    setShowPopup(false);
    openChatContext();
    sessionStorage.setItem("netpower_chat_shown", "1");
  };

  const visibleMessages = messages.filter((m, i) => {
    if (i === 0 && m.role === "user" && m.content === "Hola") return false;
    return true;
  });

  const renderMessageContent = (msg: Msg) => {
    if (msg.role === "user") return msg.content;

    const parts = parseMarkers(msg.content);
    return (
      <>
        {parts.map((part, idx) => {
          if (typeof part === "string") {
            return (
              <div
                key={idx}
                className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:text-sm [&_ul]:text-sm [&_li]:text-sm [&_strong]:text-foreground"
              >
                <ReactMarkdown>{part}</ReactMarkdown>
              </div>
            );
          }
          if ("type" in part && part.type === "whatsapp") {
            return (
              <a
                key={idx}
                href="https://wa.me/573504609431?text=Hola,%20vengo%20del%20chat%20de%20Neti%20y%20necesito%20asesor%C3%ADa"
                target="_blank"
                rel="noopener noreferrer"
                className="my-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(145,63%,42%)] text-[hsl(0,0%,100%)] text-sm font-semibold hover:opacity-90 transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {part.label}
              </a>
            );
          }
          if ("type" in part && part.type === "quote") {
            return (
              <div key={idx} className="my-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
                <p className="font-semibold text-success flex items-center gap-1.5">✅ Solicitud registrada</p>
                <p className="text-foreground/80 text-xs mt-1">
                  Recibimos tus datos. Un asesor te enviará la cotización formal al correo <strong>{part.data.email || "registrado"}</strong> en menos de 1 hora hábil.
                </p>
              </div>
            );
          }
          if ("type" in part && part.type === "suggestions") {
            const productsToShow = part.ids.map((id) => suggestionsCache[id]).filter(Boolean) as Product[];
            if (productsToShow.length === 0) {
              return (
                <div key={idx} className="my-2 text-xs text-muted-foreground italic">Cargando productos…</div>
              );
            }
            return (
              <div key={idx} className="space-y-2 my-2">
                {productsToShow.map((p) => (
                  <MiniProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => handleAddToCart(p)}
                    onViewProduct={() => handleViewProduct(p)}
                    onCheckout={() => handleCheckout(p)}
                  />
                ))}
              </div>
            );
          }
          return (
            <MiniProductCard
              key={idx}
              product={part as Product}
              onAddToCart={() => handleAddToCart(part as Product)}
              onViewProduct={() => handleViewProduct(part as Product)}
              onCheckout={() => handleCheckout(part as Product)}
            />
          );
        })}
      </>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 bg-card border-2 border-primary rounded-2xl shadow-elevated p-4 max-w-[280px]"
          >
            <button onClick={closePopup} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-primary text-sm">Neti</p>
                <p className="text-xs text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full inline-block animate-pulse" />
                  En línea ahora
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              ¿Necesitas una cotización formal B2B? Te la envío en 5 minutos.
            </p>
            <button onClick={openChat} className="w-full mt-3 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Pedir cotización →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-24 z-50 flex flex-col items-end gap-2"
          >

            <button
              onClick={toggleChat}
              className="relative w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-button hover:scale-110 transition-transform"
              aria-label="Chat con asesor IA"
            >
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              <Sparkles className="relative z-10 w-7 h-7" />
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
              <button
                onClick={closeChat}
                className="p-1 text-primary-foreground/70 hover:text-primary-foreground transition"
              >
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
                    {renderMessageContent(msg)}
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
            <div className="p-3 border-t border-border shrink-0 space-y-2">
              {!consent && (
                <div className="px-1">
                  <DataConsentCheckbox checked={consent} onChange={setConsent} id="chat-consent" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={consent ? "Escribe tu mensaje..." : "Acepta la política para chatear..."}
                  disabled={isLoading || !consent}
                  className="flex-1 h-10 px-4 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !consent}
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
