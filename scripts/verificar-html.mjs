/**
 * Verifica, SIN ejecutar JavaScript, que cada ruta pública devuelve HTML propio.
 *
 * Pide cada URL con un fetch plano —igual que un rastreador que no renderiza— y
 * comprueba cuatro cosas por ruta: hash SHA-256 del cuerpo, <title>, meta
 * description, canonical y <h1>. Después cruza los resultados y reporta:
 *
 *   - rutas distintas que devuelven exactamente el mismo HTML (hash repetido)
 *   - rutas sin title, sin description, sin canonical o sin h1
 *   - rutas cuyo canonical apunta a la home sin ser la home
 *   - una URL inventada que devuelve 200 con el mismo HTML que la home (soft 404)
 *
 * Uso:
 *   node scripts/verificar-html.mjs                        # contra dist/ servido en localhost:4173
 *   node scripts/verificar-html.mjs --base=https://netpowerit.co
 *   node scripts/verificar-html.mjs --todas                # todas las rutas, no una muestra
 *
 * Las rutas salen de dist/ si existe; si no, del sitemap del dominio.
 * Sale con código 1 si algo falla, para poder usarlo en CI.
 */
import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const args = process.argv.slice(2);
const arg = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};
const BASE = (arg("base", "http://localhost:4173")).replace(/\/$/, "");
const TODAS = args.includes("--todas");
const MUESTRA_POR_TIPO = Number(arg("muestra", "3"));
const URL_INVENTADA = "/esta-url-no-existe-" + Date.now();

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};

const leer = (html) => ({
  title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
  description: pick(html, /<meta\s+name="description"[^>]*content="([^"]*)"/i),
  canonical: pick(html, /<link\s+rel="canonical"[^>]*href="([^"]*)"/i),
  h1: pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
  robots: pick(html, /<meta\s+name="robots"[^>]*content="([^"]*)"/i),
});

/** Rutas prerenderizadas presentes en dist/. */
async function rutasDeDist(dir = DIST, prefijo = "") {
  const out = [];
  for (const nombre of await readdir(dir)) {
    if (nombre === "assets") continue;
    const completo = path.join(dir, nombre);
    const info = await stat(completo);
    if (info.isDirectory()) out.push(...(await rutasDeDist(completo, `${prefijo}/${nombre}`)));
    else if (nombre === "index.html") out.push(prefijo === "" ? "/" : prefijo);
  }
  return out;
}

async function rutasDeSitemap() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** Deja como mucho N rutas por familia, para no pedir 891 URLs. */
function muestrear(rutas) {
  if (TODAS) return rutas;
  const familia = (r) => (r.match(/^\/(producto|categoria|blog)\//) || [, "estatica"])[1];
  const porFamilia = new Map();
  const out = [];
  for (const r of rutas) {
    const f = familia(r);
    const n = porFamilia.get(f) ?? 0;
    if (f === "estatica" || n < MUESTRA_POR_TIPO) {
      out.push(r);
      porFamilia.set(f, n + 1);
    }
  }
  return out;
}

async function pedir(ruta) {
  const res = await fetch(`${BASE}${ruta}`, {
    redirect: "follow",
    headers: { "User-Agent": "verificador-ferova (sin JS)" },
  });
  const html = await res.text();
  return { ruta, estado: res.status, bytes: html.length, hash: hash(html), ...leer(html) };
}

async function main() {
  let rutas;
  if (existsSync(DIST)) {
    rutas = muestrear((await rutasDeDist()).sort());
    console.log(`[verificar] ${rutas.length} rutas tomadas de dist/`);
  } else {
    rutas = muestrear(await rutasDeSitemap());
    console.log(`[verificar] ${rutas.length} rutas tomadas del sitemap de ${BASE}`);
  }

  const filas = [];
  for (const r of [...rutas, URL_INVENTADA]) {
    try {
      const fila = await pedir(r);
      // Sonda de barra final: algunos servidores solo resuelven el index.html
      // anidado cuando la URL termina en "/". Si /ruta y /ruta/ devuelven HTML
      // distinto, el problema es de configuración del servidor, no del prerender.
      if (r !== "/" && r !== URL_INVENTADA) {
        try {
          const conBarra = await pedir(`${r}/`);
          if (conBarra.hash !== fila.hash) fila.hashConBarra = conBarra.hash;
        } catch {
          /* si falla la sonda, no es concluyente y se ignora */
        }
      }
      filas.push(fila);
    } catch (err) {
      filas.push({ ruta: r, estado: 0, error: err.message });
    }
  }

  const home = filas.find((f) => f.ruta === "/");
  const fallos = [];

  // 1. hashes repetidos entre rutas distintas
  const porHash = new Map();
  for (const f of filas) {
    if (f.ruta === URL_INVENTADA || !f.hash) continue;
    porHash.set(f.hash, [...(porHash.get(f.hash) ?? []), f.ruta]);
  }
  for (const [h, rs] of porHash) {
    if (rs.length > 1) fallos.push(`HTML idéntico (${h}) en ${rs.length} rutas: ${rs.join(", ")}`);
  }

  // 1b. rutas que solo sirven su HTML propio con barra final
  const soloConBarra = filas.filter((f) => f.hashConBarra);
  if (soloConBarra.length) {
    fallos.push(
      `${soloConBarra.length} rutas devuelven HTML distinto con barra final que sin ella ` +
        `(ej. ${soloConBarra[0].ruta} → ${soloConBarra[0].hash} vs ${soloConBarra[0].ruta}/ → ${soloConBarra[0].hashConBarra}). ` +
        `El HTML prerenderizado existe pero el servidor no lo entrega en la URL canónica: es configuración del servidor.`,
    );
  }

  // 2. elementos ausentes o canonical prestado
  for (const f of filas) {
    if (f.ruta === URL_INVENTADA) continue;
    if (f.error) { fallos.push(`${f.ruta}: no se pudo pedir (${f.error})`); continue; }
    if (f.estado !== 200) fallos.push(`${f.ruta}: HTTP ${f.estado}`);
    for (const campo of ["title", "description", "canonical", "h1"]) {
      if (!f[campo]) fallos.push(`${f.ruta}: falta ${campo}`);
    }
    if (f.ruta !== "/" && f.canonical && /^https:\/\/netpowerit\.co\/?$/.test(f.canonical)) {
      fallos.push(`${f.ruta}: canonical apunta a la home`);
    }
    if (f.ruta !== "/" && home && f.title && f.title === home.title) {
      fallos.push(`${f.ruta}: title igual al de la home`);
    }
  }

  // 3. soft 404
  const inventada = filas.find((f) => f.ruta === URL_INVENTADA);
  const soft404 =
    inventada && inventada.estado === 200 && !/noindex/i.test(inventada.robots ?? "");
  if (soft404) {
    fallos.push(
      `soft 404: ${URL_INVENTADA} responde 200 sin noindex` +
        (home && inventada.hash === home.hash ? " y con el mismo HTML que la home" : ""),
    );
  }

  // salida
  console.log("");
  console.log("ruta".padEnd(46) + "hash".padEnd(14) + "h1");
  console.log("-".repeat(100));
  for (const f of filas) {
    const etiqueta = f.ruta === URL_INVENTADA ? `${f.ruta} (control)` : f.ruta;
    console.log(
      etiqueta.slice(0, 45).padEnd(46) +
        String(f.hash ?? "—").padEnd(14) +
        String(f.h1 ?? "— sin h1 —").replace(/\s+/g, " ").slice(0, 40),
    );
  }

  console.log("");
  console.log(`Hashes distintos: ${porHash.size} sobre ${filas.length - 1} rutas.`);
  if (fallos.length === 0) {
    console.log("[verificar] sin fallos.");
    return;
  }
  console.log(`[verificar] ${fallos.length} fallos:`);
  for (const f of fallos) console.log(`  - ${f}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("[verificar] error inesperado:", err);
  process.exit(1);
});
