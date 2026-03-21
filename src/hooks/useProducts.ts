import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/store";

// Convierte snake_case de Supabase → camelCase del tipo Product
const mapRow = (row: any): Product => ({
  id:          row.id,
  slug:        row.slug,
  name:        row.name,
  description: row.description ?? "",
  shortDesc:   row.short_description ?? row.short_desc ?? "",
  price:       Number(row.price),
  salePrice:   row.sale_price ? Number(row.sale_price) : null,
  sku:         row.sku ?? "",
  stock:       row.stock ?? 0,
  images:      row.images ?? [],
  categoryId:  row.category ?? row.category_id ?? "",
  brandId:     row.brand ?? row.brand_id ?? "",
  specs:       row.specs ?? {},
  metaTitle:   row.meta_title ?? "",
  metaDesc:    row.meta_description ?? row.meta_desc ?? "",
  active:      row.active ?? true,
  featured:    row.featured ?? false,
});

// Convierte camelCase del tipo Product → snake_case para Supabase
const mapToRow = (p: Partial<Product>) => ({
  ...(p.slug        !== undefined && { slug:        p.slug }),
  ...(p.name        !== undefined && { name:        p.name }),
  ...(p.description !== undefined && { description: p.description }),
  ...(p.shortDesc   !== undefined && { short_desc:  p.shortDesc }),
  ...(p.price       !== undefined && { price:       p.price }),
  ...(p.salePrice   !== undefined && { sale_price:  p.salePrice }),
  ...(p.sku         !== undefined && { sku:         p.sku }),
  ...(p.stock       !== undefined && { stock:       p.stock }),
  ...(p.images      !== undefined && { images:      p.images }),
  ...(p.categoryId  !== undefined && { category_id: p.categoryId }),
  ...(p.brandId     !== undefined && { brand_id:    p.brandId }),
  ...(p.specs       !== undefined && { specs:       p.specs }),
  ...(p.metaTitle   !== undefined && { meta_title:  p.metaTitle }),
  ...(p.metaDesc    !== undefined && { meta_desc:   p.metaDesc }),
  ...(p.active      !== undefined && { active:      p.active }),
  ...(p.featured    !== undefined && { featured:    p.featured }),
});

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setProducts((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

// ─── Funciones CRUD independientes (para usar fuera del hook) ─────────────────

export async function insertProduct(product: Omit<Product, "id">): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(mapToRow(product))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function upsertProductDB(product: Product): Promise<{ product: Product; updated: boolean }> {
  // Buscar si ya existe por slug o nombre
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .or(`slug.eq.${product.slug},name.ilike.${product.name}`)
    .maybeSingle();

  if (existing?.id) {
    // Actualizar
    const { data, error } = await supabase
      .from("products")
      .update(mapToRow(product))
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { product: mapRow(data), updated: true };
  }

  // Insertar nuevo
  const { data, error } = await supabase
    .from("products")
    .insert(mapToRow(product))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { product: mapRow(data), updated: false };
}

export async function updateProductDB(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(mapToRow(updates))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function deleteProductDB(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function setProductActiveDB(id: string, active: boolean): Promise<Product> {
  return updateProductDB(id, { active });
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}
