/**
 * Inventario Central Netpower IT — comparador de listas de actualización.
 *
 * Pinta la pestaña activa cruzando por NOMBRE contra el catálogo real de
 * netpowerit.co:
 *   ROJO      = ese producto NO existe en la web.
 *   AMARILLO  = existe, pero cambió el precio o el stock.
 *   Sin color = existe y está igual.
 *
 * El cruce es por similitud de bigramas (coeficiente de Dice), el mismo
 * criterio de All For All. Por debajo de MIN_SIMILITUD se considera que no
 * existe. Antes de comparar se prefiltra por palabras compartidas, para que
 * una lista de 1000 filas contra 1000 productos no se pase de los 6 minutos
 * que Apps Script le da a una ejecución.
 *
 * Este script NO escribe nada en la web: solo pinta la hoja.
 *
 * Primera vez: menú NetPower -> Configurar conexión, y pegar los dos valores
 * del archivo .env del repo (VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY).
 * Son los mismos que ya viajan en la web pública; no son claves privadas.
 */

/** Por debajo de esto, se considera que el producto no existe en la web. */
var MIN_SIMILITUD = 0.72;

/** Cuántos candidatos del catálogo se comparan a fondo por cada fila. */
var MAX_CANDIDATOS = 60;

var ROJO = '#ffc7ce';
var AMARILLO = '#fff2cc';
var BLANCO = '#ffffff';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NetPower')
    .addItem('Comparar esta pestaña con la web', 'compararPestanaActiva')
    .addItem('Quitar colores de esta pestaña', 'limpiarColores')
    .addSeparator()
    .addItem('Configurar conexión', 'configurarConexion')
    .addToUi();
}

/* ─────────────────────────────── conexión ───────────────────────────────── */

function configurarConexion() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();

  var r1 = ui.prompt('Conexión 1 de 2',
    'Pega la URL de Supabase (VITE_SUPABASE_URL del archivo .env).\nSe ve así: https://xxxxxxxx.supabase.co',
    ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;

  var r2 = ui.prompt('Conexión 2 de 2',
    'Pega la clave pública (VITE_SUPABASE_PUBLISHABLE_KEY del archivo .env).',
    ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;

  var url = r1.getResponseText().trim().replace(/\/+$/, '');
  var key = r2.getResponseText().trim();
  if (!url || !key) { ui.alert('Faltó uno de los dos valores. No guardé nada.'); return; }

  props.setProperty('SUPABASE_URL', url);
  props.setProperty('SUPABASE_KEY', key);

  try {
    var n = traerCatalogo_().length;
    ui.alert('Conexión guardada.\n\nLeí ' + n + ' productos activos de la web.');
  } catch (e) {
    ui.alert('Guardé los datos, pero la prueba falló:\n\n' + e.message);
  }
}

function credenciales_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_KEY');
  if (!url || !key) {
    throw new Error('Falta configurar la conexión. Menú NetPower -> Configurar conexión.');
  }
  return { url: url, key: key };
}

/* ─────────────────────────── catálogo de la web ─────────────────────────── */

/** Trae los productos activos de la web, paginando de a 1000. */
function traerCatalogo_() {
  var c = credenciales_();
  var columnas = 'name,slug,price,sale_price,stock,sku,active';
  var todos = [];
  var desde = 0;

  while (true) {
    var res = UrlFetchApp.fetch(
      c.url + '/rest/v1/products?select=' + columnas + '&active=eq.true&order=name.asc',
      {
        method: 'get',
        headers: {
          apikey: c.key,
          Authorization: 'Bearer ' + c.key,
          'Range-Unit': 'items',
          Range: desde + '-' + (desde + 999)
        },
        muteHttpExceptions: true
      }
    );

    if (res.getResponseCode() >= 300) {
      throw new Error('No se pudo leer el catálogo (HTTP ' + res.getResponseCode() + '): ' +
                      res.getContentText().slice(0, 200));
    }

    var lote = JSON.parse(res.getContentText());
    if (!lote.length) break;
    todos = todos.concat(lote);
    if (lote.length < 1000) break;
    desde += 1000;
  }

  return todos;
}

/* ─────────────────────────── comparación de nombres ─────────────────────── */

function normalizar_(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mapa de bigramas de un texto ya normalizado. Se calcula una sola vez. */
function bigramas_(s) {
  var m = {}, n = 0;
  for (var i = 0; i < s.length - 1; i++) {
    var x = s.substr(i, 2);
    m[x] = (m[x] || 0) + 1;
    n++;
  }
  return { m: m, n: n };
}

/** Coeficiente de Dice entre un mapa precalculado y un texto. No muta nada. */
function dice_(bg, b) {
  if (!bg.n || b.length < 2) return 0;
  var usado = {}, inter = 0, nB = 0;
  for (var i = 0; i < b.length - 1; i++) {
    var y = b.substr(i, 2);
    nB++;
    var u = usado[y] || 0;
    if ((bg.m[y] || 0) > u) { usado[y] = u + 1; inter++; }
  }
  return (2 * inter) / ((bg.n + nB) || 1);
}

/** Palabras de 4 letras o más: sirven para prefiltrar candidatos. */
function tokens_(norm) {
  var out = [];
  var partes = norm.split(' ');
  for (var i = 0; i < partes.length; i++) {
    if (partes[i].length >= 4) out.push(partes[i]);
  }
  return out;
}

function aNumero_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = String(v).trim().replace(/[$\s]/g, '');
  var coma = s.indexOf(',') >= 0, punto = s.indexOf('.') >= 0;
  if (coma && punto) s = s.replace(/\./g, '').replace(',', '.');
  else if (coma) s = s.replace(',', '.');
  else if (punto && /\.\d{3}\b/.test(s)) s = s.replace(/\./g, ''); // 1.234.000 es miles
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}

/** El encabezado es la primera fila que tenga algo parecido a un nombre. */
function ubicarEncabezado_(valores) {
  var patron = /(descripcion|descripción|nombre|producto)/i;
  for (var f = 0; f < Math.min(valores.length, 15); f++) {
    for (var c = 0; c < valores[f].length; c++) {
      if (patron.test(String(valores[f][c]))) return f;
    }
  }
  return 0;
}

function buscarColumna_(encabezados, patron) {
  for (var i = 0; i < encabezados.length; i++) {
    if (patron.test(String(encabezados[i]))) return i;
  }
  return -1;
}

function repetir_(v, n) {
  var a = [];
  for (var i = 0; i < n; i++) a.push(v);
  return a;
}

function ponerNotaEn_(nota, ancho, col) {
  var a = repetir_('', ancho);
  if (col >= 0 && col < ancho) a[col] = nota;
  return a;
}

/* ─────────────────────────────── acciones ───────────────────────────────── */

function compararPestanaActiva() {
  var ui = SpreadsheetApp.getUi();
  var hoja = SpreadsheetApp.getActiveSheet();
  var valores = hoja.getDataRange().getValues();

  if (valores.length < 2) { ui.alert('Esta pestaña está vacía.'); return; }

  var filaEnc = ubicarEncabezado_(valores);
  var encabezados = valores[filaEnc];
  var ancho = encabezados.length;

  var iNombre = buscarColumna_(encabezados, /(descripcion|descripción|nombre|producto)/i);
  if (iNombre < 0) {
    ui.alert('No encontré la columna del nombre. Debe llamarse Descripción, Nombre o Producto.');
    return;
  }

  // "Precio de venta" gana sobre "Precio lista": es el que debe quedar en la web.
  var iPrecio = buscarColumna_(encabezados, /precio\s*de\s*venta/i);
  if (iPrecio < 0) iPrecio = buscarColumna_(encabezados, /precio/i);
  var iStock = buscarColumna_(encabezados, /(stock|cantidad|existencia|disponible)/i);

  var catalogo = traerCatalogo_();
  if (!catalogo.length) { ui.alert('La web no devolvió productos. Revisá la conexión.'); return; }

  // Índice: cada producto con sus bigramas ya calculados, y un invertido por palabra.
  var indice = [];
  var porToken = {};
  for (var i = 0; i < catalogo.length; i++) {
    var norm = normalizar_(catalogo[i].name);
    indice.push({ p: catalogo[i], norm: norm, bg: bigramas_(norm) });
    var tk = tokens_(norm);
    for (var t = 0; t < tk.length; t++) {
      (porToken[tk[t]] = porToken[tk[t]] || []).push(i);
    }
  }

  var primera = filaEnc + 1;
  var total = valores.length - primera;
  var fondos = [], notas = [];
  var usados = {};
  var nRojo = 0, nAmarillo = 0, nIgual = 0, nVacio = 0;

  for (var f = primera; f < valores.length; f++) {
    var nombreHoja = String(valores[f][iNombre] || '').trim();

    if (!nombreHoja) {
      fondos.push(repetir_(BLANCO, ancho));
      notas.push(repetir_('', ancho));
      nVacio++;
      continue;
    }

    var nm = normalizar_(nombreHoja);

    // Prefiltro: solo los productos que comparten alguna palabra larga.
    var puntaje = {};
    var tkFila = tokens_(nm);
    for (var a = 0; a < tkFila.length; a++) {
      var lista = porToken[tkFila[a]];
      if (!lista) continue;
      for (var b = 0; b < lista.length; b++) puntaje[lista[b]] = (puntaje[lista[b]] || 0) + 1;
    }
    var candidatos = Object.keys(puntaje);
    if (candidatos.length > MAX_CANDIDATOS) {
      candidatos.sort(function (x, y) { return puntaje[y] - puntaje[x]; });
      candidatos = candidatos.slice(0, MAX_CANDIDATOS);
    }
    // Sin palabras en común no hay con qué comparar: se revisa todo el catálogo
    // solo si la lista de candidatos quedó vacía y el nombre es corto.
    if (!candidatos.length && nm.length <= 25) {
      candidatos = [];
      for (var q = 0; q < indice.length; q++) candidatos.push(q);
    }

    var mejor = null, punt = 0;
    for (var c2 = 0; c2 < candidatos.length; c2++) {
      var it = indice[candidatos[c2]];
      if (usados[it.p.slug]) continue;
      var s = dice_(it.bg, nm);
      if (s > punt) { punt = s; mejor = it.p; }
    }

    var color = BLANCO, nota = '';

    if (!mejor || punt < MIN_SIMILITUD) {
      color = ROJO;
      nota = 'No existe en la web.\nSi tiene SKU en la hoja Inventario, lo crea el botón Sincronizar del admin.';
      nRojo++;
    } else {
      usados[mejor.slug] = true;
      var precioHoja = iPrecio >= 0 ? aNumero_(valores[f][iPrecio]) : null;
      var stockHoja = iStock >= 0 ? aNumero_(valores[f][iStock]) : null;
      var precioWeb = aNumero_(mejor.sale_price) || aNumero_(mejor.price) || 0;
      var stockWeb = aNumero_(mejor.stock) || 0;

      var cambios = [];
      if (precioHoja !== null && Math.round(precioHoja) !== Math.round(precioWeb)) {
        cambios.push('Precio: web ' + Math.round(precioWeb) + ' -> lista ' + Math.round(precioHoja));
      }
      if (stockHoja !== null && Math.round(stockHoja) !== Math.round(stockWeb)) {
        cambios.push('Stock: web ' + Math.round(stockWeb) + ' -> lista ' + Math.round(stockHoja));
      }

      if (cambios.length) { color = AMARILLO; nAmarillo++; } else { nIgual++; }

      nota = 'Web: ' + mejor.name + ' (' + Math.round(punt * 100) + '%)' +
             (mejor.sku ? '\nSKU: ' + mejor.sku : '') +
             (cambios.length ? '\n' + cambios.join('\n') : '\nSin cambios.');
    }

    fondos.push(repetir_(color, ancho));
    notas.push(ponerNotaEn_(nota, ancho, iNombre));
  }

  if (total > 0) pintar_(hoja, primera + 1, fondos, notas, ancho);

  ui.alert(
    'Comparación lista\n\n' +
    'Rojo (no existen en la web): ' + nRojo + '\n' +
    'Amarillo (cambió precio o stock): ' + nAmarillo + '\n' +
    'Sin cambios: ' + nIgual + '\n' +
    (nVacio ? 'Filas sin nombre: ' + nVacio + '\n' : '') +
    '\nCatálogo leído: ' + catalogo.length + ' productos activos.\n' +
    (iStock < 0 ? 'Esta pestaña no tiene columna de stock, así que solo se comparó el precio.\n' : '') +
    '\nPasá el cursor sobre el nombre para ver el detalle de cada fila.'
  );
}

function limpiarColores() {
  var hoja = SpreadsheetApp.getActiveSheet();
  var r = hoja.getDataRange();
  r.setBackground(null);
  r.clearNote();
  SpreadsheetApp.getUi().alert('Listo, quité los colores y las notas de "' + hoja.getName() + '".');
}

/**
 * Vuelca colores y notas. Si la pestana tiene columnas inmovilizadas, un solo
 * rango que cruce ese limite hace fallar a Sheets, asi que se escribe en dos
 * bloques: la parte congelada y el resto.
 */
function pintar_(hoja, filaIni, fondos, notas, ancho) {
  var fc = hoja.getFrozenColumns();
  var n = fondos.length;

  function volcar(colIni, colFin) {
    var ancho2 = colFin - colIni + 1;
    if (ancho2 < 1) return;
    var f = [], t = [];
    for (var i = 0; i < n; i++) {
      f.push(fondos[i].slice(colIni - 1, colFin));
      t.push(notas[i].slice(colIni - 1, colFin));
    }
    var r = hoja.getRange(filaIni, colIni, n, ancho2);
    r.setBackgrounds(f);
    r.setNotes(t);
  }

  if (fc > 0 && fc < ancho) {
    volcar(1, fc);
    volcar(fc + 1, ancho);
  } else {
    volcar(1, ancho);
  }
}
