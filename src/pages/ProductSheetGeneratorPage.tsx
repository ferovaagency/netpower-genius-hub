import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  DollarSign,
  Image as ImageIcon,
  Edit3,
  Power,
} from "lucide-react";
import { categories, brands } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import GeneratedSheetResult from "@/components/admin/GeneratedSheetResult";
import BulkProductImporter from "@/components/admin/BulkProductImporter";
import type { Product } from "@/types/store";
import {
  upsertProductDB,
  updateProductDB,
  deleteProductDB,
  setProductActiveDB,
  fetchAllProducts,
} from "@/hooks/useProducts";
import { ALLOWED_PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORY } from "@/lib/catalog";
import { generateSlug } from "@/lib/slug";

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

type TabMode = "create" | "edit";

export default function ProductSheetGeneratorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TabMode>("create");

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_PRODUCT_CATEGORY);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [specEntries, setSpecEntries] = useState<SpecEntry[]>([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<GeneratedSheet | null>(null);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editSearch, setEditSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  // Auto-load product when navigating from admin with ?edit=slug
  useEffect(() => {
    const editSlug = searchParams.get("edit");
    if (!editSlug) return;
    setTab("edit");
    (async () => {
      const product = await fetchProductBySlug(editSlug);
      if (product) loadProduct(product);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSpec = () => setSpecEntries([...specEntries, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecEntries(specEntries.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    const updated = [...specEntries];
    updated[i][field] = val;
    setSpecEntries(updated);
  };

  const handleSearchChange = async (value: string) => {
    setEditSearch(value);
    setSelectedProduct(null);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const all = await fetchAllProducts();
      const filtered = all
        .filter((p) => p.name.toLowerCase().includes(value.trim().toLowerCase()))
        .slice(0, 8);
      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductName(p.name);
    setSku(p.sku);
    setPrice(String(p.price));
    setSalePrice(p.salePrice ? String(p.salePrice) : "");
    setStock(String(p.stock));
    setImageUrl(p.images?.[0] || "");

    const cat = categories.find((c) => c.id === p.categoryId);
    const br = brands.find((b) => b.id === p.brandId);
    setBrand(br?.name || "");
    setCategory(cat?.name || DEFAULT_PRODUCT_CATEGORY);

    const specs = Object.entries(p.specs || {}).map(([key, value]) => ({ key, value }));
    setSpecEntries(specs.length > 0 ? specs : [{ key: "", value: "" }]);
    setEditSearch(p.name);
    setSearchResults([]);
    setResult(null);
    setError("");
  };

  const handleGenerate = async () => {
    if (tab === "edit" && !selectedProduct) {
      setError("Busca y selecciona un producto para editar.");
      return;
    }
    if (!productName.trim()) {
      setError("Ingresa el nombre del producto");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const specs: Record<string, string> = {};
    specEntries.forEach((s) => {
      if (s.key.trim() && s.value.trim()) specs[s.key.trim()] = s.value.trim();
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-product-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ productName, brand, category, sku, specs }),
      });

      if (!response.ok) {
        let errMsg = `Error ${response.status}`;
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch {
          // noop
        }
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

  const downloadImageToStorage = async (externalUrl: string, slug: string): Promise<string> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/download-product-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ imageUrl: externalUrl, fileName: slug }),
      });

      if (!resp.ok) throw new Error("Failed to download image");
      const data = await resp.json();
      return data.url || externalUrl;
    } catch (e) {
      console.error("Image download failed, using original URL:", e);
      return externalUrl;
    }
  };

  const handlePublish = async () => {
    if (!result) return;
    if (tab === "edit" && !selectedProduct) {
      toast.error("Selecciona el producto a editar");
      return;
    }

    setPublishing(true);

    try {
      const detectedBrand = (result as any).detectedBrand;

      const selectedCategory =
        categories.find((c) => c.name === category) ||
        categories.find((c) => c.name === DEFAULT_PRODUCT_CATEGORY) ||
        categories[0];
      const selectedBrand =
        brands.find((b) => b.name === brand) ||
        brands.find((b) => b.name === detectedBrand) ||
        brands[0];

      const slug = generateSlug(productName);
      const parsedPrice = Number(price) || 0;
      const parsedSalePrice = salePrice ? Number(salePrice) : null;
      const parsedStock = Number.isFinite(Number(stock)) ? Math.max(0, Math.floor(Number(stock))) : 0;

      let finalImageUrl = imageUrl;
      if (imageUrl) {
        toast.info("Descargando imagen al servidor...");
        finalImageUrl = await downloadImageToStorage(imageUrl, slug);
      }

      if (tab === "edit" && selectedProduct) {
        const updated = await updateProductDB(selectedProduct.id, {
          name: productName,
          description: result.description,
          shortDesc: result.shortDesc,
          price: parsedPrice,
          salePrice: parsedSalePrice,
          stock: parsedStock,
          sku: sku || selectedProduct.sku || `SKU-${Date.now()}`,
          images: finalImageUrl ? [finalImageUrl] : selectedProduct.images || [],
          categoryId: selectedCategory.id,
          brandId: selectedBrand.id,
          specs: result.specs,
          metaTitle: result.metaTitle,
          metaDesc: result.metaDesc,
          slug,
          active: selectedProduct.active ?? true,
        });

        toast.success("¡Producto actualizado!", {
          description: `"${productName}" fue actualizado correctamente.`,
        });
        navigate(`/producto/${updated.slug}`);
        return;
      }

      const newProduct: Omit<Product, "id"> = {
        slug,
        name: productName,
        description: result.description,
        shortDesc: result.shortDesc,
        price: parsedPrice,
        salePrice: parsedSalePrice,
        sku: sku || `SKU-${Date.now()}`,
        stock: parsedStock,
        images: finalImageUrl ? [finalImageUrl] : [],
        categoryId: selectedCategory.id,
        brandId: selectedBrand.id,
        specs: result.specs,
        metaTitle: result.metaTitle,
        metaDesc: result.metaDesc,
        active: true,
        featured: false,
      };

      const { product: savedProduct, updated } = await upsertProductDB(newProduct as Product);

      toast.success(updated ? "¡Producto existente actualizado!" : "¡Producto publicado exitosamente!", {
        description: updated
          ? `"${productName}" ya existía y se actualizó.`
          : `"${productName}" ya está visible en la tienda.`,
      });

      navigate(`/producto/${savedProduct.slug}`);
    } catch (e: any) {
      toast.error("Error al publicar: " + (e.message || "Intenta de nuevo"));
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedProduct) return;
    try {
      const updated = await setProductActiveDB(selectedProduct.id, !selectedProduct.active);
      toast.success(updated.active ? "Producto activado" : "Producto desactivado", {
        description: `"${updated.name}" ${updated.active ? "volvió" : "dejó"} de mostrarse en la tienda.`,
      });
      loadProduct(updated);
    } catch (e: any) {
      toast.error("No se pudo cambiar el estado: " + e.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${selectedProduct.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await deleteProductDB(selectedProduct.id);
      toast.success("Producto eliminado", {
        description: `"${selectedProduct.name}" fue eliminado del catálogo.`,
      });
      resetForm();
    } catch (e: any) {
      toast.error("No se pudo eliminar: " + e.message);
    }
  };

  const resetForm = async () => {
    setProductName("");
    setBrand("");
    setCategory(DEFAULT_PRODUCT_CATEGORY);
    setSku("");
    setPrice("");
    setSalePrice("");
    setStock("10");
    setImageUrl("");
    setSpecEntries([{ key: "", value: "" }]);
    setResult(null);
    setError("");
    setSelectedProduct(null);
    setEditSearch("");
    setSearchResults([]);
  };

  return (
    <>
      <Helmet>
        <title>Generador de Fichas con IA | NetPower IT</title>
        <meta
          name="description"
          content="Genera fichas de producto profesionales con inteligencia artificial para tu tienda NetPower IT."
        />
      </Helmet>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Generador de Fichas con IA</h1>
              <p className="text-base text-muted-foreground">Crea o edita descripciones técnicas profesionales</p>
            </div>
          </div>

          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-8 w-fit">
            <button
              onClick={() => {
                setTab("create");
                void resetForm();
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${tab === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sparkles className="w-4 h-4" /> Crear Nuevo
            </button>
            <button
              onClick={() => {
                setTab("edit");
                void resetForm();
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${tab === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Edit3 className="w-4 h-4" /> Editar Existente
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card h-fit">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
                {tab === "edit" ? "Editar Producto" : "Datos del Producto"}
              </h2>

              <div className="space-y-4">
                {tab === "edit" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground">Buscar producto por nombre *</label>
                    <input
                      type="text"
                      value={editSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Escribe mínimo 2 letras..."
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />

                    {editSearch.trim().length >= 2 && (
                      <div className="rounded-lg border border-border bg-background max-h-56 overflow-y-auto">
                        {searching ? (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                          </p>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => loadProduct(p)}
                              className="w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-accent transition"
                            >
                              <p className="text-sm font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {p.sku} · Stock: {p.stock} · {p.active ? "Activo" : "Inactivo"}
                              </p>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2.5 text-xs text-muted-foreground">No se encontraron productos con ese nombre.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tab === "edit" && selectedProduct && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={handleToggleActive}
                      type="button"
                      className="h-10 rounded-lg border border-border bg-secondary/10 text-secondary text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                      <Power className="w-4 h-4" /> {selectedProduct.active ? "Desactivar producto" : "Activar producto"}
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      type="button"
                      className="h-10 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar producto
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nombre del producto *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej: UPS APC Back-UPS 1500VA"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Marca</label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      <option value="">Auto-detectar IA</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      {ALLOWED_PRODUCT_CATEGORIES.map((categoryOption) => (
                        <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ej: BX1500M-LM60"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      <DollarSign className="w-3 h-3 inline mr-1" />Precio (COP)
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="489900"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Solo números, sin puntos ni comas.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Precio oferta (COP)</label>
                    <input
                      type="text"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="Opcional"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cantidad disponible</label>
                    <input
                      type="text"
                      value={stock}
                      onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="10"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    <ImageIcon className="w-3 h-3 inline mr-1" />URL de imagen del producto
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">La imagen se descargará a nuestro servidor al publicar.</p>
                  {imageUrl && (
                    <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-contain"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-muted-foreground">Especificaciones conocidas</label>
                    <button onClick={addSpec} type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {specEntries.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={s.key}
                          onChange={(e) => updateSpec(i, "key", e.target.value)}
                          placeholder="Ej: Potencia"
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                        <input
                          type="text"
                          value={s.value}
                          onChange={(e) => updateSpec(i, "value", e.target.value)}
                          placeholder="Ej: 1500VA"
                          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                        {specEntries.length > 1 && (
                          <button
                            onClick={() => removeSpec(i)}
                            type="button"
                            className="p-2 text-muted-foreground hover:text-destructive transition"
                          >
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
                  type="button"
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generando ficha...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {tab === "edit" ? "Regenerar Ficha con IA" : "Generar Ficha con IA"}</>
                  )}
                </button>

                {tab === "create" && (
                  <div className="mt-6 border-t border-border pt-6">
                    <BulkProductImporter onCompleted={resetForm} />
                  </div>
                )}
              </div>
            </div>

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
                    <p className="text-base text-muted-foreground">
                      {tab === "edit"
                        ? "Busca un producto por nombre, selecciónalo y genera la ficha actualizada"
                        : "Completa los datos del producto y genera la ficha o usa la carga masiva"}
                    </p>
                  </motion.div>
                )}
                {!loading && result && (
                  <GeneratedSheetResult
                    result={result}
                    imageUrl={imageUrl}
                    productName={productName}
                    price={price}
                    onPublish={handlePublish}
                    publishing={publishing}
                    isEdit={tab === "edit"}
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
