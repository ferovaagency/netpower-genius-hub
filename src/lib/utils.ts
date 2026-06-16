import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza cualquier precio a número crudo sin formato.
 * Acepta números o strings con símbolos de moneda, separadores de miles
 * colombianos (puntos) y decimales (coma), y devuelve un número puro.
 * Ejemplo: "$25.000.000" → 25000000
 */
export function toRawPrice(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = value
    .toString()
    .trim()
    .replace(/[\$\s]/g, "") // elimina $ y espacios
    .replace(/\./g, "") // elimina puntos (separadores de miles en COP)
    .replace(/,/g, "."); // coma decimal → punto decimal

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

