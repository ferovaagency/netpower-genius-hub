export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc: string;
  price: number;
  salePrice: number | null;
  sku: string;
  stock: number;
  images: string[];
  categoryId: string;
  brandId: string;
  specs: Record<string, string>;
  metaTitle: string;
  metaDesc: string;
  active: boolean;
  featured: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  lucideIcon?: React.ReactNode;
  productCount: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
