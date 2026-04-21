import { Product, Category, Brand } from "@/types/store";
import { Battery, Zap, Network, Sun, Server, FileKey, Monitor, Cable } from "lucide-react";
import { createElement } from "react";

import apcLogo from "@/assets/brands/apc.png";
import cdpLogo from "@/assets/brands/cdp.png";
import powestLogo from "@/assets/brands/powest.png";
import hpLogo from "@/assets/brands/hp.png";
import samsungLogo from "@/assets/brands/samsung.png";
import logitechLogo from "@/assets/brands/logitech.png";
import dahuaLogo from "@/assets/brands/dahua.png";
import hikvisionLogo from "@/assets/brands/hikvision.png";
import adataLogo from "@/assets/brands/adata.png";
import aocLogo from "@/assets/brands/aoc.png";
import brotherLogo from "@/assets/brands/brother.png";
import targusLogo from "@/assets/brands/targus.png";
import wattanaLogo from "@/assets/brands/wattana.png";
import geniusLogo from "@/assets/brands/genius.png";
import caixunLogo from "@/assets/brands/caixun.png";
import xkimLogo from "@/assets/brands/xkim.png";
import satLogo from "@/assets/brands/sat.png";
import nstarLogo from "@/assets/brands/3nstar.png";

export const categories: Category[] = [
  { id: "1", slug: "baterias-ups", name: "Baterías Para UPS", description: "Baterías de reemplazo para UPS de todas las marcas", image: "", icon: "🔋", lucideIcon: createElement(Battery, { className: "w-4 h-4" }), productCount: 45 },
  { id: "2", slug: "ups-accesorios", name: "UPS y Accesorios", description: "Sistemas de alimentación ininterrumpida y accesorios", image: "", icon: "⚡", lucideIcon: createElement(Zap, { className: "w-4 h-4" }), productCount: 68 },
  { id: "3", slug: "infraestructura-tic", name: "Infraestructura TIC", description: "Equipos de red, switches, routers y cableado estructurado", image: "", icon: "🌐", lucideIcon: createElement(Network, { className: "w-4 h-4" }), productCount: 52 },
  { id: "4", slug: "energia-solar", name: "Energía Solar", description: "Paneles solares, inversores y sistemas fotovoltaicos", image: "", icon: "☀️", lucideIcon: createElement(Sun, { className: "w-4 h-4" }), productCount: 34 },
  { id: "5", slug: "servidores", name: "Servidores", description: "Servidores rack, torre y accesorios para data center", image: "", icon: "🖥️", lucideIcon: createElement(Server, { className: "w-4 h-4" }), productCount: 28 },
  { id: "6", slug: "licencias", name: "Licencias", description: "Licencias de software Microsoft, Fortinet, Kaspersky", image: "", icon: "📄", lucideIcon: createElement(FileKey, { className: "w-4 h-4" }), productCount: 41 },
  { id: "7", slug: "monitores", name: "Monitores", description: "Monitores LED, IPS y gaming de las mejores marcas", image: "", icon: "🖥️", lucideIcon: createElement(Monitor, { className: "w-4 h-4" }), productCount: 36 },
  { id: "8", slug: "accesorios", name: "Accesorios", description: "Teclados, mouse, cables, adaptadores y más", image: "", icon: "🔌", lucideIcon: createElement(Cable, { className: "w-4 h-4" }), productCount: 89 },
];

export const brands: Brand[] = [
  { id: "1", slug: "apc", name: "APC", logo: apcLogo },
  { id: "2", slug: "cdp", name: "CDP", logo: cdpLogo },
  { id: "3", slug: "powest", name: "Powest", logo: powestLogo },
  { id: "4", slug: "hp", name: "HP", logo: hpLogo },
  { id: "5", slug: "samsung", name: "Samsung", logo: samsungLogo },
  { id: "6", slug: "logitech", name: "Logitech", logo: logitechLogo },
  { id: "7", slug: "epson", name: "Epson", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Epson_logo.svg/512px-Epson_logo.svg.png" },
  { id: "8", slug: "dahua", name: "Dahua", logo: dahuaLogo },
  { id: "9", slug: "hikvision", name: "Hikvision", logo: hikvisionLogo },
  { id: "10", slug: "adata", name: "ADATA", logo: adataLogo },
  { id: "11", slug: "aoc", name: "AOC", logo: aocLogo },
  { id: "12", slug: "brother", name: "Brother", logo: brotherLogo },
  { id: "13", slug: "targus", name: "Targus", logo: targusLogo },
  { id: "14", slug: "wattana", name: "Wattana", logo: wattanaLogo },
  { id: "15", slug: "genius", name: "Genius", logo: geniusLogo },
  { id: "16", slug: "caixun", name: "Caixun", logo: caixunLogo },
  { id: "17", slug: "xkim", name: "Xkim", logo: xkimLogo },
  { id: "18", slug: "microsoft", name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png" },
  { id: "19", slug: "sat", name: "SAT", logo: satLogo },
  { id: "20", slug: "3nstar", name: "3nStar", logo: nstarLogo },
  { id: "21", slug: "dell", name: "Dell", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/512px-Dell_Logo.svg.png" },
  { id: "22", slug: "hpe", name: "HPE", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Hewlett_Packard_Enterprise_logo.svg/512px-Hewlett_Packard_Enterprise_logo.svg.png" },
  { id: "23", slug: "kingston", name: "Kingston", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Kingston_Technology_logo.svg/512px-Kingston_Technology_logo.svg.png" },
  { id: "24", slug: "lenovo", name: "Lenovo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/512px-Lenovo_logo_2015.svg.png" },
  { id: "25", slug: "teltonika", name: "Teltonika", logo: "https://teltonika-networks.com/wp-content/uploads/2022/01/Teltonika-Networks-Logo.png" },
  { id: "26", slug: "vertiv", name: "Vertiv", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vertiv_logo.svg/512px-Vertiv_logo.svg.png" },
];

export const products = [];

export const formatCOP = (price: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const getDiscountPercentage = (price: number, salePrice: number | null): number | null => {
  if (!salePrice || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
};

const PRODUCT_STORAGE_KEY = "netpower-products-v1";

const cloneProduct = (product: Product): Product => ({
  ...product,
  images: Array.isArray(product.images) ? [...product.images] : [],
  specs: { ...(product.specs || {}) },
});

const cloneProducts = (list: Product[]): Product[] => list.map(cloneProduct);

const persistProducts = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
};

const hydrateProducts = () => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    products.splice(0, products.length, ...cloneProducts(parsed as Product[]));
  } catch (error) {
    console.error("No se pudo cargar catálogo persistido:", error);
  }
};

hydrateProducts();

export const findProductById = (productId: string): Product | undefined => {
  return products.find((product) => product.id === productId);
};

export const findProductBySlug = (slug: string): Product | undefined => {
  return products.find((product) => product.slug === slug);
};

export const upsertProduct = (product: Product, matchByName = false): { product: Product; updated: boolean } => {
  const normalizedName = product.name.trim().toLowerCase();
  const existingIndex = products.findIndex((item) =>
    item.id === product.id ||
    item.slug === product.slug ||
    (matchByName && item.name.trim().toLowerCase() === normalizedName)
  );

  if (existingIndex >= 0) {
    const existingId = products[existingIndex].id;
    products[existingIndex] = { ...cloneProduct(product), id: existingId };
    persistProducts();
    return { product: products[existingIndex], updated: true };
  }

  products.push(cloneProduct(product));
  persistProducts();
  return { product: products[products.length - 1], updated: false };
};

export const updateProductById = (productId: string, updates: Partial<Product>): Product | null => {
  const index = products.findIndex((product) => product.id === productId);
  if (index < 0) return null;

  products[index] = {
    ...products[index],
    ...updates,
    id: products[index].id,
    specs: updates.specs ? { ...updates.specs } : products[index].specs,
    images: updates.images ? [...updates.images] : products[index].images,
  };

  persistProducts();
  return products[index];
};

export const setProductActiveState = (productId: string, active: boolean): Product | null => {
  return updateProductById(productId, { active });
};

export const deleteProductById = (productId: string): boolean => {
  const nextProducts = products.filter((product) => product.id !== productId);
  if (nextProducts.length === products.length) return false;

  products.splice(0, products.length, ...nextProducts);
  persistProducts();
  return true;
};

export const decreaseInventory = (soldItems: Array<{ productId: string; quantity: number }>) => {
  let changed = false;

  soldItems.forEach(({ productId, quantity }) => {
    const index = products.findIndex((product) => product.id === productId);
    if (index < 0) return;

    const safeQuantity = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
    const nextStock = Math.max(0, products[index].stock - safeQuantity);

    if (nextStock !== products[index].stock) {
      products[index] = { ...products[index], stock: nextStock };
      changed = true;
    }
  });

  if (changed) persistProducts();
};
