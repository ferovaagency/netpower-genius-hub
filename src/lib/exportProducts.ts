// Descarga del catálogo a Excel desde el admin.
// Usa la librería xlsx que el proyecto ya tiene instalada: sin dependencias nuevas.
import * as XLSX from "xlsx";

export type ProductoExport = {
  name: string;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  sale_price?: number | null;
  stock?: number | null;
  active?: boolean | null;
  slug: string;
};

const SITIO = "https://netpowerit.co";

export function descargarCatalogo(productos: ProductoExport[], sufijo = "") {
  const filas = productos.map((p) => ({
    Nombre: p.name,
    SKU: p.sku ?? "",
    Marca: p.brand ?? "",
    Categoría: p.category ?? "",
    "Precio (COP)": p.sale_price || p.price || 0,
    Stock: p.stock ?? 0,
    Estado: p.active ? "Activo" : "Inactivo",
    URL: `${SITIO}/producto/${p.slug}`,
  }));

  const ws = XLSX.utils.json_to_sheet(filas);
  ws["!cols"] = [
    { wch: 70 }, { wch: 20 }, { wch: 16 }, { wch: 22 },
    { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 58 },
  ];
  ws["!autofilter"] = { ref: `A1:H${filas.length + 1}` };
  ws["!freeze"] = { xSplit: "0", ySplit: "1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `netpowerit-productos${sufijo}-${fecha}.xlsx`);
}
