/**
 * Inventario Central Netpower IT — comparador de listas de actualización.
 *
 * Pinta la pestaña activa (la lista nueva del proveedor) y la pestaña
 * Inventario, cruzando por NOMBRE entre las dos:
 *   ROJO en la lista       = ese producto no está en Inventario.
 *   AMARILLO en Inventario = sí está, pero la lista trae otro precio o stock.
 *   Sin color              = está y coincide.
 *
 * El cruce es por similitud de bigramas (coeficiente de Dice), el mismo
 * criterio de All For All. Por debajo de MIN_SIMILITUD se considera que no
 * existe. Antes de comparar se prefiltra por palabras compartidas, para que
 * una lista de 1000 filas contra 1000 productos no se pase de los 6 minutos
 * que Apps Script le da a una ejecución.
 *
 * Este script NO escribe nada: solo pinta. La web no participa; la subida de
 * stock y precio la hace el botón Sincronizar del admin, cruzando por SKU.
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
    .addItem('Comparar esta pestaña ahora', 'compararPestanaActiva')
    .addItem('Quitar colores', 'limpiarColores')
    .addSeparator()
    .addItem('Activar pintado automático', 'activarPintadoAutomatico')
    .addItem('Desactivar pintado automático', 'desactivarPintadoAutomatico')
    .addSeparator()
    .addItem('Configurar conexión', 'configurarConexion')
    .addToUi();
}

/* ───────────────────────── pintado automático ───────────────────────────── */

/**
 * Se dispara con cada edición de la hoja. Es un trigger instalable (no el
 * onEdit simple) porque el simple corta a los 30 segundos y una lista larga
 * no alcanza a terminar.
 */
function alEditar(e) {
  if (!e || !e.range) return;
  var ss = SpreadsheetApp.getActive();
  var hoja = e.range.getSheet();
  var maestra = hojaMaestra_(ss);

  if (maestra && hoja.getSheetId() === maestra.getSheetId()) {
    // Tocar Inventario tambien tiene que repintar: si le ponés el precio nuevo
    // a mano, el amarillo se tiene que ir. Se recompara contra la ultima lista.
    var ultima = PropertiesService.getDocumentProperties().getProperty('ULTIMA_LISTA');
    hoja = ultima ? ss.getSheetByName(ultima) : null;
    if (!hoja) return;
  } else {
    var valores = hoja.getDataRange().getValues();
    if (valores.length < 2) return;
    var enc = ubicarEncabezado_(valores);
    // Si la pestaña no tiene columna de nombre, no es una lista de actualización.
    if (buscarColumna_(valores[enc], /(descripcion|descripción|nombre|producto)/i) < 0) return;
    // Una edición dentro del encabezado no cambia nada que comparar.
    if (e.range.getLastRow() <= enc + 1) return;
  }

  // Si ya hay una corrida en curso, esta se descarta: la siguiente edición
  // vuelve a lanzarla y el resultado es el mismo.
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) return;

  var ss = SpreadsheetApp.getActive();
  try {
    ss.toast('Comparando con Inventario...', 'NetPower', 30);
    var r = comparar_(hoja);
    if (r.error) { ss.toast(r.error, 'NetPower', 8); return; }
    ss.toast('Rojo ' + r.rojo + ' · Amarillo ' + r.amarillo + ' · Igual ' + r.igual,
             'NetPower', 8);
  } catch (err) {
    ss.toast('Falló la comparación: ' + err.message, 'NetPower', 10);
  } finally {
    lock.releaseLock();
  }
}

function activarPintadoAutomatico() {
  var ui = SpreadsheetApp.getUi();
  desactivarTriggers_();
  ScriptApp.newTrigger('alEditar')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  ui.alert('Pintado automático activado.\n\n' +
           'Cada vez que pegues o edites una lista, se compara sola contra ' +
           'Inventario y se repintan las dos pestañas. Tarda unos segundos; ' +
           'mientras corre aparece un aviso abajo a la derecha.');
}

function desactivarPintadoAutomatico() {
  var n = desactivarTriggers_();
  SpreadsheetApp.getUi().alert(n
    ? 'Pintado automático desactivado. Ahora hay que usar "Comparar esta pestaña ahora".'
    : 'No estaba activado.');
}

function desactivarTriggers_() {
  var t = ScriptApp.getProjectTriggers();
  var n = 0;
  for (var i = 0; i < t.length; i++) {
    if (t[i].getHandlerFunction() === 'alEditar') { ScriptApp.deleteTrigger(t[i]); n++; }
  }
  return n;
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

/** Como se llama la pestaña maestra. Si la renombran, igual se encuentra. */
var HOJA_INVENTARIO = 'Inventario';

/**
 * Ubica la pestaña maestra sin depender del nombre exacto: primero el nombre
 * de arriba, despues cualquiera que empiece por "inventario", y al final la
 * primera que tenga columnas de SKU y de Slug.
 */
function hojaMaestra_(ss) {
  var exacta = ss.getSheetByName(HOJA_INVENTARIO);
  if (exacta) return exacta;

  var hojas = ss.getSheets();
  var i;
  for (i = 0; i < hojas.length; i++) {
    if (/^\s*inventario/i.test(hojas[i].getName())) return hojas[i];
  }
  for (i = 0; i < hojas.length; i++) {
    var v = hojas[i].getDataRange().getValues();
    if (!v.length) continue;
    var enc = v[ubicarEncabezado_(v)];
    if (buscarColumna_(enc, /sku/i) >= 0 && buscarColumna_(enc, /slug/i) >= 0) return hojas[i];
  }
  return null;
}

/**
 * Compara la pestaña activa (la lista nueva del proveedor) contra la pestaña
 * Inventario, cruzando por nombre.
 *
 *   ROJO en la lista  = ese producto no está en Inventario. Hay que crearlo.
 *   AMARILLO en Inventario = ese producto sí está, pero la lista trae otro
 *                            precio o stock.
 *
 * La web no participa: esto es solo entre las dos pestañas.
 */
function comparar_(hoja) {
  var ss = SpreadsheetApp.getActive();

  var inv = hojaMaestra_(ss);
  if (!inv) return { error: 'No encontré la pestaña del inventario. Debe llamarse "Inventario" o empezar por esa palabra.' };
  if (hoja.getSheetId() === inv.getSheetId()) {
    return { error: 'Parate en la pestaña de la lista nueva, no en "' + inv.getName() + '".' };
  }

  // ── la lista nueva ───────────────────────────────────────────────────────
  var vLis = hoja.getDataRange().getValues();
  if (vLis.length < 2) return { error: 'Esta pestaña está vacía.' };

  var encLisFila = ubicarEncabezado_(vLis);
  var encLis = vLis[encLisFila];
  var anchoLis = encLis.length;

  var lNombre = buscarColumna_(encLis, /(descripcion|descripción|nombre|producto)/i);
  if (lNombre < 0) {
    return { error: 'No encontré la columna del nombre. Debe llamarse Descripción, Nombre o Producto.' };
  }
  // Orden de preferencia para el precio de la lista: el de venta, si no el que
  // ya trae el margen (+20%), y solo al final cualquier columna 'precio',
  // porque 'Precio lista' es el de compra y no es lo que va a la web.
  var lPrecio = buscarColumna_(encLis, /precio\s*(de\s*)?venta/i);
  if (lPrecio < 0) lPrecio = buscarColumna_(encLis, /\+\s*20|mas\s*20/i);
  if (lPrecio < 0) lPrecio = buscarColumna_(encLis, /precio/i);
  var lStock = buscarColumna_(encLis, /(stock|cantidad|existencia|disponible)/i);

  // ── el inventario ────────────────────────────────────────────────────────
  var vInv = inv.getDataRange().getValues();
  var encInvFila = ubicarEncabezado_(vInv);
  var encInv = vInv[encInvFila];
  var anchoInv = encInv.length;

  var iNombre = buscarColumna_(encInv, /(nombre|descripcion|descripción|producto)/i);
  if (iNombre < 0) return { error: 'No encontré la columna del nombre en la pestaña Inventario.' };
  var iPrecio = buscarColumna_(encInv, /precio\s*(de\s*)?venta/i);
  if (iPrecio < 0) iPrecio = buscarColumna_(encInv, /precio/i);
  var iStock = buscarColumna_(encInv, /(stock|cantidad|existencia|disponible)/i);
  var iSku = buscarColumna_(encInv, /sku/i);

  // Índice del inventario: bigramas precalculados y un invertido por palabra.
  var indice = [];
  var porToken = {};
  for (var f = encInvFila + 1; f < vInv.length; f++) {
    var nom = String(vInv[f][iNombre] || '').trim();
    if (!nom) continue;
    var norm = normalizar_(nom);
    var pos = indice.length;
    indice.push({ fila: f, nombre: nom, norm: norm, bg: bigramas_(norm) });
    var tk = tokens_(norm);
    for (var t = 0; t < tk.length; t++) (porToken[tk[t]] = porToken[tk[t]] || []).push(pos);
  }

  if (!indice.length) return { error: 'La pestaña Inventario no tiene productos.' };

  // ── comparar ─────────────────────────────────────────────────────────────
  var priLis = encLisFila + 1;
  var totLis = vLis.length - priLis;
  var fondosLis = [], notasLis = [];

  var priInv = encInvFila + 1;
  var totInv = vInv.length - priInv;
  var fondosInv = [], notasInv = [];
  for (var k = 0; k < totInv; k++) {
    fondosInv.push(repetir_(BLANCO, anchoInv));
    notasInv.push(repetir_('', anchoInv));
  }

  var usados = {};
  var nRojo = 0, nAmarillo = 0, nIgual = 0, nVacio = 0;

  for (var f2 = priLis; f2 < vLis.length; f2++) {
    var nombreLis = String(vLis[f2][lNombre] || '').trim();

    if (!nombreLis) {
      fondosLis.push(repetir_(BLANCO, anchoLis));
      notasLis.push(repetir_('', anchoLis));
      nVacio++;
      continue;
    }

    var nm = normalizar_(nombreLis);

    // Prefiltro por palabras compartidas: sin esto son cientos de miles de
    // comparaciones y Apps Script corta a los 6 minutos.
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
    if (!candidatos.length && nm.length <= 25) {
      candidatos = [];
      for (var q = 0; q < indice.length; q++) candidatos.push(q);
    }

    var mejor = null, punt = 0;
    for (var c2 = 0; c2 < candidatos.length; c2++) {
      var it = indice[candidatos[c2]];
      if (usados[it.fila]) continue;
      var s = dice_(it.bg, nm);
      if (s > punt) { punt = s; mejor = it; }
    }

    if (!mejor || punt < MIN_SIMILITUD) {
      fondosLis.push(repetir_(ROJO, anchoLis));
      notasLis.push(ponerNotaEn_(
        'No está en la pestaña Inventario. Hay que crearlo y asignarle SKU.',
        anchoLis, lNombre));
      nRojo++;
      continue;
    }

    usados[mejor.fila] = true;

    var precioLis = lPrecio >= 0 ? aNumero_(vLis[f2][lPrecio]) : null;
    var stockLis = lStock >= 0 ? aNumero_(vLis[f2][lStock]) : null;
    var precioInv = iPrecio >= 0 ? (aNumero_(vInv[mejor.fila][iPrecio]) || 0) : 0;
    var stockInv = iStock >= 0 ? (aNumero_(vInv[mejor.fila][iStock]) || 0) : 0;

    var cambios = [];
    if (precioLis !== null && iPrecio >= 0 && Math.round(precioLis) !== Math.round(precioInv)) {
      cambios.push('Precio: ' + Math.round(precioInv) + ' -> ' + Math.round(precioLis));
    }
    if (stockLis !== null && iStock >= 0 && Math.round(stockLis) !== Math.round(stockInv)) {
      cambios.push('Stock: ' + Math.round(stockInv) + ' -> ' + Math.round(stockLis));
    }

    // La lista solo lleva rojo. Lo que cambia se marca en Inventario.
    fondosLis.push(repetir_(BLANCO, anchoLis));
    notasLis.push(ponerNotaEn_(
      'Inventario fila ' + (mejor.fila + 1) + ': ' + mejor.nombre +
      ' (' + Math.round(punt * 100) + '%)' +
      (cambios.length ? '\n' + cambios.join('\n') : '\nSin cambios.'),
      anchoLis, lNombre));

    if (cambios.length) {
      fondosInv[mejor.fila - priInv] = repetir_(AMARILLO, anchoInv);
      notasInv[mejor.fila - priInv] = ponerNotaEn_(
        'Lista "' + hoja.getName() + '", fila ' + (f2 + 1) + ':\n' + nombreLis +
        '\n' + cambios.join('\n'),
        anchoInv, iNombre);
      nAmarillo++;
    } else {
      nIgual++;
    }
  }

  // ── volcar ───────────────────────────────────────────────────────────────
  if (totLis > 0) pintar_(hoja, priLis + 1, fondosLis, notasLis, anchoLis);
  if (totInv > 0) pintar_(inv, priInv + 1, fondosInv, notasInv, anchoInv);

  // Se recuerda cual fue la ultima lista comparada, para poder repintar
  // cuando la edicion ocurre del lado de Inventario.
  PropertiesService.getDocumentProperties().setProperty('ULTIMA_LISTA', hoja.getName());

  return {
    hoja: hoja.getName(),
    rojo: nRojo,
    amarillo: nAmarillo,
    igual: nIgual,
    vacias: nVacio,
    columnaPrecio: lPrecio >= 0 ? String(encLis[lPrecio]) : '',
    hayStock: lStock >= 0,
    productos: indice.length
  };
}

/** Lo que dispara el menú: compara y muestra el resumen. */
function compararPestanaActiva() {
  var ui = SpreadsheetApp.getUi();
  var r = comparar_(SpreadsheetApp.getActiveSheet());

  if (r.error) { ui.alert(r.error); return; }

  ui.alert(
    'Comparación lista\n\n' +
    'Rojo en "' + r.hoja + '" (no están en Inventario): ' + r.rojo + '\n' +
    'Amarillo en Inventario (cambió precio o stock): ' + r.amarillo + '\n' +
    'Sin cambios: ' + r.igual + '\n' +
    (r.vacias ? 'Filas sin nombre: ' + r.vacias + '\n' : '') +
    '\nColumna de precio usada en la lista: ' + (r.columnaPrecio || 'ninguna') + '\n' +
    'Inventario leído: ' + r.productos + ' productos.\n' +
    (r.hayStock ? '' : 'Esta lista no tiene columna de stock, así que solo se comparó el precio.\n') +
    '\nPasá el cursor sobre el nombre para ver el detalle de cada fila.'
  );
}

/**
 * Quita colores y notas de la pestana activa y de Inventario, sin tocar la
 * fila de encabezado: su formato es de la hoja, no del comparador.
 */
function limpiarColores() {
  var ss = SpreadsheetApp.getActive();
  var hoja = SpreadsheetApp.getActiveSheet();
  var nombres = [];

  function limpiar(h) {
    var r = h.getDataRange();
    var enc = ubicarEncabezado_(r.getValues());
    var desde = enc + 2;
    var filas = h.getLastRow() - desde + 1;
    if (filas < 1) return;
    var rr = h.getRange(desde, 1, filas, h.getLastColumn());
    rr.setBackground(null);
    rr.clearNote();
    nombres.push(h.getName());
  }

  limpiar(hoja);
  var inv = hojaMaestra_(ss);
  if (inv && inv.getSheetId() !== hoja.getSheetId()) limpiar(inv);

  SpreadsheetApp.getUi().alert('Listo, quite los colores y las notas de: ' + nombres.join(' y ') + '.');
}

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
