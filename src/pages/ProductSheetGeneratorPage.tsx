import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Sparkles, Loader2, Copy, Check, Plus, Trash2, Upload, DollarSign, Image as ImageIcon } from "lucide-react";
import { categories, brands, products as storeProducts } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GeneratedSheetResult from "@/components/admin/GeneratedSheetResult";

interface SpecEntry {
  key: string;
  value: string;
}

export interface GeneratedSheet {
  description: string;
  shortDesc: string;
  specs: Record<string, string>;
  benefits: string[];
  faqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDesc: string;
  suggestedImageSearch?: string;
}

export default function ProductSheetGeneratorPage() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [specEntries, setSpecEntries] = useState<SpecEntry[]>([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedSheet | null>(null);
  const [error, setError] = useState("");

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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Lovable Cloud no está configurado. Activa Cloud primero.");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-product-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ productName, brand, category, sku, specs }),
      });

      if (!response.ok) {
        let errMsg = `Error ${response.status}`;
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch { /* non-JSON response */ }
        if (response.status === 404) errMsg = "La función aún no está desplegada. Espera unos segundos y reintenta.";
        throw new Error(errMsg);
      }
      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.data) setResult(data.data);
    } catch (e: any) {
      setError(e.message || "Error al generar la ficha");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    if (!result) return;

    // Use manually selected or AI-detected brand/category
    const detectedBrand = (result as any).detectedBrand;
    const detectedCategory = (result as any).detectedCategory;

    const selectedCategory = categories.find(c => c.name === category)
      || categories.find(c => c.name === detectedCategory)
      || categories[0];
    const selectedBrand = brands.find(b => b.name === brand)
      || brands.find(b => b.name === detectedBrand)
      || brands[0];

    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newId = String(storeProducts.length + 1 + Math.floor(Math.random() * 1000));

    const newProduct = {
      id: newId,
      slug,
      name: productName,
      description: result.description,
      shortDesc: result.shortDesc,
      price: Number(price) || 0,
      salePrice: salePrice ? Number(salePrice) : null,
      sku: sku || `SKU-${newId}`,
      stock: 10,
      images: imageUrl ? [imageUrl] : [],
      categoryId: selectedCategory.id,
      brandId: selectedBrand.id,
      specs: result.specs,
      metaTitle: result.metaTitle,
      metaDesc: result.metaDesc,
      active: true,
      featured: false,
    };

    storeProducts.push(newProduct as any);
    toast.success("¡Producto publicado exitosamente!", {
      description: `"${productName}" ya está visible en la tienda.`,
    });
    navigate(`/producto/${slug}`);
  };

  return (
    <>
      <Helmet>
        <title>Generador de Fichas con IA | NetPower IT</title>
        <meta name="description" content="Genera fichas de producto profesionales con inteligencia artificial para tu tienda NetPower IT." />
      </Helmet>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Generador de Fichas con IA</h1>
              <p className="text-base text-muted-foreground">Crea descripciones técnicas profesionales automáticamente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card h-fit">
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

                {/* Price fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      <DollarSign className="w-3 h-3 inline mr-1" />Precio (COP) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Ej: 489900"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Precio oferta (COP)</label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={e => setSalePrice(e.target.value)}
                      placeholder="Opcional"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    <ImageIcon className="w-3 h-3 inline mr-1" />URL de imagen del producto *
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen-producto.jpg"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  {imageUrl && (
                    <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30">
                      <img src={imageUrl} alt="Preview" className="w-full h-32 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
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
                    <p className="text-base font-semibold text-foreground">Generando ficha de producto...</p>
                    <p className="text-sm text-muted-foreground mt-1">Esto puede tomar 15-30 segundos</p>
                  </motion.div>
                )}

                {!loading && !result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card rounded-2xl border border-border/50 border-dashed p-10 flex flex-col items-center justify-center text-center"
                  >
                    <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <p className="text-base text-muted-foreground">Completa los datos del producto y genera la ficha</p>
                  </motion.div>
                )}

                {!loading && result && (
                  <GeneratedSheetResult
                    result={result}
                    imageUrl={imageUrl}
                    productName={productName}
                    price={price}
                    onPublish={handlePublish}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
