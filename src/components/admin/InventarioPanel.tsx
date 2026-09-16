import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CloudDownload, Eye, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

type Cambio = {
  sku: string;
  nombre: string;
  stock: { antes: number; despues: number } | null;
  precio: { antes: number; despues: number } | null;
};

type Respuesta = {
  ok?: boolean;
  simulacion?: boolean;
  error?: string;
  resumen?: {
    filasHoja: number;
    productosConSku: number;
    actualizados: number;
    sinCambio: number;
    skuDeLaHojaSinProducto: number;
    productosSinFilaEnLaHoja: number;
    skuRepetidoEnHoja: number;
  };
  detalle?: Cambio[];
  skuNoEncontrado?: string[];
  sinFilaEnLaHoja?: { sku: string; nombre: string }[];
  errores?: string[];
};

const cop = (n: number) => "$" + (n || 0).toLocaleString("es-CO");

function haceCuanto(iso: string | null) {
  if (!iso) return "nunca";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hace menos de un minuto";
  if (min === 1) return "hace 1 minuto";
  if (min < 60) return `hace ${min} minutos`;
  const h = Math.floor(min / 60);
  if (h === 1) return "hace 1 hora";
  if (h < 24) return `hace ${h} horas`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

function Ficha({ etiqueta, valor, tono }: { etiqueta: string; valor: number; tono?: "alerta" | "bien" }) {
  return (
    <div className={`rounded-xl border p-4 ${tono === "alerta" ? "border-destructive/40 bg-destructive/5" : "bg-card"}`}>
      <p className="text-xs text-muted-foreground mb-1">{etiqueta}</p>
      <p className={`text-2xl font-bold ${tono === "alerta" ? "text-destructive" : tono === "bien" ? "text-green-700" : ""}`}>
        {valor}
      </p>
    </div>
  );
}

export function InventarioPanel({ onSincronizado }: { onSincronizado?: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [cargando, setCargando] = useState<"" | "revisar" | "aplicar">("");
  const [res, setRes] = useState<Respuesta | null>(null);
  const [ultima, setUltima] = useState<{ created_at: string; actualizados: number } | null>(null);

  const cargarUltima = useCallback(async () => {
    // types.ts lo genera Lovable y todavia no conoce esta tabla; el cast se quita
    // solo cuando se regeneren los tipos.
    const { data } = await (supabase as any)
      .from("sync_inventario_log")
      .select("created_at, actualizados")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setUltima((data as any) ?? null);
  }, []);

  useEffect(() => { cargarUltima(); }, [cargarUltima]);

  const correr = async (simulacion: boolean) => {
    setCargando(simulacion ? "revisar" : "aplicar");
    setRes(null);
    try {
      const { data, error } = await supabase.functions.invoke("inventory-sync", { body: { simulacion } });
      if (error) throw error;
      const r = data as Respuesta;
      if (r.error) throw new Error(r.error);
      setRes(r);
      if (!simulacion) {
        toast({
          title: "Inventario sincronizado",
          description: `${r.resumen?.actualizados ?? 0} productos actualizados.`,
        });
        await cargarUltima();
        await onSincronizado?.();
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setRes({ error: m });
      toast({ title: "No se pudo sincronizar", description: m, variant: "destructive" });
    } finally {
      setCargando("");
    }
  };

  const r = res?.resumen;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => correr(true)} disabled={!!cargando}>
          {cargando === "revisar" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
          Revisar cambios
        </Button>
        <Button onClick={() => correr(false)} disabled={!!cargando}>
          {cargando === "aplicar" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudDownload className="w-4 h-4 mr-2" />}
          Sincronizar ahora
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Última sincronización: {haceCuanto(ultima?.created_at ?? null)}
          {ultima ? ` · ${ultima.actualizados} actualizados` : ""}
        </span>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/50 border rounded-lg px-3 py-2">
        Cruza por SKU contra la hoja «Inventario» y escribe solo stock y precio. No crea productos,
        no desactiva nada y no toca el contenido de las fichas. Lo que esté en la web y no aparezca
        en la hoja se reporta abajo, pero no se modifica.
      </p>

      {res?.error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {res.error}
        </div>
      )}

      {r && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Ficha etiqueta={res?.simulacion ? "Van a cambiar" : "Actualizados"} valor={r.actualizados} tono="bien" />
            <Ficha etiqueta="Sin cambios" valor={r.sinCambio} />
            <Ficha etiqueta="SKU de la hoja sin producto" valor={r.skuDeLaHojaSinProducto} tono={r.skuDeLaHojaSinProducto ? "alerta" : undefined} />
            <Ficha etiqueta="En la web, sin fila en la hoja" valor={r.productosSinFilaEnLaHoja} tono={r.productosSinFilaEnLaHoja ? "alerta" : undefined} />
          </div>

          {res?.simulacion && (
            <p className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Esto es solo una revisión. Todavía no se escribió nada.
            </p>
          )}

          {!res?.simulacion && !res?.errores?.length && (
            <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Listo, sin errores. Se leyeron {r.filasHoja} filas de la hoja.
            </p>
          )}

          {!!res?.detalle?.length && (
            <div>
              <p className="text-sm font-semibold mb-2">
                Cambios ({r.actualizados}{res.detalle.length < r.actualizados ? `, se muestran ${res.detalle.length}` : ""})
              </p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">SKU</th>
                      <th className="px-3 py-2 text-left font-semibold">Producto</th>
                      <th className="px-3 py-2 text-left font-semibold">Stock</th>
                      <th className="px-3 py-2 text-left font-semibold">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.detalle.map((c, i) => (
                      <tr key={c.sku + i} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{c.sku}</td>
                        <td className="px-3 py-2 max-w-[380px] truncate" title={c.nombre}>{c.nombre}</td>
                        <td className="px-3 py-2">
                          {c.stock ? (
                            <span><span className="text-muted-foreground">{c.stock.antes}</span> → <span className="font-semibold">{c.stock.despues}</span></span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {c.precio ? (
                            <span><span className="text-muted-foreground">{cop(c.precio.antes)}</span> → <span className="font-semibold">{cop(c.precio.despues)}</span></span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!!res?.skuNoEncontrado?.length && (
            <div>
              <p className="text-sm font-semibold mb-2">SKU que están en la hoja y no en la web ({r.skuDeLaHojaSinProducto})</p>
              <p className="text-xs text-muted-foreground mb-2">
                Estos productos hay que crearlos a mano desde el generador de fichas. La sincronización no los crea.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {res.skuNoEncontrado.map((s) => (
                  <span key={s} className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-destructive/10 text-destructive">{s}</span>
                ))}
              </div>
            </div>
          )}

          {!!res?.sinFilaEnLaHoja?.length && (
            <div>
              <p className="text-sm font-semibold mb-2">En la web pero sin fila en la hoja ({r.productosSinFilaEnLaHoja})</p>
              <p className="text-xs text-muted-foreground mb-2">
                No se tocaron. Si deberían estar en el inventario, agrégalos a la hoja con su SKU.
              </p>
              <ul className="text-xs space-y-1 max-h-48 overflow-auto border rounded-lg p-3">
                {res.sinFilaEnLaHoja.map((p) => (
                  <li key={p.sku}><span className="font-mono text-muted-foreground">{p.sku}</span> · {p.nombre}</li>
                ))}
              </ul>
            </div>
          )}

          {!!res?.errores?.length && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive mb-2">Errores ({res.errores.length})</p>
              <ul className="text-xs list-disc pl-5 space-y-1">
                {res.errores.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
