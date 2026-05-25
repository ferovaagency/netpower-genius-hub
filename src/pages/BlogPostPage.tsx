import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";

interface Blog {
  id: number; slug: string; h1: string;
  keyword_principal: string; industria: string;
  frase_inicial: string; resumen_intro: string;
  contenido_html: string; cierre_html: string;
  meta_title: string; meta_description: string;
  imagen_portada: string | null; imagen_alt: string | null;
  autor: string; fecha_publicacion: string | null;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (supabase.from("blogs" as any) as any)
      .select("*").eq("slug", slug).eq("publicado", true).maybeSingle()
      .then(({ data }: any) => { setBlog(data as Blog | null); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="container mx-auto px-4 py-20"><div className="animate-pulse h-96 bg-muted rounded-xl" /></div>;
  if (!blog) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Artículo no encontrado</h1>
      <Link to="/blog" className="text-primary underline">Ver todos los artículos</Link>
    </div>
  );

  const desc = blog.meta_description || blog.resumen_intro;
  const img = blog.imagen_portada || "https://netpowerit.co/og-image.jpg";

  return (
    <>
      <Helmet>
        <title>{blog.meta_title || blog.h1}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={blog.meta_title || blog.h1} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://netpowerit.co/blog/${blog.slug}`} />
        <meta property="og:image" content={img} />
        <meta name="twitter:title" content={blog.meta_title || blog.h1} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={img} />
        <link rel="canonical" href={`https://netpowerit.co/blog/${blog.slug}`} />
      </Helmet>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">← Blog</Link>

        {blog.imagen_portada && (
          <div className="aspect-video rounded-xl overflow-hidden my-6">
            <img src={blog.imagen_portada} alt={blog.imagen_alt || blog.h1}
              className="w-full h-full object-cover" />
          </div>
        )}

        <article className="prose prose-lg max-w-none">
          <h1>{blog.h1}</h1>
          <p className="text-xl font-semibold leading-relaxed">{blog.frase_inicial}</p>
          <p className="text-lg leading-relaxed">{blog.resumen_intro}</p>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.contenido_html) }} />
          <hr className="my-8" />
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.cierre_html) }} />
        </article>

        <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          Por {blog.autor}
          {blog.fecha_publicacion && ` · ${new Date(blog.fecha_publicacion).toLocaleDateString("es-CO")}`}
        </footer>

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: blog.h1,
            author: { "@type": "Organization", name: blog.autor },
            datePublished: blog.fecha_publicacion,
            image: blog.imagen_portada,
            publisher: { "@type": "Organization", name: "Netpower IT" },
            description: blog.meta_description,
            keywords: blog.keyword_principal,
          }),
        }} />
      </main>
    </>
  );
}
