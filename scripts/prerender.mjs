/**
 * Prerender estático de las rutas públicas.
 *
 * Se ejecuta después de `vite build`. Toma dist/index.html como plantilla y
 * escribe un HTML por ruta con su <title>, meta description, canonical, Open
 * Graph, JSON-LD y un bloque de contenido dentro de #root.
 *
 * Por qué: la SPA sirve el mismo HTML para las 891 URLs del sitemap. Un
 * rastreador que no ejecuta JavaScript (la mayoría de los de IA, y Google en su
 * primera pasada) ve siempre el mismo título y el mismo canonical hacia la home.
 *
 * React monta con createRoot().render(), que reemplaza el contenido de #root al
 * hidratar. El bloque estático es únicamente para rastreadores: el usuario ve
 * la SPA normal en cuanto carga el bundle.
 *
 * Si Supabase no responde, el script NO rompe el build: emite las rutas
 * estáticas, avisa por consola y termina con código 0.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const DOMAIN = "https://netpowerit.co";
const OG_IMAGE_DEFAULT = `${DOMAIN}/favicon.png`;
const MARK_START = "<!--prerender:start-->";
const MARK_END = "<!--prerender:end-->";

/** Deja la plantilla como recién salida de vite: sin JSON-LD inyectado ni #root lleno. */
function normalizeTemplate(html) {
  return html
    .replace(new RegExp(`\\s*${MARK_START}[\\s\\S]*?${MARK_END}`, "g"), "");
}

/**
 * Vite lee el .env por su cuenta, pero este script es Node puro y no lo ve.
 * En Vercel las variables llegan por process.env; en local y cuando no están
 * configuradas en el panel, se leen del .env del repo. Lo que ya venga en el
 * entorno siempre manda sobre el archivo.
 */
function cargarEnvLocal() {
  const archivo = path.join(ROOT, ".env");
  if (!existsSync(archivo)) return;
  for (const linea of readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || linea.trimStart().startsWith("#")) continue;
    const [, clave, bruto] = m;
    if (process.env[clave]) continue;
    process.env[clave] = bruto.replace(/^["']|["']$/g, "");
  }
}

const env = (clave) => process.env[clave];

// ─── utilidades ──────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripTags = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clamp = (s, n) => {
  const t = stripTags(s);
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
};

/** JSON-LD embebido: `<` y `&` escapados para no cerrar el <script>. */
const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/&/g, "\\u0026")}</script>`;

// ─── transformación del <head> ───────────────────────────────────────────────

function applyHead(html, { title, description, canonical, ogType, ogImage, schemas }) {
  let out = html;
  const t = esc(title);
  const d = esc(description);
  const url = esc(canonical);
  const img = esc(ogImage || OG_IMAGE_DEFAULT);

  const replaceAll = (re, value) => {
    out = out.replace(re, value);
  };

  replaceAll(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);
  replaceAll(/<meta\s+name="description"[^>]*>/gi, `<meta name="description" content="${d}">`);
  replaceAll(/<meta\s+property="og:title"[^>]*>/gi, `<meta property="og:title" content="${t}">`);
  replaceAll(/<meta\s+name="twitter:title"[^>]*>/gi, `<meta name="twitter:title" content="${t}">`);
  replaceAll(/<meta\s+property="og:description"[^>]*>/gi, `<meta property="og:description" content="${d}">`);
  replaceAll(/<meta\s+name="twitter:description"[^>]*>/gi, `<meta name="twitter:description" content="${d}">`);
  replaceAll(/<meta\s+property="og:url"[^>]*>/gi, `<meta property="og:url" content="${url}">`);
  replaceAll(/<meta\s+property="og:type"[^>]*>/gi, `<meta property="og:type" content="${esc(ogType || "website")}">`);
  replaceAll(/<meta\s+property="og:image"[^>]*>/gi, `<meta property="og:image" content="${img}">`);
  replaceAll(/<meta\s+name="twitter:image"[^>]*>/gi, `<meta name="twitter:image" content="${img}">`);
  replaceAll(/<link\s+rel="canonical"[^>]*>/gi, `<link rel="canonical" href="${url}">`);
  replaceAll(/<link\s+rel="alternate"\s+hreflang="es-co"[^>]*>/gi, `<link rel="alternate" hreflang="es-co" href="${url}">`);

  if (schemas?.length) {
    out = out.replace(
      "</head>",
      `${MARK_START}\n${schemas.map(jsonLd).join("\n")}\n${MARK_END}\n</head>`,
    );
  }
  return out;
}

/** Reemplaza el <div id="root"></div> vacío por el bloque estático. */
function applyBody(html, inner) {
  if (!inner) return html;
  return html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${MARK_START}${inner}${MARK_END}</div>`,
  );
}

// ─── datos estáticos leídos de src/data/store-data.ts ────────────────────────
// Se parsea el archivo real para que no haya dos fuentes de verdad.

async function readStoreData() {
  const src = await readFile(path.join(ROOT, "src/data/store-data.ts"), "utf8");

  const parseBlock = (name) => {
    const start = src.indexOf(`export const ${name}`);
    if (start === -1) return [];
    const open = src.indexOf("[", start);
    const close = src.indexOf("\n];", open);
    const block = src.slice(open, close === -1 ? undefined : close);
    const field = (line, key) => {
      const m = line.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      return m ? m[1] : "";
    };
    return block
      .split("\n")
      .filter((l) => l.includes("id:") && l.includes("slug:"))
      .map((l) => ({
        id: field(l, "id"),
        slug: field(l, "slug"),
        name: field(l, "name"),
        description: field(l, "description"),
      }));
  };

  return { categories: parseBlock("categories"), brands: parseBlock("brands") };
}

// ─── productos desde Supabase ────────────────────────────────────────────────

const PRODUCT_COLUMNS = [
  "slug", "name", "description", "short_description", "price", "sale_price",
  "sku", "stock", "images", "category", "brand", "meta_title", "meta_description",
].join(",");

const BLOG_COLUMNS = [
  "slug", "h1", "meta_title", "meta_description", "resumen_intro",
  "imagen_portada", "imagen_alt", "autor", "fecha_publicacion",
].join(",");

/** Lee una tabla completa por páginas de 1000 filas. */
async function fetchTable(query) {
  const SUPABASE_URL = env("VITE_SUPABASE_URL");
  const SUPABASE_KEY = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY");
  }
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + PAGE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

const fetchProducts = () =>
  fetchTable(`products?select=${PRODUCT_COLUMNS}&active=eq.true&order=slug.asc`);

const fetchBlogs = () =>
  fetchTable(`blogs?select=${BLOG_COLUMNS}&publicado=eq.true&order=slug.asc`);

// ─── bloques estáticos de contenido ──────────────────────────────────────────

/**
 * Traduce el stock a schema.org. Los tres casos son distintos y no se mezclan:
 *   > 0    hay unidades              -> InStock
 *   = 0    agotado de verdad         -> OutOfStock
 *   null   se vende bajo cotizacion  -> BackOrder (se consigue por encargo)
 */
function disponibilidad(stock) {
  if (stock === null || stock === undefined) return "https://schema.org/BackOrder";
  return Number(stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

function productBody(p, cat, brandName) {
  const price = Number(p.sale_price ?? p.price ?? 0);
  const desc = stripTags(p.description || p.short_description || "");
  return [
    `<nav aria-label="Ruta"><a href="/">Inicio</a> / <a href="/tienda">Tienda</a>`,
    cat ? ` / <a href="/categoria/${esc(cat.slug)}">${esc(cat.name)}</a>` : "",
    ` / <span>${esc(p.name)}</span></nav>`,
    `<main><h1>${esc(p.name)}</h1>`,
    brandName ? `<p>Marca: ${esc(brandName)}</p>` : "",
    p.sku ? `<p>SKU: ${esc(p.sku)}</p>` : "",
    price > 0 ? `<p>Precio: $${price.toLocaleString("es-CO")} COP</p>` : `<p>Precio bajo cotización</p>`,
    price > 0
      ? `<p>Disponibilidad: ${
          p.stock === null || p.stock === undefined
            ? "bajo pedido, consúltanos"
            : Number(p.stock) > 0
              ? "disponible"
              : "agotado"
        }</p>`
      : `<p>Disponibilidad: bajo pedido, escríbenos para cotizar</p>`,
    desc ? `<div>${esc(desc)}</div>` : "",
    p.images?.[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" width="600" height="600">` : "",
    `<p><a href="/cotizacion">Solicitar cotización</a></p></main>`,
  ].join("");
}

function blogBody(post) {
  return [
    `<nav aria-label="Ruta"><a href="/">Inicio</a> / <a href="/blog">Blog</a> / <span>${esc(post.h1)}</span></nav>`,
    `<main><article><h1>${esc(post.h1)}</h1>`,
    post.autor ? `<p>Por ${esc(post.autor)}</p>` : "",
    post.fecha_publicacion ? `<p><time datetime="${esc(post.fecha_publicacion)}">${esc(String(post.fecha_publicacion).slice(0, 10))}</time></p>` : "",
    post.imagen_portada ? `<img src="${esc(post.imagen_portada)}" alt="${esc(post.imagen_alt || post.h1)}" width="1200" height="630">` : "",
    post.resumen_intro ? `<p>${esc(stripTags(post.resumen_intro))}</p>` : "",
    `</article></main>`,
  ].join("");
}

function listBody(heading, description, products) {
  const items = products
    .slice(0, 60)
    .map((p) => `<li><a href="/producto/${esc(p.slug)}">${esc(p.name)}</a></li>`)
    .join("");
  return `<main><h1>${esc(heading)}</h1><p>${esc(description)}</p><ul>${items}</ul></main>`;
}

// ─── escritura ───────────────────────────────────────────────────────────────

async function emit(route, html) {
  const dir = route === "/" ? DIST : path.join(DIST, route.replace(/^\//, ""));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");
}

// ─── main ────────────────────────────────────────────────────────────────────

/**
 * Preload de la imagen LCP de la home.
 *
 * El slider marca la primera diapositiva con fetchpriority="high", pero eso
 * solo ordena la cola una vez que el navegador YA descubrio la imagen, y aqui
 * la descubre tarde: el `src` vive dentro del bundle, asi que hay que bajar y
 * ejecutar 729 KB de JavaScript antes de que exista la peticion de la imagen.
 * Medido en produccion el 10 sep: LCP movil 6,4 s con FCP 4,7 s.
 *
 * Declarando el preload en el HTML servido, el escaner de precarga la pide en
 * el primer parseo, en paralelo con el JS, no despues.
 *
 * El nombre lleva hash de contenido y cambia en cada build, asi que se busca en
 * dist/assets en vez de escribirlo a mano. Si no aparece, no se emite nada y el
 * build sigue: es una optimizacion, no un requisito.
 */
function preloadHero() {
  try {
    const dir = path.join(DIST, "assets");
    if (!existsSync(dir)) return "";
    const hero = readdirSync(dir).find((f) => /^banner-tienda-.*\.jpg$/.test(f));
    if (!hero) {
      console.warn("[prerender] no se encontro banner-tienda-*.jpg en dist/assets; sin preload de LCP");
      return "";
    }
    return `<link rel="preload" as="image" href="/assets/${hero}" fetchpriority="high">`;
  } catch {
    return "";
  }
}

const STATIC_ROUTES = [
  {
    route: "/",
    title: "Netpower IT – UPS, Servidores y Soluciones TIC en Colombia",
    description:
      "Compra UPS, baterías, servidores HPE, infraestructura de red y energía solar con garantía oficial. Envío a toda Colombia y pago seguro con Wompi, PSE y tarjetas.",
    h1: "Explora nuestra tienda online de tecnología",
  },
  {
    route: "/cotizacion",
    title: "Cotizaciones – Proyectos TIC a la Medida | Netpower IT",
    description:
      "Cotiza tu proyecto de tecnología TIC con asesoría experta. UPS, infraestructura de red, energía solar, servidores y licencias.",
    h1: "Solicita tu cotización",
  },
  {
    route: "/contacto",
    title: "Contacto | Netpower IT — Tecnología TIC en Bogotá Colombia",
    description:
      "Contáctenos para cotizar computadores, servidores y equipos de red para su empresa en Colombia. Asesoría especializada TIC.",
    h1: "Contacto",
  },
  {
    route: "/marcas",
    title: "Marcas – Distribuidores Autorizados | Netpower IT",
    description:
      "Somos distribuidores autorizados de APC, HP, Samsung, Logitech, Dahua, Hikvision y más. Productos con garantía oficial en Colombia.",
    h1: "Marcas que distribuimos",
  },
  {
    route: "/nosotros",
    title: "Quiénes Somos – Netpower IT Colombia",
    description:
      "Netpower IT es tu proveedor de confianza en tecnología TIC en Colombia. Distribuidores autorizados con garantía oficial y soporte técnico.",
    h1: "Quiénes somos",
  },
  {
    route: "/blog",
    title: "Blog — Netpower IT",
    description:
      "Guías, comparativas y tendencias en infraestructura TI, UPS, servidores y energía empresarial.",
    h1: "Blog",
  },
  {
    route: "/legal",
    title: "Información Legal | Netpower IT",
    description:
      "Términos y condiciones, política de tratamiento de datos y política de cookies de Netpower IT.",
    h1: "Información legal",
  },
  {
    route: "/politica-datos",
    title: "Política de Tratamiento de Datos Personales | Netpower IT SAS",
    description:
      "Política de Tratamiento de Datos Personales de Netpower IT SAS conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
    h1: "Política de tratamiento de datos personales",
  },
];

async function main() {
  cargarEnvLocal();
  if (!existsSync(path.join(DIST, "index.html"))) {
    console.error("[prerender] no existe dist/index.html. Corre `vite build` antes.");
    process.exit(1);
  }
  const template = normalizeTemplate(await readFile(path.join(DIST, "index.html"), "utf8"));
  const { categories, brands } = await readStoreData();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  let written = 0;

  // 0. Página 404 estática. Vercel la sirve con estado 404 real cuando ninguna
  //    ruta la reclama, siempre que vercel.json deje de reescribirlo todo a
  //    index.html. Se emite igual aunque esa configuración aún no esté puesta:
  //    un archivo de más no molesta a nadie.
  {
    const html404 = applyBody(
      applyHead(template, {
        title: "Página no encontrada (404) | Netpower IT",
        description:
          "La página que buscas no existe o cambió de dirección. Explora la tienda o escríbenos por WhatsApp.",
        canonical: `${DOMAIN}/404`,
      }).replace(
        "</head>",
        '<meta name="robots" content="noindex, follow">\n</head>',
      ),
      `<main><h1>Página no encontrada</h1>` +
        `<p>La dirección que abriste no existe o cambió.</p>` +
        `<ul>` +
        `<li><a href="/">Ir al inicio</a></li>` +
        `<li><a href="/tienda">Ver la tienda</a></li>` +
        `<li><a href="/cotizacion">Solicitar una cotización</a></li>` +
        `</ul></main>`,
    );
    await writeFile(path.join(DIST, "404.html"), html404, "utf8");
    written++;
  }

  // 1. Rutas estáticas
  const heroPreload = preloadHero();
  for (const s of STATIC_ROUTES) {
    const canonical = s.route === "/" ? DOMAIN : `${DOMAIN}${s.route}`;
    const body = `<main><h1>${esc(s.h1)}</h1><p>${esc(s.description)}</p></main>`;
    let head = applyHead(template, {
      title: s.title, description: s.description, canonical,
    });
    // Solo la home: es la unica ruta cuyo LCP es el slider.
    if (s.route === "/" && heroPreload) {
      head = head.replace("</head>", `${MARK_START}${heroPreload}${MARK_END}\n</head>`);
    }
    await emit(s.route, applyBody(head, body));
    written++;
  }

  // 2. Productos y categorías
  let products = [];
  let posts = [];
  try {
    [products, posts] = await Promise.all([
      fetchProducts(),
      fetchBlogs().catch((err) => {
        console.warn(`[prerender] no se pudieron leer los articulos del blog (${err.message}); se omiten.`);
        return [];
      }),
    ]);
  } catch (err) {
    console.warn(`[prerender] no se pudieron leer los productos (${err.message}).`);
    console.warn("[prerender] se emitieron solo las rutas estáticas; el build continúa.");
    console.log(`[prerender] ${written} rutas escritas.`);
    return;
  }

  const tiendaTitle = "Tienda TIC | Computadores, Servidores, Redes — Netpower IT";
  const tiendaDesc =
    "Compra computadores, servidores, equipos de red e impresoras para empresas en Colombia. Netpower IT, tu proveedor TIC en Bogotá.";

  await emit("/tienda", applyBody(applyHead(template, {
    title: tiendaTitle,
    description: tiendaDesc,
    canonical: `${DOMAIN}/tienda`,
    schemas: [{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${DOMAIN}/tienda#page`,
      name: tiendaTitle,
      description: tiendaDesc,
      url: `${DOMAIN}/tienda`,
      isPartOf: { "@id": `${DOMAIN}/#website` },
    }],
  }), listBody("Tienda", tiendaDesc, products)));
  written++;

  for (const c of categories) {
    const inCat = products.filter((p) => String(p.category) === c.id);
    const url = `${DOMAIN}/categoria/${c.slug}`;
    const title = `${c.name} | Netpower IT`;
    const description = `${c.description}. Compra ${c.name} para empresas en Colombia con Netpower IT.`;
    await emit(`/categoria/${c.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url,
      schemas: [{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: title,
        description,
        url,
        isPartOf: { "@id": `${DOMAIN}/#website` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
            { "@type": "ListItem", position: 2, name: "Tienda", item: `${DOMAIN}/tienda` },
            { "@type": "ListItem", position: 3, name: c.name, item: url },
          ],
        },
      }],
    }), listBody(c.name, description, inCat)));
    written++;
  }

  for (const p of products) {
    if (!p.slug) continue;
    const url = `${DOMAIN}/producto/${p.slug}`;
    const cat = catById.get(String(p.category));
    const brand = brandById.get(String(p.brand));
    const title = p.meta_title || `${p.name} | Netpower IT`;
    const description = clamp(
      p.meta_description || p.short_description || p.description || p.name,
      160,
    );
    const price = Number(p.sale_price ?? p.price ?? 0);
    const image = p.images?.[0] || OG_IMAGE_DEFAULT;

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: p.name,
      description: stripTags(p.description || p.short_description || p.name),
      sku: p.sku || undefined,
      brand: { "@type": "Brand", name: brand?.name || "Netpower IT" },
      image,
      // Precio 0 significa "bajo cotización": no se declara Offer. Publicar
      // price: "0" haría que Google lo lea como producto gratis y es motivo
      // de rechazo en Merchant.
      ...(price > 0
        ? {
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "COP",
              price: String(price),
              availability: disponibilidad(p.stock),
              seller: { "@type": "Organization", "@id": `${DOMAIN}/#organization`, name: "Netpower IT" },
            },
          }
        : {}),
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
        { "@type": "ListItem", position: 2, name: "Tienda", item: `${DOMAIN}/tienda` },
        ...(cat ? [{ "@type": "ListItem", position: 3, name: cat.name, item: `${DOMAIN}/categoria/${cat.slug}` }] : []),
        { "@type": "ListItem", position: cat ? 4 : 3, name: p.name, item: url },
      ],
    };

    await emit(`/producto/${p.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url, ogType: "product", ogImage: image,
      schemas: [productSchema, breadcrumb],
    }), productBody(p, cat, brand?.name)));
    written++;
  }

  for (const post of posts) {
    if (!post.slug || !post.h1) continue;
    const url = `${DOMAIN}/blog/${post.slug}`;
    const title = post.meta_title || `${post.h1} | Netpower IT`;
    const description = clamp(post.meta_description || post.resumen_intro || post.h1, 160);
    const image = post.imagen_portada || OG_IMAGE_DEFAULT;

    await emit(`/blog/${post.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url, ogType: "article", ogImage: image,
      schemas: [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#post`,
          headline: post.h1,
          description,
          image,
          url,
          datePublished: post.fecha_publicacion || undefined,
          author: { "@type": post.autor ? "Person" : "Organization", name: post.autor || "Netpower IT" },
          publisher: { "@id": `${DOMAIN}/#organization` },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${DOMAIN}/blog` },
            { "@type": "ListItem", position: 3, name: post.h1, item: url },
          ],
        },
      ],
    }), blogBody(post)));
    written++;
  }

  console.log(
    `[prerender] ${written} rutas escritas (${products.length} productos, ${categories.length} categorías, ${posts.length} artículos).`,
  );
}

main().catch((err) => {
  console.error("[prerender] error inesperado:", err);
  process.exit(1);
});
