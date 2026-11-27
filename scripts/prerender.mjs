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
  "updated_at", "featured",
].join(",");

// Igual a src/lib/schema-oferta.ts: si cambia la política, actualizar los dos.
const OFERTA_ENVIO = {
  // Envío: a todo Colombia, gratis en Bogotá. El costo fuera de Bogotá depende
  // del peso y la zona (legal?tab=envios), así que no se declara una tarifa fija.
  shippingDetails: {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "CO" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 8, unitCode: "DAY" },
    },
  },
  // Devoluciones: se gestionan por garantía; aplica el retracto de ley
  // (5 días hábiles, transporte a cargo del comprador).
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "CO",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 5,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: "https://netpowerit.co/legal?tab=envios",
  },
};

const BLOG_COLUMNS = [
  "slug", "h1", "meta_title", "meta_description", "resumen_intro",
  "imagen_portada", "imagen_alt", "autor", "fecha_publicacion",
  "frase_inicial", "contenido_html", "cierre_html", "industria", "updated_at",
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

function productBody(p, cat, brand, relacionados = []) {
  const brandName = brand?.name;
  const price = Number(p.sale_price ?? p.price ?? 0);
  const desc = stripTags(p.description || p.short_description || "");
  return [
    `<nav aria-label="Ruta"><a href="/">Inicio</a> / <a href="/tienda">Tienda</a>`,
    cat ? ` / <a href="/categoria/${esc(cat.slug)}">${esc(cat.name)}</a>` : "",
    ` / <span>${esc(p.name)}</span></nav>`,
    `<main><h1>${esc(p.name)}</h1>`,
    brandName
      ? brand.slug
        ? `<p>Marca: <a href="/marcas/${esc(brand.slug)}">${esc(brandName)}</a></p>`
        : `<p>Marca: ${esc(brandName)}</p>`
      : "",
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
    relacionados.length
      ? `<h2>Productos relacionados</h2><ul>` +
        relacionados.map((r) => {
          const pr = Number(r.sale_price ?? r.price ?? 0);
          return `<li><a href="/producto/${esc(r.slug)}">${esc(r.name)}</a>${pr > 0 ? ` — $${pr.toLocaleString("es-CO")}` : ""}</li>`;
        }).join("") +
        `</ul>`
      : "",
    enlacesDeSalida(cat, brand),
    `<p><a href="/cotizacion">Solicitar cotización</a></p></main>`,
  ].join("");
}

// ─── enlazado interno ────────────────────────────────────────────────────────
//
// Medido el 26 nov 2026: en el HTML servido, cada ficha solo enlazaba a Inicio,
// Tienda, su categoria y Cotizacion; nada a su marca ni a otros productos, y
// los listados de categoria cortaban en 60 productos en el orden de la base,
// asi que buena parte del catalogo no recibia ningun enlace interno estatico.
// Los bots que no ejecutan JS (GPTBot, PerplexityBot, CCBot) solo ven esto.

/** Categorias que un comprador visita juntas: UPS -> baterias, servidor -> licencias. */
const CATEGORIAS_VECINAS = {
  ups: ["baterias-ups", "energia-solar"],
  "baterias-ups": ["ups", "energia-solar"],
  "energia-solar": ["baterias-ups", "ups"],
  servidores: ["licencias", "ups", "infraestructura-tic"],
  licencias: ["servidores", "accesorios"],
  "infraestructura-tic": ["servidores", "ups", "accesorios"],
  monitores: ["accesorios"],
  accesorios: ["monitores", "infraestructura-tic"],
};

/** Mismo criterio que puntajeVitrina en src/hooks/useProducts.ts. */
function vitrina(p) {
  const precio = Number(p.sale_price ?? p.price ?? 0) > 0;
  const foto = typeof p.images?.[0] === "string" && p.images[0].trim() !== "";
  return (p.featured ? 4 : 0) + (precio ? 2 : 0) + (foto ? 1 : 0);
}

const porVitrina = (lista) => [...lista].sort((a, b) => vitrina(b) - vitrina(a));

let categoriasPorSlug = new Map();

function enlacesDeSalida(cat, brand) {
  const vecinas = (cat ? CATEGORIAS_VECINAS[cat.slug] || [] : [])
    .map((s) => categoriasPorSlug.get(s))
    .filter(Boolean);
  const items = [
    cat ? `<li><a href="/categoria/${esc(cat.slug)}">Más ${esc(cat.name)}</a></li>` : "",
    brand?.slug ? `<li><a href="/marcas/${esc(brand.slug)}">Todo ${esc(brand.name)} en Colombia</a></li>` : "",
    ...vecinas.map((v) => `<li><a href="/categoria/${esc(v.slug)}">${esc(v.name)}</a></li>`),
  ].filter(Boolean);
  return items.length ? `<h2>Seguir explorando</h2><ul>${items.join("")}</ul>` : "";
}

/** HTML del articulo tal como esta en la base, sin scripts, estilos ni
 *  manejadores de eventos (lo escriben admins, pero el HTML estatico no pasa
 *  por DOMPurify como en React). */
function limpiarHtml(html) {
  return String(html || "")
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"');
}

/** Preguntas frecuentes del articulo (mismo criterio que src/lib/blog.ts). */
function faqDeArticulo(html) {
  const plano = (v) => v.replace(/<\/(p|li|h\d|div|ul|ol)>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const seccion = html.split(/<h2[^>]*>/i).find((s) => /preguntas frecuentes/i.test(plano(s.split(/<\/h2>/i)[0] ?? "")));
  if (!seccion) return [];
  return seccion.split(/<\/h2>/i).slice(1).join("").split(/<h3[^>]*>/i).slice(1)
    .map((t) => { const [q = "", ...r] = t.split(/<\/h3>/i); return { question: plano(q), answer: plano(r.join(" ")) }; })
    .filter((f) => f.question && f.answer);
}

function blogBody(post) {
  return [
    `<nav aria-label="Ruta"><a href="/">Inicio</a> / <a href="/blog">Blog</a> / <span>${esc(post.h1)}</span></nav>`,
    `<main><article><h1>${esc(post.h1)}</h1>`,
    post.resumen_intro ? `<p>${esc(stripTags(post.resumen_intro))}</p>` : "",
    `<p>${esc(post.autor || "Equipo Netpower IT")}`,
    post.fecha_publicacion ? ` · <time datetime="${esc(post.fecha_publicacion)}">${esc(String(post.fecha_publicacion).slice(0, 10))}</time>` : "",
    `</p>`,
    post.imagen_portada ? `<img src="${esc(post.imagen_portada)}" alt="${esc(post.imagen_alt || post.h1)}" width="1200" height="630">` : "",
    post.frase_inicial ? `<p><strong>${esc(stripTags(post.frase_inicial))}</strong></p>` : "",
    limpiarHtml(post.contenido_html),
    limpiarHtml(post.cierre_html),
    `<p><a href="https://wa.me/573504609431">Hablar con un asesor por WhatsApp</a> · <a href="/cotizacion">Pedir cotización</a></p>`,
    `</article></main>`,
  ].join("");
}

function listBody(heading, description, products, extra = "") {
  // Todos los productos, no los primeros 60: el corte dejaba sin enlace interno
  // a la mayor parte de las categorias grandes. Ordenados para que los que se
  // pueden vender (foto y precio) queden arriba.
  const items = porVitrina(products)
    .slice(0, 400)
    .map((p) => {
      const pr = Number(p.sale_price ?? p.price ?? 0);
      return `<li><a href="/producto/${esc(p.slug)}">${esc(p.name)}</a>${pr > 0 ? ` — $${pr.toLocaleString("es-CO")}` : ""}</li>`;
    })
    .join("");
  return `<main><h1>${esc(heading)}</h1><p>${esc(description)}</p><ul>${items}</ul>${extra}</main>`;
}

// ─── escritura ───────────────────────────────────────────────────────────────

async function emit(route, html) {
  const dir = route === "/" ? DIST : path.join(DIST, route.replace(/^\//, ""));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");
}

// ─── sitemap ─────────────────────────────────────────────────────────────────
//
// El sitemap sale de aqui y no de la Edge Function generate-sitemap, por dos
// razones medidas el 26 nov 2026:
//  - La funcion desplegada estaba desfasada del repo (seguia anunciando
//    /categoria/ups-accesorios, que es un 301) porque los cambios en
//    supabase/functions no se publican solos al hacer push.
//  - La funcion no puede ver marcas ni articulos del blog: las marcas viven en
//    src/data/store-data.ts. Este script si, y ademas sabe exactamente que
//    rutas acaba de escribir, asi que el sitemap no puede anunciar una URL que
//    no exista.
// Si falla la lectura de productos no se escribe nada y queda el
// public/sitemap.xml, que es un indice hacia la funcion: peor, pero no vacio.

const sitemap = [];

/** Anota una ruta para el sitemap. lastmod solo si es una fecha real. */
function anunciar(route, lastmod) {
  const fecha = lastmod ? new Date(lastmod) : null;
  sitemap.push({
    loc: route === "/" ? DOMAIN : `${DOMAIN}${route}`,
    lastmod: fecha && !Number.isNaN(fecha.getTime()) ? fecha.toISOString().slice(0, 10) : null,
  });
}

// Todas las fichas activas van al sitemap, tambien las que aun no tienen foto
// ni precio: se estan completando y deben descubrirse en cuanto se actualicen
// (decision de Mafe, 26 nov 2026). Para sacar una ficha, se desactiva.

/** Textos de categoria de src/data/categorias-seo.ts. El objeto es JSON
 *  valido a proposito, asi que basta con recortar el literal y parsearlo. */
async function readCategoriasSeo() {
  try {
    const src = await readFile(path.join(ROOT, "src/data/categorias-seo.ts"), "utf8");
    const inicio = src.indexOf("{", src.indexOf("CATEGORIAS_SEO"));
    const fin = src.lastIndexOf("}");
    return JSON.parse(src.slice(inicio, fin + 1));
  } catch (err) {
    console.warn(`[prerender] no se pudieron leer los textos de categoria (${err.message}); se omiten.`);
    return {};
  }
}

function categoriaSeoBody(seo) {
  if (!seo) return "";
  const faqs = seo.faqs?.length
    ? `<h2>Preguntas frecuentes</h2>` +
      seo.faqs.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")
    : "";
  return `<article>${seo.html}${faqs}</article>`;
}

async function escribirSitemap() {
  const xmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const urls = sitemap
    .map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generado por scripts/prerender.mjs en cada build. ${sitemap.length} URLs. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(path.join(DIST, "sitemap.xml"), xml, "utf8");
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
    // Debe ser la imagen del PRIMER slide del carrusel de HomePage.tsx. Si se
    // cambia el orden de los slides, cambiar tambien este nombre: precargar
    // otro banner gasta la prioridad alta en una imagen que no se ve.
    // El hash de Vite no lleva "secundario", asi que no toma ese otro banner.
    const hero = readdirSync(dir).find(
      (f) => /^banner-forza-atlas-[^.]+\.jpg$/.test(f) && !f.includes("secundario"),
    );
    if (!hero) {
      console.warn("[prerender] no se encontro banner-forza-atlas-*.jpg en dist/assets; sin preload de LCP");
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

  // La base guarda la marca y la categoria unas veces por id ("27") y otras por
  // nombre ("Forza", "UPS y Accesorios"). Medido el 29 sep 2026: 612 de 613
  // productos activos traen la categoria por nombre y 471 de 613 la marca por
  // nombre. Buscar solo por id fallaba en casi todos, y el efecto no se veia en
  // pantalla sino aqui: el HTML estatico salia sin la linea de marca, sin el
  // nivel de categoria en el breadcrumb y con `brand: "Netpower IT"` en el
  // Product de schema.org. La app de React ya resolvia por los dos caminos
  // (ProductDetailPage); este script era el unico que no.
  const clave = (v) => String(v ?? "").trim().toLocaleLowerCase("es");
  const indexar = (lista) => {
    const m = new Map();
    for (const x of lista) {
      m.set(clave(x.id), x);
      m.set(clave(x.name), x);
      m.set(clave(x.slug), x);
    }
    return m;
  };
  const catIndex = indexar(categories);
  const brandIndex = indexar(brands);
  const catById = { get: (v) => catIndex.get(clave(v)) };
  const brandById = { get: (v) => brandIndex.get(clave(v)) };

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
    anunciar(s.route);
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

  // Indices para el enlazado interno (ver "enlazado interno" arriba).
  categoriasPorSlug = new Map(categories.map((c) => [c.slug, c]));
  const porCategoria = new Map();
  for (const p of products) {
    const c = catById.get(p.category);
    if (!c) continue;
    if (!porCategoria.has(c.id)) porCategoria.set(c.id, []);
    porCategoria.get(c.id).push(p);
  }
  const catsConProductos = categories.filter((c) => porCategoria.has(c.id));
  const marcasTop = (() => {
    const n = new Map();
    for (const p of products) {
      const b = brandById.get(p.brand);
      if (b?.slug) n.set(b.slug, { b, k: (n.get(b.slug)?.k || 0) + 1 });
    }
    return [...n.values()].sort((a, b) => b.k - a.k).slice(0, 12).map((x) => x.b);
  })();

  /** Palabras que distinguen un producto ("ups", "online", "1000va", "forza"),
   *  sin conectores ni medidas genericas. */
  const VACIAS = new Set(["con", "para", "de", "del", "la", "el", "los", "las", "y", "en", "por", "ref", "x", "und", "negro", "negra", "blanco", "usb", "hdmi"]);
  const palabras = (s) => new Set(
    String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !VACIAS.has(w)),
  );
  const palabrasDe = new Map(products.map((p) => [p.slug, palabras(p.name)]));

  /** 6 fichas de la misma categoria. Manda el parecido (palabras del nombre
   *  y misma marca); a igual parecido, las vendibles y de precio cercano. */
  const relacionadosDe = (p, cat) => {
    if (!cat) return [];
    const mias = palabrasDe.get(p.slug) || new Set();
    const marca = brandById.get(p.brand)?.slug;
    const ref = Number(p.sale_price ?? p.price ?? 0);
    const parecido = (x) => {
      let n = 0;
      for (const w of palabrasDe.get(x.slug) || []) if (mias.has(w)) n++;
      return n * 2 + (marca && brandById.get(x.brand)?.slug === marca ? 2 : 0);
    };
    const dist = (x) => {
      const v = Number(x.sale_price ?? x.price ?? 0);
      return ref > 0 && v > 0 ? Math.abs(Math.log(v / ref)) : Number.MAX_SAFE_INTEGER;
    };
    return (porCategoria.get(cat.id) || [])
      .filter((x) => x.slug && x.slug !== p.slug)
      .map((x) => ({ x, s: parecido(x) + vitrina(x) }))
      .sort((a, b) => b.s - a.s || dist(a.x) - dist(b.x))
      .slice(0, 6)
      .map(({ x }) => x);
  };

  /** Pie de categorias y marcas: vecinas primero, luego el resto. */
  const enlacesDeListado = (slugActual) => {
    const vecinas = CATEGORIAS_VECINAS[slugActual] || [];
    const cats = [
      ...vecinas.map((s) => categoriasPorSlug.get(s)).filter((c) => c && porCategoria.has(c.id)),
      ...catsConProductos.filter((c) => c.slug !== slugActual && !vecinas.includes(c.slug)),
    ];
    return (
      `<h2>Otras categorías</h2><ul>` +
      cats.map((c) => `<li><a href="/categoria/${esc(c.slug)}">${esc(c.name)}</a></li>`).join("") +
      `</ul><h2>Marcas</h2><ul>` +
      marcasTop.map((b) => `<li><a href="/marcas/${esc(b.slug)}">${esc(b.name)}</a></li>`).join("") +
      `</ul>`
    );
  };

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
  anunciar("/tienda");
  written++;

  const categoriasSeo = await readCategoriasSeo();
  for (const c of categories) {
    const inCat = products.filter((p) => catById.get(p.category)?.id === c.id);
    const url = `${DOMAIN}/categoria/${c.slug}`;
    const seo = categoriasSeo[c.slug];
    const title = seo?.metaTitle || `${c.name} | Netpower IT`;
    const description = seo?.metaDescription || `${c.description}. Compra ${c.name} para empresas en Colombia con Netpower IT.`;
    const faqSchema = seo?.faqs?.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: seo.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }]
      : [];
    await emit(`/categoria/${c.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url,
      schemas: [...faqSchema, {
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
    }), listBody(c.name, description, inCat, categoriaSeoBody(seo) + enlacesDeListado(c.slug))));
    if (inCat.length > 0) anunciar(`/categoria/${c.slug}`);
    written++;
  }

  // 2.b Paginas de marca. Solo se emiten las marcas que tienen producto activo:
  //     una pagina de marca vacia no aporta y si consume rastreo. Y como NO se
  //     agrega una regla catch-all de /marcas/* en vercel.json, cualquier otra
  //     marca cae en el 404 real en vez de servir la home con 200, que es el
  //     fallo que ya arrastra /producto/*.
  for (const b of brands) {
    const deLaMarca = products.filter((p) => brandById.get(p.brand)?.id === b.id);
    if (deLaMarca.length === 0) continue;
    const url = `${DOMAIN}/marcas/${b.slug}`;
    const title = `${b.name} en Colombia — Distribuidor autorizado | Netpower IT`;
    const description = `Catalogo ${b.name} con precio en pesos, disponibilidad real y garantia en Colombia. ${deLaMarca.length} referencias y asesoria para elegir la capacidad correcta.`;
    await emit(`/marcas/${b.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url,
      schemas: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${url}#page`,
          name: title,
          description,
          url,
          isPartOf: { "@id": `${DOMAIN}/#website` },
          about: { "@type": "Brand", name: b.name },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
            { "@type": "ListItem", position: 2, name: "Marcas", item: `${DOMAIN}/marcas` },
            { "@type": "ListItem", position: 3, name: b.name, item: url },
          ],
        },
      ],
    }), listBody(`${b.name} en Colombia`, description, deLaMarca, enlacesDeListado(null))));
    anunciar(`/marcas/${b.slug}`);
    written++;
  }

  // 2.c Home con contenido. La version del paso 1 solo tiene un H1 y la
  //     descripcion: 33 palabras y ningun enlace en el HTML servido, que es lo
  //     que lee un rastreador antes de ejecutar el bundle. Aqui ya se conocen
  //     categorias, marcas y productos, asi que se reescribe con enlaces a todo
  //     lo que importa. React reemplaza este <main> al montar.
  {
    const home = STATIC_ROUTES.find((s) => s.route === "/");
    const conProductos = (c) => products.some((p) => catById.get(p.category)?.id === c.id);
    const cats = categories.filter(conProductos);
    const conteoMarca = new Map();
    for (const p of products) {
      const b = brandById.get(p.brand);
      if (b) conteoMarca.set(b.slug, { b, n: (conteoMarca.get(b.slug)?.n || 0) + 1 });
    }
    const marcas = [...conteoMarca.values()].sort((a, b) => b.n - a.n).slice(0, 12).map((x) => x.b);
    const vendibles = products.filter((p) => Number(p.sale_price ?? p.price ?? 0) > 0 && p.images?.[0]);
    const destacados = [...vendibles.filter((p) => p.featured), ...vendibles.filter((p) => !p.featured)].slice(0, 12);
    const cop = (n) => "$" + Math.round(n).toLocaleString("es-CO");

    const body =
      `<main>` +
      `<h1>UPS, servidores y soluciones TIC para empresas en Colombia</h1>` +
      `<p>Netpower IT vende y asesora en respaldo de energía (UPS online e interactivas, baterías y estaciones portátiles), ` +
      `servidores, infraestructura de red, monitores, licencias de software y energía solar. Somos distribuidores de marcas como ` +
      `${marcas.slice(0, 5).map((b) => esc(b.name)).join(", ")}, con envío a toda Colombia, garantía de fabricante y pago con Wompi, PSE o tarjeta.</p>` +
      (destacados.length
        ? `<h2>Productos destacados</h2><ul>` +
          destacados.map((p) => `<li><a href="/producto/${esc(p.slug)}">${esc(p.name)}</a> — ${cop(Number(p.sale_price ?? p.price))}</li>`).join("") +
          `</ul>`
        : "") +
      `<h2>Categorías</h2><ul>` +
      cats.map((c) => `<li><a href="/categoria/${esc(c.slug)}">${esc(c.name)}</a>${c.description ? `: ${esc(c.description)}` : ""}</li>`).join("") +
      `</ul>` +
      `<h2>Marcas</h2><ul>` +
      marcas.map((b) => `<li><a href="/marcas/${esc(b.slug)}">${esc(b.name)}</a></li>`).join("") +
      `</ul>` +
      (posts.length
        ? `<h2>Guías y artículos</h2><ul>` +
          [...posts].sort((x, y) => String(y.fecha_publicacion || "").localeCompare(String(x.fecha_publicacion || ""))).slice(0, 6)
            .map((b) => `<li><a href="/blog/${esc(b.slug)}">${esc(b.h1)}</a></li>`).join("") +
          `</ul><p><a href="/blog">Ver todos los artículos del blog</a></p>`
        : "") +
      `<p><a href="/tienda">Ver toda la tienda</a> · <a href="/cotizacion">Cotizar un proyecto</a> · <a href="/contacto">Contacto</a></p>` +
      `</main>`;

    const banner = heroPreload.match(/href="([^"]+)"/)?.[1];
    let head = applyHead(template, {
      title: home.title,
      description: home.description,
      canonical: DOMAIN,
      ogImage: banner ? `${DOMAIN}${banner}` : undefined,
    });
    if (heroPreload) head = head.replace("</head>", `${MARK_START}${heroPreload}${MARK_END}\n</head>`);
    await emit("/", applyBody(head, body));
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
              ...OFERTA_ENVIO,
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
    }), productBody(p, cat, brand, relacionadosDe(p, cat))));
    anunciar(`/producto/${p.slug}`, p.updated_at);
    written++;
  }

  for (const post of posts) {
    if (!post.slug || !post.h1) continue;
    const url = `${DOMAIN}/blog/${post.slug}`;
    const title = post.meta_title || `${post.h1} | Netpower IT`;
    const description = clamp(post.meta_description || post.resumen_intro || post.h1, 160);
    const image = post.imagen_portada || OG_IMAGE_DEFAULT;
    const faqs = faqDeArticulo(`${post.contenido_html || ""}${post.cierre_html || ""}`);

    await emit(`/blog/${post.slug}`, applyBody(applyHead(template, {
      title, description, canonical: url, ogType: "article", ogImage: image,
      schemas: [
        ...(faqs.length ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }] : []),
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#post`,
          headline: post.h1,
          description,
          image,
          url,
          datePublished: post.fecha_publicacion || undefined,
          dateModified: post.updated_at || undefined,
          // "Equipo Netpower IT" es la empresa, no una persona.
          author: { "@type": "Organization", name: post.autor || "Netpower IT" },
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
    anunciar(`/blog/${post.slug}`, post.fecha_publicacion);
    written++;
  }

  // /blog con enlaces a todos los articulos (la version del paso 1 solo tiene
  // el H1 y la descripcion).
  if (posts.length) {
    const s = STATIC_ROUTES.find((r) => r.route === "/blog");
    const lista = posts.filter((p) => p.slug && p.h1)
      .map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.h1)}</a>${p.resumen_intro ? ` — ${esc(clamp(stripTags(p.resumen_intro), 160))}` : ""}</li>`)
      .join("");
    await emit("/blog", applyBody(applyHead(template, {
      title: s.title, description: s.description, canonical: `${DOMAIN}/blog`,
    }), `<main><h1>${esc(s.h1)}</h1><p>${esc(s.description)}</p><ul>${lista}</ul></main>`));
  }

  await escribirSitemap();
  console.log(`[prerender] sitemap.xml con ${sitemap.length} URLs.`);
  console.log(
    `[prerender] ${written} rutas escritas (${products.length} productos, ${categories.length} categorías, ${posts.length} artículos).`,
  );
}

main().catch((err) => {
  console.error("[prerender] error inesperado:", err);
  process.exit(1);
});
