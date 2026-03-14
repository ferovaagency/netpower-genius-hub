import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Sparkles, Loader2, Copy, Check, Plus, Trash2 } from "lucide-react";
import { categories, brands } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";

interface SpecEntry {
  key: string;
  value: string;
}

interface GeneratedSheet {
  description: string;
  shortDesc: string;
  specs: Record<string, string>;
  benefits: string[];
  faqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDesc: string;
}

export default function ProductSheetGeneratorPage() {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [specEntries, setSpecEntries] = useState<SpecEntry[]>([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedSheet | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const addSpec = () => setSpecEntries([...specEntries, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecEntries(specEntries.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    const updated = [...specEntries];
    updated[i][field] = val;
    setSpecEntries(updated);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError("Ingresa el nombre del producto");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const specs: Record<string, string> = {};
    specEntries.forEach(s => {
      if (s.key.trim() && s.value.trim()) specs[s.key.trim()] = s.value.trim();
    });

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-product-sheet", {
        body: { productName, brand, category, sku, specs },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.data) setResult(data.data);
    } catch (e: any) {
      setError(e.message || "Error al generar la ficha");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground"
      title="Copiar"
    >
      {copied === id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <>
      <Helmet>
        <title>Generador de Fichas con IA | NetPower IT</title>
        <meta name="description" content="Genera fichas de producto profesionales con inteligencia artificial para tu tienda NetPower IT." />
      </Helmet>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Generador de Fichas con IA</h1>
              <p className="text-sm text-muted-foreground">Crea descripciones técnicas profesionales automáticamente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">Datos del Producto</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nombre del producto *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="Ej: UPS APC Back-UPS 1500VA"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Marca</label>
                    <select
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      <option value="">Seleccionar...</option>
                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="Ej: BX1500M-LM60"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>

                {/* Specs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-muted-foreground">Especificaciones conocidas</label>
                    <button onClick={addSpec} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {specEntries.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={s.key}
                          onChange={e => updateSpec(i, "key", e.target.value)}
                          placeholder="Ej: Potencia"
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                        <input
                          type="text"
                          value={s.value}
                          onChange={e => updateSpec(i, "value", e.target.value)}
                          placeholder="Ej: 1500VA"
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                        {specEntries.length > 1 && (
                          <button onClick={() => removeSpec(i)} className="p-2 text-muted-foreground hover:text-destructive transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-destructive font-medium">{error}</p>}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generando ficha...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generar Ficha con IA
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="space-y-5">
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center justify-center text-center shadow-card"
                  >
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-sm font-semibold text-foreground">Generando ficha de producto...</p>
                    <p className="text-xs text-muted-foreground mt-1">Esto puede tomar 15-30 segundos</p>
                  </motion.div>
                )}

                {!loading && !result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card rounded-2xl border border-border/50 border-dashed p-10 flex flex-col items-center justify-center text-center"
                  >
                    <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Completa los datos del producto y genera la ficha</p>
                  </motion.div>
                )}

                {!loading && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Short desc */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción Corta</h3>
                        <CopyBtn text={result.shortDesc} id="short" />
                      </div>
                      <p className="text-sm text-foreground">{result.shortDesc}</p>
                    </div>

                    {/* Description */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción Completa</h3>
                        <CopyBtn text={result.description} id="desc" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                        {result.description}
                      </p>
                    </div>

                    {/* Specs */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Especificaciones</h3>
                        <CopyBtn text={JSON.stringify(result.specs, null, 2)} id="specs" />
                      </div>
                      <div className="divide-y divide-border">
                        {Object.entries(result.specs).map(([k, v]) => (
                          <div key={k} className="flex py-2 text-xs">
                            <span className="w-2/5 font-medium text-foreground">{k}</span>
                            <span className="w-3/5 text-muted-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Beneficios</h3>
                        <CopyBtn text={result.benefits.join("\n")} id="benefits" />
                      </div>
                      <ul className="space-y-1.5">
                        {result.benefits.map((b, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* FAQs */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Preguntas Frecuentes</h3>
                      <div className="space-y-3">
                        {result.faqs.map((faq, i) => (
                          <div key={i}>
                            <p className="text-xs font-semibold text-foreground mb-1">{faq.question}</p>
                            <p className="text-xs text-muted-foreground">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SEO */}
                    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">SEO</h3>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Meta Título</p>
                            <p className="text-xs font-medium text-foreground">{result.metaTitle}</p>
                          </div>
                          <CopyBtn text={result.metaTitle} id="meta-title" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Meta Descripción</p>
                            <p className="text-xs text-foreground">{result.metaDesc}</p>
                          </div>
                          <CopyBtn text={result.metaDesc} id="meta-desc" />
                        </div>
                      </div>
                    </div>

                    {/* Copy all */}
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all")}
                      className="w-full h-10 rounded-lg border-2 border-primary text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition"
                    >
                      {copied === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied === "all" ? "¡Copiado!" : "Copiar ficha completa (JSON)"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
