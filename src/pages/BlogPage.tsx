import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

interface Blog {
  id: number; slug: string; h1: string; resumen_intro: string;
  imagen_portada: string | null; imagen_alt: string | null;
  industria: string; fecha_publicacion: string | null; autor: string;
}

const FALLBACK = "/placeholder.svg";

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from("blogs" as any) as any)
      .select("*").eq("publicado", true)
      .order("fecha_publicacion", { ascending: false })
      .then(({ data }: any) => { setBlogs((data as Blog[]) || []); setLoading(false); });
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog — Netpower IT</title>
        <meta name="description" content="Guías, comparativas y tendencias en infraestructura TI, UPS, servidores y energía empresarial." />
        <link rel="canonical" href="https://netpowerit.co/blog" />
        <meta property="og:title" content="Blog Netpower IT — Infraestructura TI empresarial" />
        <meta property="og:description" content="Guías técnicas y comparativas sobre UPS, servidores, redes y energía empresarial en Colombia." />
        <meta property="og:url" content="https://netpowerit.co/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span>/</span><span className="text-foreground font-medium">Blog</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-10">Guías y tendencias en infraestructura TI empresarial</p>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-80 rounded-xl" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">Aún no hay artículos publicados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b) => (
              <Link key={b.id} to={`/blog/${b.slug}`}
                className="group rounded-xl border border-border bg-card hover:shadow-card-hover transition-all overflow-hidden">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={b.imagen_portada || FALLBACK} alt={b.imagen_alt || b.h1}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }} />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">{b.industria}</p>
                  <h2 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition">{b.h1}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">{b.resumen_intro}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {b.autor} · {b.fecha_publicacion ? new Date(b.fecha_publicacion).toLocaleDateString("es-CO") : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
