import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Upload, Trash2, Save, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Brand = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  show_in_home: boolean;
  display_order: number;
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("brands" as any)
      .select("*")
      .order("display_order", { ascending: true });
    setBrands((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = async (id: string, fields: Partial<Brand>) => {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)));
    const { error } = await supabase.from("brands" as any).update(fields).eq("id", id);
    if (error) toast.error("Error al guardar: " + error.message);
  };

  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const ext = file.name.split(".").pop();
      const path = `${id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-logos").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);
      await updateField(id, { logo_url: data.publicUrl });
      toast.success("Logo actualizado");
    } catch (e: any) {
      toast.error("Error al subir: " + e.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta marca?")) return;
    const { error } = await supabase.from("brands" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const slug = newName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const { error } = await supabase
      .from("brands" as any)
      .insert({ name: newName.trim(), slug, show_in_home: false, display_order: 999 });
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success("Marca creada");
    load();
  };

  return (
    <>
      <Helmet>
        <title>Admin · Marcas — Netpower IT</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al admin
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground mb-1">Gestión de Marcas</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sube logos, controla cuáles se muestran en el home y su orden.
        </p>

        {/* Add new */}
        <div className="flex gap-2 mb-6 p-4 rounded-xl border border-border bg-card">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la nueva marca…"
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="space-y-2">
            {brands.map((b) => (
              <div
                key={b.id}
                className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                {/* Logo preview */}
                <div className="w-20 h-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium px-2 text-center">{b.name}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => setBrands((prev) => prev.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)))}
                    onBlur={(e) => updateField(b.id, { name: e.target.value })}
                    className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-mono">/{b.slug}</p>
                </div>

                {/* Upload */}
                <label className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer hover:bg-accent">
                  {uploadingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(b.id, f);
                    }}
                  />
                </label>

                {/* Order */}
                <input
                  type="number"
                  value={b.display_order}
                  onChange={(e) => setBrands((prev) => prev.map((x) => (x.id === b.id ? { ...x, display_order: Number(e.target.value) } : x)))}
                  onBlur={(e) => updateField(b.id, { display_order: Number(e.target.value) })}
                  className="w-20 h-9 px-2 rounded-md border border-border bg-background text-sm text-center"
                  title="Orden"
                />

                {/* Show in home toggle */}
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={b.show_in_home}
                    onChange={(e) => updateField(b.id, { show_in_home: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  Home
                </label>

                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
