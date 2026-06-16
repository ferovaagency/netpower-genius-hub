import { Helmet } from "react-helmet-async";
import { toRawPrice } from "@/lib/utils";


interface SeoHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  isProduct?: boolean;
  productData?: {
    name?: string;
    image?: string;
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
    sku?: string;
  };
}

/**
 * SEO técnico dinámico para SPA.
 * Inyecta title, description, canonical y, opcionalmente, JSON-LD Product (marca Netpower IT).
 */
export default function SeoHead({
  title,
  description,
  canonicalUrl,
  isProduct = false,
  productData,
}: SeoHeadProps) {
  const productJsonLd = isProduct
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: productData?.name ?? title,
        description,
        image: productData?.image,
        sku: productData?.sku,
        brand: {
          "@type": "Brand",
          name: "Netpower IT",
        },
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: productData?.priceCurrency ?? "COP",
          price: toRawPrice(productData?.price),
          availability: productData?.availability ?? "https://schema.org/InStock",
          areaServed: "CO",
        },
      }
    : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content={isProduct ? "product" : "website"} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {productJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
