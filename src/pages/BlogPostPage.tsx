import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MessageCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import { extraerFaq, conIndice, minutosDeLectura } from "@/lib/blog";

// Formato de articulo tomado de ferova.com.co (src/components/blog/blog-pages.tsx):
// el articulo es una landing. El texto trae el contenido y las preguntas
// frecuentes; la pagina agrega el indice, una llamada a la accion a mitad del
// texto, articulos relacionados y una banda final de contacto. El texto no
// debe repetir esos bloques.

interface Blog {
  id: number; slug: string; h1: string;
  keyword_principal: string; industria: string;
  frase_inicial: string; resumen_intro: string;
  contenido_html: string; cierre_html: string;
  meta_title: string; meta_description: string;
  imagen_portada: string | null; imagen_alt: string | null;
  autor: string; fecha_publicacion: string | null; updated_at: string;
}

type Resumen = Pick<Blog, "slug" | "h1" | "resumen_intro" | "industria" | "imagen_portada" | "imagen_alt">;

const WHATSAPP = "https://wa.me/573504609431";
const CUERPO =
  "text-base leading-relaxed text-foreground/90 " +
  "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground " +
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground " +
  "[&_p]:mb-5 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 " +
  "[&_strong]:text-foreground [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline " +
  "[&_table]:my-6 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-bold " +
  "[&_td]:border-b [&_td]:border-border [&_td]:p-3 [&_td]:align-top";

/** Corta el cuerpo antes del tercer H2 (o del segundo si hay pocos) para
 *  meter la llamada a la accion a mitad del texto, como en Ferova. */
function partirParaCta(html: string): [string, string] | null {
  const inicios = [...html.matchAll(/<h2[\s>]/gi)].map((m) => m.index ?? 0);
  if (inicios.length < 3) return null;
  const en = inicios.length >= 4 ? inicios[2] : inicios[1];
  return [html.slice(0, en), html.slice(en)];
}

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relacionados, setRelacionados] = useState<Resumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (supabase.from("blogs" as any) as any)
      .select("*").eq("slug", slug).eq("publicado", true).maybeSingle()
      .then(({ data }: any) => { setBlog(data as Blog | null); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (!blog) return;
    (supabase.from("blogs" as any) as any)
      .select("slug,h1,resumen_intro,industria,imagen_portada,imagen_alt")
      .eq("publicado", true).neq("slug", blog.slug)
      .order("fecha_publicacion", { ascending: false }).limit(12)
      .then(({ data }: any) => {
        const lista = (data ?? []) as Resumen[];
        // Primero los de la misma industria, luego el resto.
        lista.sort((a, b) => Number(b.industria === blog.industria) - Number(a.industria === blog.industria));
        setRelacionados(lista.slice(0, 3));
      });
  }, [blog]);

  const cuerpo = useMemo(() => {
    if (!blog) return null;
    const { html, indice } = conIndice(sanitizeHtml(`${blog.contenido_html}${blog.cierre_html}`));
    return { html, indice, partes: partirParaCta(html), faqs: extraerFaq(html) };
  }, [blog]);

  if (loading) return <div className="container mx-auto px-4 py-20"><div className="animate-pulse h-96 bg-muted rounded-xl" /></div>;
  if (!blog || !cuerpo) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Helmet>
        <title>Artículo no encontrado | Netpower IT</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="text-2xl font-bold mb-4">Artículo no encontrado</h1>
      <Link to="/blog" className="text-primary underline">Ver todos los artículos</Link>
    </div>
  );

  const url = `https://netpowerit.co/blog/${blog.slug}`;
  const desc = blog.meta_description || blog.resumen_intro;
  const img = blog.imagen_portada || "https://netpowerit.co/og-image.jpg";
  const minutos = minutosDeLectura(`${blog.frase_inicial} ${blog.resumen_intro} ${cuerpo.html}`);

  const ctaMitad = (
    <aside aria-label="Asesoría" className="my-10 rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <p className="text-lg font-extrabold">¿Quieres que te ayudemos a elegir?</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Cuéntanos qué equipos tienes o qué proyecto estás armando y te recomendamos la referencia exacta, con precio y disponibilidad.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={`${WHATSAPP}?text=${encodeURIComponent(`Hola, leí "${blog.h1}" y quiero asesoría`)}`} target="_blank" rel="noopener noreferrer" data-wa-origen={`blog_${blog.slug}_mitad`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-success px-5 text-sm font-bold text-success-foreground hover:opacity-90">
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
        </a>
        <Link to="/cotizacion" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-bold hover:bg-muted">
          <FileText className="h-4 w-4" /> Pedir cotización
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      <Helmet>
        <title>{blog.meta_title || blog.h1}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={blog.meta_title || blog.h1} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={img} />
        <meta name="twitter:title" content={blog.meta_title || blog.h1} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={img} />
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#post`,
          headline: blog.h1,
          description: desc,
          image: img,
          url,
          datePublished: blog.fecha_publicacion || undefined,
          dateModified: blog.updated_at || undefined,
          author: { "@type": "Organization", name: blog.autor || "Netpower IT" },
          publisher: { "@type": "Organization", name: "Netpower IT", "@id": "https://netpowerit.co/#organization" },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          keywords: blog.keyword_principal,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: "https://netpowerit.co" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://netpowerit.co/blog" },
            { "@type": "ListItem", position: 3, name: blog.h1, item: url },
          ],
        })}</script>
        {cuerpo.faqs.length > 0 && <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: cuerpo.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        })}</script>}
      </Helmet>

      {/* Encabezado */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <nav aria-label="Ruta" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Inicio</Link><span aria-hidden="true">/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link><span aria-hidden="true">/</span>
            <span className="truncate text-foreground">{blog.h1}</span>
          </nav>
          {blog.industria && <p className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{blog.industria}</p>}
          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight md:text-5xl">{blog.h1}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{blog.resumen_intro}</p>
          <p className="mt-5 text-sm text-muted-foreground">
            {[blog.autor || "Equipo Netpower IT", blog.fecha_publicacion ? fecha(blog.fecha_publicacion) : null, `${minutos} min de lectura`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            {blog.imagen_portada && (
              <img src={blog.imagen_portada} alt={blog.imagen_alt || blog.h1} width={1600} height={900}
                className="mb-10 aspect-video w-full rounded-2xl object-cover" />
            )}
            <article>
              <p className="mb-6 text-xl font-semibold leading-relaxed text-foreground">{blog.frase_inicial}</p>
              {cuerpo.partes ? <>
                <div className={CUERPO} dangerouslySetInnerHTML={{ __html: cuerpo.partes[0] }} />
                {ctaMitad}
                <div className={CUERPO} dangerouslySetInnerHTML={{ __html: cuerpo.partes[1] }} />
              </> : <div className={CUERPO} dangerouslySetInnerHTML={{ __html: cuerpo.html }} />}
            </article>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {cuerpo.indice.length > 1 && (
              <nav aria-label="En este artículo" className="hidden rounded-2xl bg-muted/60 p-6 lg:block">
                <p className="font-extrabold">En este artículo</p>
                <ol className="mt-4 space-y-3 text-sm leading-snug">
                  {cuerpo.indice.map((item) => (
                    <li key={item.id}><a href={`#${item.id}`} className="text-muted-foreground hover:text-primary">{item.label}</a></li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="rounded-2xl bg-muted/60 p-6">
              <p className="font-extrabold">Asesoría sin costo</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Te ayudamos a elegir la capacidad y la referencia correctas antes de comprar.</p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-wa-origen={`blog_${blog.slug}_lateral`}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-success px-5 text-sm font-bold text-success-foreground hover:opacity-90">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="border-t border-border bg-muted/40">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-extrabold">Artículos relacionados</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((r) => (
                <li key={r.slug}>
                  <Link to={`/blog/${r.slug}`} className="block h-full rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-card-hover">
                    {r.industria && <p className="text-xs font-bold uppercase tracking-wide text-primary">{r.industria}</p>}
                    <p className="mt-2 font-extrabold leading-snug">{r.h1}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.resumen_intro}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl bg-foreground p-8 text-background md:p-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">¿Listo para elegir tu equipo?</h2>
          <p className="mt-3 max-w-xl opacity-80">Escríbenos con lo que necesitas proteger o instalar y te enviamos una propuesta con precio, garantía y envío a toda Colombia.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-wa-origen={`blog_${blog.slug}_cierre`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-success px-5 text-sm font-bold text-success-foreground hover:opacity-90">
              <MessageCircle className="h-4 w-4" /> Hablar con un asesor
            </a>
            <Link to="/tienda" className="inline-flex h-11 items-center rounded-full border border-background/30 px-5 text-sm font-bold hover:bg-background/10">Ver la tienda</Link>
          </div>
        </div>
      </section>
    </>
  );
}
