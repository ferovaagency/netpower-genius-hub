import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Search, Loader2, Eye, Trash2, Package, Users, ShoppingBag, Bell } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();

  // ── APROBACIONES ──────────────────────────────────────────────
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; note: string }>({ open: false, id: "", note: "" });
  const [altSearch, setAltSearch] = useState("");
  const [altResults, setAltResults] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);

  const fetchRequests = useCallback(async () => {
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    await supabase.from("availability_requests").delete().neq("status", "pending").lt("updated_at", cutoff);
    const { data } = await supabase.from("availability_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setPendingCount((data || []).filter((r: any) => r.status === "pending").length);
    setLoadingReqs(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 8000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAvailable = async (id: string) => {
    await supabase.from("availability_requests").update({ status: "available", updated_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Marcado como disponible" });
    fetchRequests();
  };

  const handleUnavailable = async () => {
    await supabase.from("availability_requests").update({ status: "unavailable", admin_notes: noteModal.note, suggested_products: suggested, updated_at: new Date().toISOString() }).eq("id", noteModal.id);
    setNoteModal({ open: false, id: "", note: "" });
    setSuggested([]);
    toast({ title: "❌ Marcado como no disponible" });
    fetchRequests();
  };

  const searchAlternatives = async (term: string) => {
    setAltSearch(term);
    if (term.length < 2) { setAltResults([]); return; }
    const { data } = await supabase.from("products").select("id,name,slug,price,sale_price,images").eq("active", true).ilike("name", `%${term}%`).limit(6);
    setAltResults(data || []);
  };

  // ── PRODUCTOS ─────────────────────────────────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [loadingProds, setLoadingProds] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoadingProds(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleProduct = async (id: string, active: boolean) => {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p));
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: "Producto eliminado" });
  };

  const filteredProds = products.filter(p => p.name?.toLowerCase().includes(prodSearch.toLowerCase()));

  // ── PEDIDOS ───────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchOrders = useCallback(async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from("orders").select("*")
      .or(`created_at.gte.${twoWeeksAgo},status.neq.delivered`)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoadingOrders(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast({ title: "Estado actualizado" });
  };

  const filteredOrders = orders.filter(o =>
    (o.reference || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customer_email || "").toLowerCase().includes(orderSearch.toLowerCase())
  );

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-blue-100 text-blue-800", shipped: "bg-orange-100 text-orange-800", delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    const labels: Record<string, string> = { pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] || "bg-gray-100 text-gray-700"}`}>{labels[s] || s}</span>;
  };

  // ── USUARIOS ──────────────────────────────────────────────────
  const [customers, setCustomers] = useState<any[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [loadingCusts, setLoadingCusts] = useState(true);

  useEffect(() => {
    supabase.from("customers").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCustomers(data || []); setLoadingCusts(false); });
  }, []);

  const filteredCusts = customers.filter(c =>
    (c.name || "").toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(custSearch.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Panel Admin | Netpower IT</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold mb-6">Panel de Administración</h1>

        <Tabs defaultValue="aprobaciones">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="aprobaciones" className="relative">
              <Bell className="w-4 h-4 mr-1" /> Aprobaciones
              {pendingCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pendingCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="productos"><Package className="w-4 h-4 mr-1" /> Productos</TabsTrigger>
            <TabsTrigger value="pedidos"><ShoppingBag className="w-4 h-4 mr-1" /> Pedidos</TabsTrigger>
            <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-1" /> Usuarios</TabsTrigger>
          </TabsList>

          {/* APROBACIONES */}
          <TabsContent value="aprobaciones">
            {loadingReqs ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No hay solicitudes pendientes</p>
            ) : (
              <div className="space-y-4">
                {requests.map(r => (
                  <div key={r.id} className="border rounded-xl p-5 bg-card shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold">{r.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{r.customer_email} · {r.customer_phone}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("es-CO")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "pending" ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pendiente</span>
                          : r.status === "available" ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Disponible</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">No disponible</span>}
                      </div>
                    </div>
                    <div className="text-sm mb-3">
                      {Array.isArray(r.items) && r.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-border last:border-0">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">${(item.price * item.quantity).toLocaleString("es-CO")} COP</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold">
                        <span>Total</span><span>${(r.total || 0).toLocaleString("es-CO")} COP</span>
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAvailable(r.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Disponible
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setNoteModal({ open: true, id: r.id, note: "" }); setSuggested([]); }}>
                          <XCircle className="w-4 h-4 mr-1" /> No disponible
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Modal no disponible */}
            {noteModal.open && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
                  <h3 className="font-bold text-lg">Marcar como no disponible</h3>
                  <textarea value={noteModal.note} onChange={e => setNoteModal(m => ({ ...m, note: e.target.value }))}
                    placeholder="Nota para el cliente (opcional)..." rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Productos alternativos (opcional):</p>
                    <Input placeholder="Buscar producto..." value={altSearch} onChange={e => searchAlternatives(e.target.value)} className="mb-2" />
                    {altResults.map(p => (
                      <button key={p.id} onClick={() => { setSuggested(prev => [...prev, { id: p.id, name: p.name, slug: p.slug, price: p.sale_price || p.price, image: p.images?.[0] }]); setAltResults([]); setAltSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg border-b border-border last:border-0">
                        {p.name} — ${(p.sale_price || p.price || 0).toLocaleString("es-CO")} COP
                      </button>
                    ))}
                    {suggested.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1 bg-muted rounded-lg mb-1 text-sm">
                        <span>{s.name}</span>
                        <button onClick={() => setSuggested(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setNoteModal({ open: false, id: "", note: "" })}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleUnavailable}>Confirmar</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* PRODUCTOS */}
          <TabsContent value="productos">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} className="max-w-xs" />
            </div>
            {loadingProds ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left font-semibold">Precio</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProds.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                            <span className="font-medium line-clamp-1 max-w-[200px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">${(p.sale_price || p.price || 0).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                            {p.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleProduct(p.id, p.active)} className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-accent transition">
                              {p.active ? "Desactivar" : "Activar"}
                            </button>
                            <button onClick={() => window.open(`/producto/${p.slug}`, "_blank")} className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteProduct(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProds.length === 0 && <p className="text-center text-muted-foreground py-8">No hay productos</p>}
              </div>
            )}
          </TabsContent>

          {/* PEDIDOS */}
          <TabsContent value="pedidos">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por referencia o email..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="max-w-xs" />
            </div>
            {loadingOrders ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Referencia</th>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedOrder(o)}>
                        <td className="px-4 py-3 font-mono text-xs font-bold">{o.reference}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">${(o.total || 0).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("es-CO")}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
                            <option value="pending">Pendiente</option>
                            <option value="paid">Pagado</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pedidos</p>}
              </div>
            )}

            {/* Modal detalle pedido */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Pedido #{selectedOrder.reference}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString("es-CO")}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
                  </div>
                  <div className="space-y-1 mb-4 text-sm">
                    <p><span className="font-semibold">Cliente:</span> {selectedOrder.customer_name}</p>
                    <p><span className="font-semibold">Email:</span> {selectedOrder.customer_email}</p>
                    <p><span className="font-semibold">Teléfono:</span> {selectedOrder.customer_phone}</p>
                    <p><span className="font-semibold">Estado:</span> {statusBadge(selectedOrder.status)}</p>
                  </div>
                  <div className="border rounded-xl overflow-hidden mb-4">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between px-4 py-2.5 text-sm border-b border-border last:border-0">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")} COP</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-muted/30 font-bold text-sm">
                      <span>Total</span><span>${(selectedOrder.total || 0).toLocaleString("es-CO")} COP</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* USUARIOS */}
          <TabsContent value="usuarios">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o email..." value={custSearch} onChange={e => setCustSearch(e.target.value)} className="max-w-xs" />
            </div>
            {loadingCusts ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                      <th className="px-4 py-3 text-left font-semibold">Ciudad</th>
                      <th className="px-4 py-3 text-left font-semibold">Última compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCusts.map(c => (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                        <td className="px-4 py-3">{c.phone || "—"}</td>
                        <td className="px-4 py-3">{c.city || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("es-CO") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCusts.length === 0 && <p className="text-center text-muted-foreground py-8">No hay usuarios registrados</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
