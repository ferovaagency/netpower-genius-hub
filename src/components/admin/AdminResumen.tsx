// Pestaña "Resumen" del admin, con la misma estructura que el panel de
// ferova-core-platform (src/components/admin/dashboard.tsx): cuatro cifras,
// una gráfica de los últimos 14 días, un reparto por estado y la lista de lo
// más reciente.
//
// Solo lectura: abrir el panel no cambia ningún registro.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Bell, FileText, Package, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const LIMIT = 1000;
const DAYS = 14;

export type AdminDestino = "aprobaciones" | "cotizaciones" | "productos" | "pedidos" | "whatsapp";

type Tone = "ok" | "wait" | "info" | "bad" | "idle";
type Result<T> = { rows: T[]; failed: boolean };

interface Quote {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  subject: string | null;
  status: string | null;
  created_at: string;
}
interface Order {
  status: string | null;
  total: number | null;
}
interface Product {
  price: number | null;
  sale_price: number | null;
  images: string[] | null;
}
interface Datos {
  quotes: Result<Quote>;
  orders: Result<Order>;
  availability: Result<{ status: string | null }>;
  products: Result<Product>;
  clicks: Result<{ created_at: string }>;
}

const ORDER_STATUS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
const QUOTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "Nueva", tone: "wait" },
  in_progress: { label: "En proceso", tone: "info" },
  sent: { label: "Enviada", tone: "info" },
  closed: { label: "Cerrada", tone: "ok" },
};
const VENDIDO = new Set(["paid", "shipped", "delivered"]);

async function leer<T>(
  tabla: "orders" | "quote_requests" | "availability_requests" | "products" | "whatsapp_clicks",
  columnas: string,
  armar?: (q: any) => any,
): Promise<Result<T>> {
  let q: any = supabase.from(tabla).select(columnas).limit(LIMIT);
  if (armar) q = armar(q);
  const { data, error } = await q;
  return { rows: (data ?? []) as T[], failed: Boolean(error) };
}

const cop = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
/** Si la consulta llegó al tope, la cifra es un mínimo y se dice. */
const cuenta = (n: number, total: number) => (total >= LIMIT ? `${n}+` : String(n));
const dia = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

export function AdminResumen({ onOpen }: { onOpen: (destino: AdminDestino) => void }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);

  const cargar = useCallback(async () => {
    setFallo(false);
    try {
      const desde = new Date(Date.now() - DAYS * 86400000).toISOString();
      const [quotes, orders, availability, products, clicks] = await Promise.all([
        leer<Quote>("quote_requests", "id,customer_name,customer_email,subject,status,created_at", (q) =>
          q.order("created_at", { ascending: false })),
        leer<Order>("orders", "status,total"),
        leer<{ status: string | null }>("availability_requests", "status"),
        leer<Product>("products", "price,sale_price,images", (q) => q.eq("active", true)),
        leer<{ created_at: string }>("whatsapp_clicks", "created_at", (q) => q.gte("created_at", desde)),
      ]);
      setDatos({ quotes, orders, availability, products, clicks });
    } catch {
      setFallo(true);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  if (fallo)
    return (
      <div className="admin-card text-center">
        <p>No fue posible cargar el resumen.</p>
        <Button className="mt-4" onClick={() => void cargar()}>Reintentar</Button>
      </div>
    );
  if (!datos) return <p className="py-16 text-center text-muted-foreground">Cargando…</p>;

  const { quotes, orders, availability, products, clicks } = datos;
  const nuevas = quotes.rows.filter((q) => q.status === "new").length;
  const disponibilidad = availability.rows.filter((r) => r.status === "pending").length;
  const porDespachar = orders.rows.filter((o) => o.status === "paid").length;
  const vendido = orders.rows
    .filter((o) => VENDIDO.has(o.status ?? ""))
    .reduce((t, o) => t + Number(o.total ?? 0), 0);
  const precio = (p: Product) => Number(p.sale_price ?? p.price ?? 0);
  const sinPrecio = products.rows.filter((p) => precio(p) <= 0).length;
  const sinFoto = products.rows.filter((p) => !(Array.isArray(p.images) && p.images[0])).length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<FileText aria-hidden="true" />}
          tone="wait"
          label="Cotizaciones nuevas"
          value={quotes.failed ? null : cuenta(nuevas, quotes.rows.length)}
          onClick={() => onOpen("cotizaciones")}
        />
        <Stat
          icon={<Bell aria-hidden="true" />}
          tone="info"
          label="Disponibilidad por responder"
          value={availability.failed ? null : cuenta(disponibilidad, availability.rows.length)}
          onClick={() => onOpen("aprobaciones")}
        />
        <Stat
          icon={<ShoppingBag aria-hidden="true" />}
          tone="ok"
          label="Pedidos pagados por enviar"
          value={orders.failed ? null : cuenta(porDespachar, orders.rows.length)}
          onClick={() => onOpen("pedidos")}
        />
        <Stat
          icon={<Package aria-hidden="true" />}
          tone="bad"
          label="Productos activos sin precio"
          value={products.failed ? null : cuenta(sinPrecio, products.rows.length)}
          onClick={() => onOpen("productos")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <GraficaDiaria clicks={clicks} onOpen={() => onOpen("whatsapp")} />
        <section className="admin-card">
          <h2>Pedidos por estado</h2>
          <p className="admin-sub">
            {orders.failed ? "Tienda" : `Vendido (pagado, enviado o entregado): ${cop(vendido)}`}
          </p>
          {orders.failed ? (
            <SinAcceso />
          ) : (
            <ul className="mt-6 grid gap-5">
              {Object.entries(ORDER_STATUS).map(([clave, etiqueta]) => {
                const n = orders.rows.filter((o) => o.status === clave).length;
                const parte = orders.rows.length ? (n / orders.rows.length) * 100 : 0;
                return (
                  <li key={clave}>
                    <div className="flex justify-between gap-4 text-sm">
                      <span>{etiqueta}</span>
                      <strong>{n}</strong>
                    </div>
                    <div className="meter" aria-hidden="true"><i style={{ width: `${parte}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="admin-card min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2>Últimas cotizaciones</h2>
              <p className="admin-sub">Formulario de cotización y Neti</p>
            </div>
            <Button variant="outline" className="rounded-full" onClick={() => onOpen("cotizaciones")}>Ver todas</Button>
          </div>
          {quotes.failed ? (
            <SinAcceso />
          ) : quotes.rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Todavía no hay cotizaciones.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr><th>Cliente</th><th>Asunto</th><th>Fecha</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {quotes.rows.slice(0, 6).map((q) => {
                    const estado = QUOTE_STATUS[q.status ?? ""];
                    return (
                      <tr key={q.id}>
                        <td>
                          <span className="font-semibold">{q.customer_name || q.customer_email || "Sin nombre"}</span>
                          {q.customer_name && q.customer_email ? (
                            <span className="block text-muted-foreground">{q.customer_email}</span>
                          ) : null}
                        </td>
                        <td className="max-w-[16rem] truncate">{q.subject || "—"}</td>
                        <td className="whitespace-nowrap">
                          {new Date(q.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                        </td>
                        <td><Chip tone={estado?.tone ?? "idle"}>{estado?.label ?? q.status ?? "—"}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="admin-card">
          <h2>Catálogo</h2>
          <p className="admin-sub">Productos activos en la tienda</p>
          <ul className="mt-4 divide-y divide-border">
            <Fila etiqueta="Activos" valor={products.failed ? "Sin acceso" : cuenta(products.rows.length, products.rows.length)} onClick={() => onOpen("productos")} />
            <Fila etiqueta="Sin precio" valor={products.failed ? "Sin acceso" : `${sinPrecio}`} onClick={() => onOpen("productos")} />
            <Fila etiqueta="Sin foto" valor={products.failed ? "Sin acceso" : `${sinFoto}`} onClick={() => onOpen("productos")} />
          </ul>
        </section>
      </div>
    </div>
  );
}

function SinAcceso() {
  return <p className="mt-6 text-sm text-muted-foreground">No se pudo leer este dato con tu cuenta.</p>;
}

function Stat({ icon, tone, label, value, onClick }: {
  icon: ReactNode; tone: Tone; label: string; value: string | null; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="admin-card stat-card">
      <span className={`stat-icon chip--${tone}`}>{icon}</span>
      <span className="min-w-0">
        <strong className="block text-2xl font-bold">{value ?? "—"}</strong>
        <span className="block text-sm text-muted-foreground">
          {label}{value === null ? " (sin acceso)" : ""}
        </span>
      </span>
    </button>
  );
}

function Fila({ etiqueta, valor, onClick }: { etiqueta: string; valor: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full justify-between gap-4 py-4 text-left hover:text-primary">
        <span className="font-semibold">{etiqueta}</span>
        <span className="text-muted-foreground">{valor}</span>
      </button>
    </li>
  );
}

function GraficaDiaria({ clicks, onOpen }: { clicks: Result<{ created_at: string }>; onOpen: () => void }) {
  const [activo, setActivo] = useState<number | null>(null);
  const hoy = new Date();
  const dias = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (DAYS - 1 - i));
    return { date: d, key: dia(d), n: 0 };
  });
  const porDia = new Map(dias.map((d) => [d.key, d]));
  for (const c of clicks.rows) {
    const d = porDia.get(dia(new Date(c.created_at)));
    if (d) d.n += 1;
  }
  const total = dias.reduce((t, d) => t + d.n, 0);
  const tope = Math.max(...dias.map((d) => d.n), 1);
  const largo = (d: Date) => d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="admin-card min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2>Contactos por WhatsApp</h2>
          <p className="admin-sub">Clics en el botón de WhatsApp por día, últimos {DAYS} días</p>
        </div>
        {clicks.failed ? null : (
          <button type="button" onClick={onOpen} className="text-2xl font-bold hover:text-primary">{total}</button>
        )}
      </div>
      {clicks.failed ? (
        <SinAcceso />
      ) : (
        <>
          <div className="day-chart" onMouseLeave={() => setActivo(null)}>
            <span className="day-chart__max">{tope}</span>
            {dias.map((d, i) => (
              <button
                key={d.key}
                type="button"
                className="day-chart__col"
                aria-label={`${largo(d.date)}: ${d.n}`}
                onMouseEnter={() => setActivo(i)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
              >
                {activo === i ? (
                  <span className="day-chart__tip" data-edge={i > DAYS / 2 ? "end" : undefined}>
                    <strong>{d.n}</strong> · {largo(d.date)}
                  </span>
                ) : null}
                <span className="day-chart__track"><i style={{ height: `${(d.n / tope) * 100}%` }} /></span>
                <span className="day-chart__label">{d.date.getDate()}</span>
              </button>
            ))}
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Ver como tabla</summary>
            <table className="admin-table mt-3">
              <thead><tr><th>Día</th><th>Contactos</th></tr></thead>
              <tbody>
                {dias.map((d) => <tr key={d.key}><td>{largo(d.date)}</td><td>{d.n}</td></tr>)}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
