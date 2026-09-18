import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Search, Loader2, Eye, Trash2, Package, Users, ShoppingBag, Bell, Pencil, FileText, Mail, Phone, MessageCircle, Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { descargarCatalogo } from "@/lib/exportProducts";
import { InventarioPanel } from "@/components/admin/InventarioPanel";

export default function AdminPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [soloSinSku, setSoloSinSku] = useState(false);
  const [editandoSku, setEditandoSku] = useState<string | null>(null);
  const [borradorSku, setBorradorSku] = useState("");
  const [guardandoSku, setGuardandoSku] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState<string | null>(null);
  const [borradorNombre, setBorradorNombre] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState<string | null>(null);

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
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast({ title: "Producto eliminado" });
  };

  const filteredProds = products.filter(p => {
    if (soloSinSku && (p.sku || "").trim()) return false;
    const t = prodSearch.trim().toLowerCase();
    if (!t) return true;
    return (p.name || "").toLowerCase().includes(t) || (p.sku || "").toLowerCase().includes(t);
  });

  // ── EDICION RAPIDA DEL SKU ────────────────────────────────────
  // Para asignar los SKU de la hoja sin entrar a la ficha de cada producto.
  const abrirEdicionSku = (p: any) => {
    setEditandoSku(p.id);
    setBorradorSku(p.sku || "");
  };

  const guardarSku = async (id: string, avanzarA?: string) => {
    const valor = borradorSku.trim();
    const actual = products.find(x => x.id === id);
    if (!actual) return;

    if (valor === (actual.sku || "")) {
      setEditandoSku(avanzarA ?? null);
      if (avanzarA) setBorradorSku(products.find(x => x.id === avanzarA)?.sku || "");
      return;
    }

    // Un SKU repetido rompe el cruce con la hoja, asi que se avisa antes de guardar.
    if (valor) {
      const repetido = products.find(x => x.id !== id && (x.sku || "").trim().toLowerCase() === valor.toLowerCase());
      if (repetido) {
        toast({
          title: "Ese SKU ya está usado",
          description: repetido.name,
          variant: "destructive",
        });
        return;
      }
    }

    setGuardandoSku(id);
    const { error } = await supabase.from("products").update({ sku: valor || null }).eq("id", id);
    setGuardandoSku(null);

    if (error) {
      toast({ title: "No se pudo guardar el SKU", description: error.message, variant: "destructive" });
      return;
    }

    setProducts(prev => prev.map(x => x.id === id ? { ...x, sku: valor || null } : x));
    setEditandoSku(avanzarA ?? null);
    setBorradorSku(avanzarA ? (products.find(x => x.id === avanzarA)?.sku || "") : "");
  };

  // El nombre se edita aqui y no viaja a la hoja de inventario: la sincronizacion
  // cruza por SKU y solo escribe stock y precio. El slug tampoco se toca, porque
  // es la URL que ya esta indexada.
  const guardarNombre = async (id: string, avanzarA?: string) => {
    const valor = borradorNombre.trim();
    const actual = products.find(x => x.id === id);
    if (!actual) return;

    const salir = () => {
      setEditandoNombre(avanzarA ?? null);
      setBorradorNombre(avanzarA ? (products.find(x => x.id === avanzarA)?.name || "") : "");
    };

    if (valor === actual.name) { salir(); return; }
    if (!valor) {
      toast({ title: "El nombre no puede quedar vacio", variant: "destructive" });
      return;
    }

    setGuardandoNombre(id);
    const { error } = await supabase.from("products").update({ name: valor }).eq("id", id);
    setGuardandoNombre(null);

    if (error) {
      toast({ title: "No se pudo guardar el nombre", description: error.message, variant: "destructive" });
      return;
    }

    setProducts(prev => prev.map(x => x.id === id ? { ...x, name: valor } : x));
    salir();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllVisible = () => {
    const visibleIds = filteredProds.map(p => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} producto(s)? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    const { error } = await supabase.from("products").delete().in("id", selectedIds);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${selectedIds.length} producto(s) eliminado(s)` });
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    }
    setBulkDeleting(false);
  };

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

  // ── COTIZACIONES ──────────────────────────────────────────────
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [newQuotesCount, setNewQuotesCount] = useState(0);

  const fetchQuotes = useCallback(async () => {
    const { data } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200);
    setQuotes(data || []);
    setNewQuotesCount((data || []).filter((q: any) => q.status === "new").length);
    setLoadingQuotes(false);
  }, []);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 15000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  const updateQuoteStatus = async (id: string, status: string) => {
    await supabase.from("quote_requests").update({ status }).eq("id", id);
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    if (selectedQuote?.id === id) setSelectedQuote({ ...selectedQuote, status });
    toast({ title: "Estado actualizado" });
    fetchQuotes();
  };

  const deleteQuote = async (id: string) => {
    if (!window.confirm("¿Eliminar esta cotización?")) return;
    await supabase.from("quote_requests").delete().eq("id", id);
    setQuotes(prev => prev.filter(q => q.id !== id));
    setSelectedQuote(null);
    toast({ title: "Cotización eliminada" });
  };

  const filteredQuotes = quotes.filter(q =>
    (q.customer_name || "").toLowerCase().includes(quoteSearch.toLowerCase()) ||
    (q.customer_email || "").toLowerCase().includes(quoteSearch.toLowerCase()) ||
    (q.message || "").toLowerCase().includes(quoteSearch.toLowerCase())
  );

  const quoteStatusBadge = (s: string) => {
    const map: Record<string, string> = { new: "bg-blue-100 text-blue-800", in_progress: "bg-yellow-100 text-yellow-800", sent: "bg-green-100 text-green-800", closed: "bg-gray-100 text-gray-700" };
    const labels: Record<string, string> = { new: "Nueva", in_progress: "En proceso", sent: "Enviada", closed: "Cerrada" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] || "bg-gray-100"}`}>{labels[s] || s}</span>;
  };

  const sourceLabel = (s: string) => {
    const m: Record<string, string> = { contact_form: "Formulario contacto", neti_chat: "Chat Neti (AI)", quote_page: "Página cotización" };
    return m[s] || s;
  };

  /**
   * Canal de la cotizacion: si vino de pauta o no.
   * Las filas viejas no tienen `canal` guardado, asi que se reconstruye desde la
   * atribucion. Si tampoco hay atribucion, se dice "Sin dato" — que no es lo
   * mismo que organico, y mezclarlos falsearia el reporte.
   */
  const canalDeCotizacion = (q: any): { texto: string; pago: boolean; dato: boolean } => {
    const d = q?.details || {};
    const guardado: string | undefined = d.canal;
    if (guardado) {
      const pago = guardado.startsWith("Pauta");
      return { texto: guardado, pago, dato: guardado !== "Desconocido" };
    }
    const a = d.atribucion || {};
    if (a.gclid || a.wbraid || a.gbraid) return { texto: "Pauta Google Ads", pago: true, dato: true };
    if (a.utm_medium && /^(cpc|ppc|paid|display|cpm)$/i.test(a.utm_medium)) return { texto: "Pauta", pago: true, dato: true };
    if (a.utm_source || a.utm_campaign) return { texto: "Referido", pago: false, dato: true };
    if (a.referrer === "directo") return { texto: "Directo", pago: false, dato: true };
    if (a.referrer) return { texto: /(google|bing|yahoo|duckduckgo)\./i.test(a.referrer) ? "Organico" : "Referido", pago: false, dato: true };
    return { texto: "Sin dato", pago: false, dato: false };
  };

  const canalBadge = (q: any) => {
    const c = canalDeCotizacion(q);
    const clase = c.pago
      ? "bg-primary/10 text-primary border-primary/30"
      : c.dato
        ? "bg-muted text-muted-foreground border-border"
        : "bg-secondary/10 text-secondary border-secondary/30";
    return (
      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${clase}`}>
        {c.texto}
      </span>
    );
  };

  // ── CLICS A WHATSAPP ──────────────────────────────────────────
  // Cada fila es un clic al boton de WhatsApp, no una conversacion.
  // `escribio` empieza en NULL: nadie sabe todavia si la persona mando el
  // mensaje. Se marca a mano cotejando el codigo Ref que viaja en el texto.
  const [waClicks, setWaClicks] = useState<any[]>([]);
  const [loadingWa, setLoadingWa] = useState(true);
  const [waSearch, setWaSearch] = useState("");
  const [waSoloPauta, setWaSoloPauta] = useState(false);

  const fetchWaClicks = useCallback(async () => {
    // types.ts lo genera Lovable y todavia no conoce esta tabla.
    const { data, error } = await (supabase as any)
      .from("whatsapp_clicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error("whatsapp_clicks:", error.message);
    setWaClicks(data || []);
    setLoadingWa(false);
  }, []);

  useEffect(() => {
    fetchWaClicks();
    const i = setInterval(fetchWaClicks, 30000);
    return () => clearInterval(i);
  }, [fetchWaClicks]);

  const marcarEscribio = async (id: string, valor: boolean | null) => {
    const { error } = await (supabase as any)
      .from("whatsapp_clicks")
      .update({ escribio: valor })
      .eq("id", id);
    if (error) { toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" }); return; }
    setWaClicks(prev => prev.map(c => (c.id === id ? { ...c, escribio: valor } : c)));
  };

  const filteredWa = waClicks.filter(c => {
    if (waSoloPauta && !String(c.canal || "").startsWith("Pauta")) return false;
    const q = waSearch.toLowerCase();
    if (!q) return true;
    return [c.ref_code, c.product_name, c.product_sku, c.origen, c.canal, c.page_path]
      .some(v => String(v || "").toLowerCase().includes(q));
  });

  // Una fila cargada a mano no es un clic medido: no se sabe de donde vino esa
  // persona. Se marca para poder excluirla de los numeros de canal, porque
  // mezclarla ahi falsearia justo la cifra que sirve para decidir la pauta.
  const esManual = (c: any) => c?.origen === "carga_manual";
  const clicsDelSitio = waClicks.filter(c => !esManual(c));

  const waResumen = {
    delSitio: clicsDelSitio.length,
    pauta: clicsDelSitio.filter(c => String(c.canal || "").startsWith("Pauta")).length,
    escribieron: waClicks.filter(c => c.escribio === true).length,
    manuales: waClicks.filter(esManual).length,
  };

  // ── ALTA MANUAL DE CONTACTOS VIEJOS ───────────────────────────
  // Para los que escribieron antes de que existiera el seguimiento. No tienen
  // codigo Ref porque nunca pasaron por el sitio con el tracker puesto.
  const [waForm, setWaForm] = useState<{ abierto: boolean; fecha: string; producto: string; contacto: string; notas: string }>(
    { abierto: false, fecha: new Date().toISOString().slice(0, 10), producto: "", contacto: "", notas: "" }
  );
  const [guardandoWa, setGuardandoWa] = useState(false);

  const codigoManual = () => {
    const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let x = "";
    for (let i = 0; i < 4; i++) x += A[Math.floor(Math.random() * A.length)];
    return `MAN-${x}`;
  };

  const guardarContactoManual = async () => {
    if (!waForm.contacto.trim()) {
      toast({ title: "Falta el contacto", description: "Escribí al menos el nombre o el teléfono.", variant: "destructive" });
      return;
    }
    setGuardandoWa(true);
    const { error } = await (supabase as any).from("whatsapp_clicks").insert({
      ref_code: codigoManual(),
      origen: "carga_manual",
      // "Sin dato" a proposito: no se sabe de donde vino y no se va a inventar.
      canal: "Sin dato",
      page_path: null,
      product_name: waForm.producto.trim() || null,
      atribucion: {},
      // Se carga porque escribio: por eso queda confirmado de entrada.
      escribio: true,
      notas: [waForm.contacto.trim(), waForm.notas.trim()].filter(Boolean).join(" — "),
      created_at: new Date(`${waForm.fecha}T12:00:00`).toISOString(),
    });
    setGuardandoWa(false);
    if (error) { toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contacto agregado" });
    setWaForm({ abierto: false, fecha: new Date().toISOString().slice(0, 10), producto: "", contacto: "", notas: "" });
    fetchWaClicks();
  };

  // ── CONVERSACIONES NETI ───────────────────────────────────────
  const [convs, setConvs] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convSearch, setConvSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<any>(null);

  const fetchConvs = useCallback(async () => {
    const { data } = await supabase.from("neti_conversations").select("*").order("updated_at", { ascending: false }).limit(200);
    setConvs(data || []);
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    fetchConvs();
    const interval = setInterval(fetchConvs, 20000);
    return () => clearInterval(interval);
  }, [fetchConvs]);

  const deleteConv = async (id: string) => {
    if (!window.confirm("¿Eliminar esta conversación?")) return;
    await supabase.from("neti_conversations").delete().eq("id", id);
    setConvs(prev => prev.filter(c => c.id !== id));
    setSelectedConv(null);
    toast({ title: "Conversación eliminada" });
  };

  const filteredConvs = convs.filter(c =>
    (c.customer_name || "").toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.customer_email || "").toLowerCase().includes(convSearch.toLowerCase()) ||
    (c.session_id || "").toLowerCase().includes(convSearch.toLowerCase())
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
            <TabsTrigger value="cotizaciones" className="relative">
              <FileText className="w-4 h-4 mr-1" /> Cotizaciones
              {newQuotesCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{newQuotesCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="productos"><Package className="w-4 h-4 mr-1" /> Productos</TabsTrigger>
            <TabsTrigger value="inventario"><RefreshCw className="w-4 h-4 mr-1" /> Inventario</TabsTrigger>
            <TabsTrigger value="pedidos"><ShoppingBag className="w-4 h-4 mr-1" /> Pedidos</TabsTrigger>
            <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-1" /> Usuarios</TabsTrigger>
            <TabsTrigger value="conversaciones"><MessageCircle className="w-4 h-4 mr-1" /> Conversaciones Neti</TabsTrigger>
            <TabsTrigger value="whatsapp"><Phone className="w-4 h-4 mr-1" /> WhatsApp</TabsTrigger>
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
              <Input placeholder="Buscar por nombre o SKU..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} className="max-w-xs" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => descargarCatalogo(filteredProds, prodSearch.trim() ? "-filtrado" : "")}
                disabled={loadingProds || filteredProds.length === 0}
                title="Baja a Excel lo que estas viendo ahora mismo"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar Excel ({filteredProds.length})
              </Button>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloSinSku}
                  onChange={e => setSoloSinSku(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                Solo sin SKU
              </label>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-destructive">
                  {selectedIds.length} producto(s) seleccionado(s)
                </span>
                <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={bulkDeleting}>
                  {bulkDeleting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Eliminando...</> : <><Trash2 className="w-3 h-3 mr-1" /> Eliminar seleccionados</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Cancelar</Button>
              </div>
            )}

            {loadingProds ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredProds.length > 0 && filteredProds.every(p => selectedIds.includes(p.id))}
                          onChange={selectAllVisible}
                          className="rounded cursor-pointer"
                          aria-label="Seleccionar todos"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left font-semibold">SKU</th>
                      <th className="px-4 py-3 text-left font-semibold">Precio</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProds.map((p, idx) => (
                      <tr key={p.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${selectedIds.includes(p.id) ? "bg-destructive/5" : ""}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded cursor-pointer"
                            aria-label={`Seleccionar ${p.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                            {editandoNombre === p.id ? (
                              <input
                                autoFocus
                                value={borradorNombre}
                                onChange={e => setBorradorNombre(e.target.value)}
                                onBlur={() => guardarNombre(p.id)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    guardarNombre(p.id, filteredProds[idx + 1]?.id);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditandoNombre(null);
                                  }
                                }}
                                className="w-[260px] px-2 py-1 rounded-lg border border-primary bg-background text-sm outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => { setEditandoNombre(p.id); setBorradorNombre(p.name); }}
                                title="Clic para editar el nombre. Enter guarda y pasa al siguiente. La URL no cambia."
                                className="font-medium text-left line-clamp-1 max-w-[260px] px-2 py-1 rounded-lg border border-dashed border-transparent hover:border-border hover:bg-accent transition"
                              >
                                {guardandoNombre === p.id ? "guardando..." : p.name}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editandoSku === p.id ? (
                            <input
                              autoFocus
                              value={borradorSku}
                              onChange={e => setBorradorSku(e.target.value)}
                              onBlur={() => guardarSku(p.id)}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  guardarSku(p.id, filteredProds[idx + 1]?.id);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  setEditandoSku(null);
                                }
                              }}
                              placeholder="SKU"
                              className="w-28 px-2 py-1 rounded-lg border border-primary bg-background font-mono text-xs outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => abrirEdicionSku(p)}
                              title="Clic para asignar el SKU. Enter guarda y pasa al siguiente."
                              className={`w-28 text-left px-2 py-1 rounded-lg border border-dashed border-transparent hover:border-border hover:bg-accent transition font-mono text-xs ${p.sku ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {guardandoSku === p.id ? "guardando..." : (p.sku || "+ SKU")}
                            </button>
                          )}
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
                            <button onClick={() => navigate(`/admin/generador-fichas?edit=${p.slug}`)} className="p-1.5 rounded-lg hover:bg-accent transition text-primary" title="Editar">
                              <Pencil className="w-4 h-4" />
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

          <TabsContent value="inventario">
            <InventarioPanel onSincronizado={fetchProducts} />
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

          {/* COTIZACIONES */}
          <TabsContent value="cotizaciones">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email o mensaje..." value={quoteSearch} onChange={e => setQuoteSearch(e.target.value)} className="max-w-md" />
            </div>
            {loadingQuotes ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : filteredQuotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No hay cotizaciones todavía</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                      <th className="px-4 py-3 text-left font-semibold">Origen</th>
                      <th className="px-4 py-3 text-left font-semibold">Canal</th>
                      <th className="px-4 py-3 text-left font-semibold">Resumen</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map(q => (
                      <tr key={q.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedQuote(q)}>
                        <td className="px-4 py-3 font-medium">{q.customer_name || "—"}</td>
                        <td className="px-4 py-3 text-xs">
                          {q.customer_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{q.customer_email}</div>}
                          {q.customer_phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{q.customer_phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs">{sourceLabel(q.source)}</td>
                        <td className="px-4 py-3">{canalBadge(q)}</td>
                        <td className="px-4 py-3 max-w-xs"><p className="text-xs line-clamp-2">{q.message || "—"}</p></td>
                        <td className="px-4 py-3">{quoteStatusBadge(q.status)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select value={q.status} onChange={e => updateQuoteStatus(q.id, e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1 bg-background">
                            <option value="new">Nueva</option>
                            <option value="in_progress">En proceso</option>
                            <option value="sent">Enviada</option>
                            <option value="closed">Cerrada</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedQuote && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedQuote(null)}>
                <div className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Cotización · {selectedQuote.customer_name || "Sin nombre"}</h3>
                      <p className="text-xs text-muted-foreground">{sourceLabel(selectedQuote.source)} · {new Date(selectedQuote.created_at).toLocaleString("es-CO")}</p>
                    </div>
                    <button onClick={() => setSelectedQuote(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <div><span className="font-semibold">NIT / Cédula:</span> {selectedQuote.nit_cedula || "—"}</div>
                    <div><span className="font-semibold">Email:</span> <a href={`mailto:${selectedQuote.customer_email}`} className="text-primary">{selectedQuote.customer_email || "—"}</a></div>
                    <div><span className="font-semibold">Teléfono:</span> {selectedQuote.customer_phone ? <a href={`https://wa.me/${selectedQuote.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-primary">{selectedQuote.customer_phone}</a> : "—"}</div>
                    <div><span className="font-semibold">Ciudad:</span> {selectedQuote.city || "—"}</div>
                    <div><span className="font-semibold">Estado:</span> {quoteStatusBadge(selectedQuote.status)}</div>
                  </div>

                  <div className="mb-3">
                    <p className="font-semibold text-sm mb-1">Mensaje / Proyecto:</p>
                    <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{selectedQuote.message || "—"}</p>
                  </div>

                  {selectedQuote.details?.budget && (
                    <p className="text-sm mb-2"><span className="font-semibold">Presupuesto:</span> {selectedQuote.details.budget}</p>
                  )}
                  {selectedQuote.details?.notes && (
                    <p className="text-sm mb-2"><span className="font-semibold">Notas:</span> {selectedQuote.details.notes}</p>
                  )}

                  {selectedQuote.details?.transcript && (
                    <details className="mb-3">
                      <summary className="font-semibold text-sm cursor-pointer">Ver conversación con Neti</summary>
                      <pre className="text-xs bg-muted/30 rounded-lg p-3 mt-2 whitespace-pre-wrap max-h-80 overflow-y-auto">{selectedQuote.details.transcript}</pre>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-2 justify-between mt-4 pt-4 border-t">
                    <div className="flex gap-2 flex-wrap">
                      {selectedQuote.customer_email && (
                        <a href={`mailto:${selectedQuote.customer_email}?subject=Cotización Netpower IT`} className="text-xs h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground font-semibold">
                          <Mail className="w-3 h-3" /> Responder por email
                        </a>
                      )}
                      {selectedQuote.customer_phone && (
                        <a href={`https://wa.me/${selectedQuote.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-xs h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-[hsl(145,63%,42%)] text-white font-semibold">
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => deleteQuote(selectedQuote.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* CONVERSACIONES NETI */}
          <TabsContent value="conversaciones">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email o sesión..." value={convSearch} onChange={e => setConvSearch(e.target.value)} className="max-w-md" />
            </div>
            {loadingConvs ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : filteredConvs.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Aún no hay conversaciones con Neti</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                      <th className="px-4 py-3 text-left font-semibold">Mensajes</th>
                      <th className="px-4 py-3 text-left font-semibold">Inicio</th>
                      <th className="px-4 py-3 text-left font-semibold">Última actividad</th>
                      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConvs.map(c => (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedConv(c)}>
                        <td className="px-4 py-3 font-medium">{c.customer_name || <span className="text-muted-foreground italic">Anónimo</span>}</td>
                        <td className="px-4 py-3 text-xs">
                          {c.customer_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.customer_email}</div>}
                          {c.customer_phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{c.customer_phone}</div>}
                          {!c.customer_email && !c.customer_phone && <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">{c.message_count}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString("es-CO")}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedConv(c)}><Eye className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedConv && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedConv(null)}>
                <div className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Conversación · {selectedConv.customer_name || "Anónimo"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedConv.customer_email || "sin email"} · {selectedConv.message_count} mensajes · {new Date(selectedConv.updated_at).toLocaleString("es-CO")}
                      </p>
                    </div>
                    <button onClick={() => setSelectedConv(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {Array.isArray(selectedConv.messages) && selectedConv.messages.map((m: any, i: number) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                          m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          <p className="text-[10px] font-semibold uppercase opacity-70 mb-0.5">{m.role === "user" ? "Cliente" : "Neti"}</p>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <Button size="sm" variant="destructive" onClick={() => deleteConv(selectedConv.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* CLICS A WHATSAPP */}
          <TabsContent value="whatsapp">
            <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4 text-sm">
              <p className="font-semibold mb-1">Qué es esta lista y qué no es</p>
              <p className="text-muted-foreground">
                Cada fila es un <strong>clic</strong> al botón de WhatsApp, no una conversación.
                El sitio no puede saber si la persona llegó a escribir: WhatsApp corre fuera de
                la página y no devuelve nada. Por eso cada clic lleva un código <strong>Ref</strong>
                {" "}que viaja dentro del mensaje ya escrito. Cuando te llegue un chat con ese
                código, buscalo acá y marcá si escribió.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Clics medidos en el sitio", valor: waResumen.delSitio },
                { label: "De pauta (solo medidos)", valor: waResumen.pauta },
                { label: "Confirmados que escribieron", valor: waResumen.escribieron },
                { label: "Cargados a mano", valor: waResumen.manuales },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-extrabold">{k.valor}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código Ref, producto, origen o canal..."
                value={waSearch}
                onChange={e => setWaSearch(e.target.value)}
                className="max-w-md"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={waSoloPauta} onChange={e => setWaSoloPauta(e.target.checked)} />
                Solo los que vienen de pauta
              </label>
              <Button size="sm" variant="outline" onClick={() => setWaForm(f => ({ ...f, abierto: !f.abierto }))}>
                {waForm.abierto ? "Cancelar" : "+ Cargar contacto viejo"}
              </Button>
            </div>

            {waForm.abierto && (
              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <p className="font-semibold mb-1 text-sm">Cargar un contacto que escribió antes del seguimiento</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Queda con canal <strong>Sin dato</strong> y no entra en el conteo de pauta: de estos no se
                  sabe de dónde vinieron, y contarlos como orgánicos o como pauta te falsearía el número.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Fecha en que escribió</label>
                    <Input type="date" value={waForm.fecha} onChange={e => setWaForm(f => ({ ...f, fecha: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Nombre o teléfono <span className="text-destructive">*</span></label>
                    <Input placeholder="Andrés Montoya / 300 123 4567" value={waForm.contacto} onChange={e => setWaForm(f => ({ ...f, contacto: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Producto por el que preguntó (opcional)</label>
                    <Input placeholder="UPS Online SAT UOL3000" value={waForm.producto} onChange={e => setWaForm(f => ({ ...f, producto: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notas (opcional)</label>
                    <Input placeholder="Pidió cotización para 2 equipos" value={waForm.notas} onChange={e => setWaForm(f => ({ ...f, notas: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" onClick={guardarContactoManual} disabled={guardandoWa}>
                    {guardandoWa ? "Guardando..." : "Guardar contacto"}
                  </Button>
                </div>
              </div>
            )}

            {loadingWa ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filteredWa.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {waClicks.length === 0
                  ? "Todavía no se ha registrado ningún clic a WhatsApp."
                  : "Ningún clic coincide con el filtro."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ref</th>
                      <th className="px-4 py-3 text-left font-semibold">Canal</th>
                      <th className="px-4 py-3 text-left font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left font-semibold">Dónde hizo clic</th>
                      <th className="px-4 py-3 text-left font-semibold">Contacto / notas</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">¿Escribió?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWa.map(c => (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {c.ref_code}
                          {esManual(c) && <p className="font-sans text-[10px] font-normal text-muted-foreground">manual</p>}
                        </td>
                        <td className="px-4 py-3">{canalBadge({ details: { canal: c.canal, atribucion: c.atribucion } })}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs line-clamp-2">{c.product_name || "—"}</p>
                          {c.product_sku && <p className="text-[11px] text-muted-foreground">{c.product_sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {esManual(c) ? <span className="italic">cargado a mano</span> : (c.origen || "—")}
                          <p className="text-[11px]">{c.page_path}</p>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs line-clamp-2">{c.notas || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString("es-CO")}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={c.escribio === true ? "si" : c.escribio === false ? "no" : ""}
                            onChange={e => marcarEscribio(c.id, e.target.value === "si" ? true : e.target.value === "no" ? false : null)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background"
                          >
                            <option value="">Sin confirmar</option>
                            <option value="si">Sí escribió</option>
                            <option value="no">No escribió</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </>
  );
}
