import * as XLSX from "xlsx";
import { getParentCategory } from "@/lib/catalog";

export interface BulkImportRow {
  rowNumber: number;
  name: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  brand?: string;
  category?: string;
  imageUrl?: string;
  sku?: string;
  notes?: string;
}

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const FIELD_ALIASES: Record<string, keyof Omit<BulkImportRow, "rowNumber">> = {
  name: "name",
  nombre: "name",
  product_name: "name",
  producto: "name",
  description: "description",
  descripcion: "description",
  short_description: "shortDescription",
  descripcion_corta: "shortDescription",
  short_desc: "shortDescription",
  price: "price",
  precio: "price",
  brand: "brand",
  marca: "brand",
  category: "category",
  categoria: "category",
  image_url: "imageUrl",
  imagen: "imageUrl",
  image: "imageUrl",
  sku: "sku",
  referencia: "sku",
  notes: "notes",
  nota: "notes",
  notas: "notes",
  observaciones: "notes",
};

const parsePrice = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const numeric = Number(value.replace(/[^0-9.,-]/g, "").replace(/\.(?=.*\.)/g, "").replace(/,/g, "."));
  return Number.isFinite(numeric) ? numeric : undefined;
};

const mapRawRows = (rows: Record<string, unknown>[]) => {
  return rows
    .map((rawRow, index) => {
      const mapped: Partial<BulkImportRow> = { rowNumber: index + 2 };

      Object.entries(rawRow).forEach(([rawHeader, rawValue]) => {
        const alias = FIELD_ALIASES[normalizeHeader(rawHeader)];
        if (!alias) return;

        if (alias === "price") {
          mapped.price = parsePrice(rawValue);
          return;
        }

        const text = String(rawValue ?? "").trim();
        if (!text) return;
        mapped[alias] = text as never;
      });

      return mapped as BulkImportRow;
    })
    .filter((row) => row.name?.trim());
};

const parseCsv = async (file: File) => {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: "string" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
};

const parseSpreadsheet = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
};

export const parseBulkImportFile = async (file: File): Promise<BulkImportRow[]> => {
  const lowerName = file.name.toLowerCase();
  const rawRows = lowerName.endsWith(".csv") ? await parseCsv(file) : await parseSpreadsheet(file);
  const mappedRows = mapRawRows(rawRows);

  if (mappedRows.length === 0) {
    throw new Error("No se encontraron filas válidas con la columna name o nombre");
  }

  return mappedRows;
};

export const inferCategoryForBulkProduct = (row: BulkImportRow) => {
  return getParentCategory(row.category);
};
