/**
 * Inventario Central Netpower IT — comparador de listas de actualización.
 *
 * Qué hace: lee el catálogo real de netpowerit.co y pinta la pestaña activa.
 *   ROJO     = ese producto NO existe en la web. No se crea solo; hay que
 *              crearlo a mano desde el generador de fichas, para no duplicar
 *              URLs que ya están indexadas.
 *   AMARILLO = ya existe en la web, pero cambió el precio o el stock.
 *   Sin color = ya existe y está igual.
 *
 * El cruce es por NOMBRE, con similitud de bigramas (mismo criterio que usa
 * All For All). Por debajo de MIN_SIMILITUD se considera que no existe.
 *
 * ── ANTES DE USARLO: pega estos dos valores ──────────────────────────────
 * Están en el archivo .env del repo, como VITE_SUPABASE_URL y
 * VITE_SUPABASE_PUBLISHABLE_KEY. Son los mismos que ya viajan en la web
 * pública, no son claves privadas.
 */
var SUPABASE_URL = 'PEGA_AQUI_LA_URL';   // https://xxxxxxxx.supabase.co
var SUPABASE_KEY = 'PEGA_AQUI_LA_CLAVE'; // la publishable / anon

/** Por debajo de esto, se considera que el producto no existe en la web. */
var MIN_SIMILITUD = 0.72;

var ROJO = '#ffc7ce';
var AMARILLO = '#fff2cc';
var BLANCO = '#ffffff';

/** Menú propio al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NetPower')
    .addItem('Comparar esta pestaña con la web', 'compararPestanaActiva')
    .addItem('Quitar colores de esta pestaña', 'limpiarColores')
    .addToUi();
}

/* ─────────────────────────── catálogo de la web ─────────────────────────── */

/** Trae los productos activos de la web, paginando de a 1000. */
function traerCatalogo_() {
  if (SUPABASE_URL.indexOf('PEGA_AQUI') === 0 || SUPABASE_KEY.indexOf('PEGA_AQUI') === 0) {
    throw new Error('Falta pegar SUPABASE_URL y SUPABASE_KEY arriba en el script.');
  }

  var columnas = 'name,slug,price,sale_price,stock,sku,active';
  var todos = [];
  var desde = 0;

  while (true) {
    var res = UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/products?select=' + columnas + '&active=eq.true&order=name.asc',
      {
        method: 'get',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY,
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

/** Bigramas -> coeficiente de Dice, 0 a 1. */
function similitud_(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  var A = {}, nA = 0, i;
  for (i = 0; i < a.length - 1; i++) { var x = a.substr(i, 2); A[x] = (A[x] || 0) + 1; nA++; }
  var inter = 0, nB = 0;
  for (i = 0; i < b.length - 1; i++) {
    var y = b.substr(i, 2);
    nB++;
    if (A[y] > 0) { A[y]--; inter++; }
  }
  return (2 * inter) / ((nA + nB) || 1);
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

/** Busca el encabezado: la primera fila que tenga algo parecido a un nombre de producto. */
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

/* ─────────────────────────────── acciones ───────────────────────────────── */

function compararPestanaActiva() {
  var ui = SpreadsheetApp.getUi();
  var hoja = SpreadsheetApp.getActiveSheet();
  var rango = hoja.getDataRange();
  var valores = rango.getValues();

  if (valores.length < 2) { ui.alert('Esta pestaña está vacía.'); return; }

  var filaEnc = ubicarEncabezado_(valores);
  var encabezados = valores[filaEnc];

  var iNombre = buscarColumna_(encabezados, /(descripcion|descripción|nombre|producto)/i);
  var iPrecio = buscarColumna_(encabezados, /precio de venta/i);
  if (iPrecio < 0) iPrecio = buscarColumna_(encabezados, /precio/i);
  var iStock = buscarColumna_(encabezados, /(stock|cantidad|existencia|disponible)/i);

  if (iNombre < 0) {
    ui.alert('No encontré la columna del nombre. Debe llamarse Descripción, Nombre o Producto.');
    return;
  }

  var catalogo = traerCatalogo_();
  var indice = catalogo.map(function (p) {
    return { p: p, norm: normalizar_(p.name) };
  });

  var primera = filaEnc + 1;
  var total = valores.length - primera;
  var fondos = [];
  var notas = [];
  var usados = {};
  var nRojo = 0, nAmarillo = 0, nIgual = 0;

  for (var f = primera; f < valores.length; f++) {
    var nombreHoja = String(valores[f][iNombre] || '').trim();
    var ancho = encabezados.length;

    if (!nombreHoja) {
      fondos.push(repetir_(BLANCO, ancho));
      notas.push(repetir_('', ancho));
      continue;
    }

    var nm = normalizar_(nombreHoja);
    var mejor = null, punt = 0;
    for (var i = 0; i < indice.length; i++) {
      if (usados[indice[i].p.slug]) continue;
      var s = similitud_(nm, indice[i].norm);
      if (s > punt) { punt = s; mejor = indice[i].p; }
    }

    var color = BLANCO, nota = '';

    if (!mejor || punt < MIN_SIMILITUD) {
      color = ROJO;
      nota = 'No existe en la web. Hay que crearlo a mano en el generador de fichas.';
      nRojo++;
    } else {
      usados[mejor.slug] = true;
      var precioHoja = iPrecio >= 0 ? aNumero_(valores[f][iPrecio]) : null;
      var stockHoja = iStock >= 0 ? aNumero_(valores[f][iStock]) : null;
      var precioWeb = aNumero_(mejor.sale_price) || aNumero_(mejor.price) || 0;
      var stockWeb = aNumero_(mejor.stock) || 0;

      var cambios = [];
      if (precioHoja !== null && Math.round(precioHoja) !== Math.round(precioWeb)) {
        cambios.push('Precio: web ' + precioWeb + ' -> lista ' + Math.round(precioHoja));
      }
      if (stockHoja !== null && Math.round(stockHoja) !== Math.round(stockWeb)) {
        cambios.push('Stock: web ' + stockWeb + ' -> lista ' + Math.round(stockHoja));
      }

      if (cambios.length) {
        color = AMARILLO;
        nAmarillo++;
      } else {
        nIgual++;
      }
      nota = 'Web: ' + mejor.name + ' (' + Math.round(punt * 100) + '%)' +
             (cambios.length ? '\n' + cambios.join('\n') : '\nSin cambios.');
    }

    fondos.push(repetir_(color, ancho));
    notas.push(ponerNotaEn_(nota, ancho, iNombre));
  }

  if (total > 0) {
    var destino = hoja.getRange(primera + 1, 1, total, encabezados.length);
    destino.setBackgrounds(fondos);
    destino.setNotes(notas);
  }

  ui.alert(
    'Comparación lista\n\n' +
    'Rojo (no existen en la web): ' + nRojo + '\n' +
    'Amarillo (cambió precio o stock): ' + nAmarillo + '\n' +
    'Sin cambios: ' + nIgual + '\n\n' +
    'Catálogo leído: ' + catalogo.length + ' productos activos.\n' +
    'Pasa el cursor sobre el nombre para ver el detalle de cada fila.'
  );
}

function limpiarColores() {
  var hoja = SpreadsheetApp.getActiveSheet();
  var r = hoja.getDataRange();
  r.setBackground(null);
  r.clearNote();
  SpreadsheetApp.getUi().alert('Colores y notas quitados de "' + hoja.getName() + '".');
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
