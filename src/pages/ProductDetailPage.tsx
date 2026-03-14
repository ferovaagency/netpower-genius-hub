import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { ShoppingCart, Minus, Plus, MessageCircle, FileText, Truck, ShieldCheck, Phone, Wrench, Globe } from "lucide-react";
import { products, categories, brands, formatCOP, getDiscountPercentage, findProductBySlug } from "@/data/store-data";
import { useCart } from "@/contexts/CartContext";
import { useChat } from "@/contexts/ChatContext";
import ProductCard from "@/components/store/ProductCard";

const WHATSAPP_NUMBER = "573018417895";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = findProductBySlug(slug || "");
  const { addItem } = useCart();
  const { openChat } = useChat();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "warranty" | "shipping">("desc");

  if (!product) {
    const waMessage = encodeURIComponent(`Hola NetPower IT, estoy buscando el producto "${slug}" pero no lo encuentro en la tienda. ¿Está disponible?`);
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-2">Producto no encontrado</h1>
        <p className="text-sm text-muted-foreground mb-6">¿Buscas un producto que no aparece? Pregúntanos si está disponible.</p>
        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/573018417895?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 rounded-lg bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            Preguntar por WhatsApp
          </a>
          <Link to="/tienda" className="text-primary hover:underline text-sm">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const brand = brands.find(b => b.id === product.brandId);
  const discount = getDiscountPercentage(product.price, product.salePrice);
  const related = products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const isServer = category?.slug === "servidores";

  const tabs = [
    { key: "desc", label: "Descripción" },
    { key: "specs", label: "Especificaciones" },
    { key: "warranty", label: "Garantía" },
    { key: "shipping", label: "Envío" },
  ] as const;

  const waMessage = encodeURIComponent(`Hola Netpower IT, consulto disponibilidad y precio: ${product.name} (${product.sku})`);

  return (
    <>
      <Helmet>
        <title>{product.metaTitle}</title>
        <meta name="description" content={product.metaDesc} />
        <link rel="canonical" href={`https://netpowerit.co/producto/${product.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.sku,
          brand: { "@type": "Brand", name: brand?.name },
          offers: isServer ? undefined : {
            "@type": "Offer",
            price: (product.salePrice || product.price),
            priceCurrency: "COP",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        })}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <Link to="/tienda" className="hover:text-primary transition">Tienda</Link>
          <span>/</span>
          {category && <>
            <Link to={`/tienda?categoria=${category.slug}`} className="hover:text-primary transition">{category.name}</Link>
            <span>/</span>
          </>}
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        {/* Server banner */}
        {isServer && (
          <div className="mb-6 p-4 rounded-lg bg-accent border border-primary/20 text-sm text-accent-foreground">
            Los servidores tienen precio diferenciado según configuración y volumen. Escríbenos y te asesoramos.
          </div>
        )}

        {/* Product */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-8 flex items-center justify-center aspect-square relative overflow-hidden">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-8xl">{category?.icon || "📦"}</span>
            )}
            {!isServer && discount && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                -{discount}%
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2 mb-3">
              {brand && <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">{brand.name}</span>}
              {category && <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{category.name}</span>}
              <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-6">{product.shortDesc}</p>

            {isServer ? (
              /* Server: No price, WhatsApp CTA */
              <>
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary font-semibold mb-6 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Precio a consultar — Cotiza con nuestros expertos
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-lg bg-success text-success-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition mb-3"
                >
                  <Phone className="w-5 h-5" /> Cotizar por WhatsApp
                </a>

                <button
                   onClick={() => openChat("quote")}
                   className="w-full h-12 rounded-lg border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition mb-6"
                 >
                   <FileText className="w-5 h-5" /> Solicitar cotización formal
                 </button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Precios especiales para volumen</p>
                  <p className="flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Asesoría técnica incluida</p>
                  <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Garantía oficial del fabricante</p>
                  <p className="flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Instalación y configuración disponible</p>
                  <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Servicio en toda Colombia e internacional</p>
                </div>
              </>
            ) : (
              /* Normal product */
              <>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-extrabold text-foreground">{formatCOP(product.salePrice || product.price)}</span>
                  {product.salePrice && (
                    <span className="text-lg text-muted-foreground line-through">{formatCOP(product.price)}</span>
                  )}
                </div>
                <p className={`text-sm font-medium mb-6 ${product.stock > 5 ? "text-success" : product.stock > 0 ? "text-secondary" : "text-destructive"}`}>
                  {product.stock > 5 ? "✓ En stock" : product.stock > 0 ? `⚠ Solo ${product.stock} disponibles` : "✕ Agotado"}
                </p>

                {product.stock > 0 ? (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted transition">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold border-x border-border">{qty}</span>
                      <button
                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-muted transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => addItem(product, qty)}
                      className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" /> Agregar al carrito
                    </button>
                  </div>
                ) : (
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-lg bg-success text-success-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition mb-4"
                  >
                    <MessageCircle className="w-5 h-5" /> Preguntar disponibilidad por WhatsApp
                  </a>
                )}

                <div className="flex flex-wrap gap-3 mb-8">
                  <button onClick={() => openChat("quote")} className="flex-1 h-10 rounded-lg border-2 border-primary text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition">
                    <FileText className="w-4 h-4" /> Solicitar cotización
                  </button>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 rounded-lg border border-border text-sm font-medium flex items-center gap-2 hover:bg-accent transition"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Truck, text: "Envío a todo Colombia" },
                    { icon: ShieldCheck, text: "Garantía oficial" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-accent text-xs font-medium text-accent-foreground">
                      <t.icon className="w-4 h-4 text-primary" /> {t.text}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-border overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === "desc" && (
              <div
                className="prose prose-sm max-w-3xl text-muted-foreground
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2
                  [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-4 [&_h4]:mb-1.5
                  [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-3
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                  [&_li]:text-base [&_li]:mb-1
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-accent/30 [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-lg
                  [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            {activeTab === "specs" && (
              <div className="max-w-2xl">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex border-b border-border py-3 text-sm">
                    <span className="w-1/3 font-medium text-foreground">{k}</span>
                    <span className="w-2/3 text-muted-foreground">{v}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "warranty" && (
              <div className="text-muted-foreground max-w-3xl space-y-2 text-sm">
                <p>Todos nuestros productos cuentan con garantía oficial del fabricante.</p>
                <p>La garantía cubre defectos de fabricación y es gestionada directamente con el centro de servicio autorizado de la marca.</p>
                <p>Para hacer efectiva la garantía, es necesario presentar la factura de compra.</p>
              </div>
            )}
            {activeTab === "shipping" && (
              <div className="text-muted-foreground max-w-3xl space-y-2 text-sm">
                <p>Realizamos envíos a todo Colombia a través de transportadoras certificadas.</p>
                <p>Tiempos de entrega: Ciudades principales 1-3 días hábiles. Otras ciudades 3-7 días hábiles.</p>
                <p>Los costos de envío se calculan al momento del checkout según la dirección de destino.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-extrabold text-foreground mb-6">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
