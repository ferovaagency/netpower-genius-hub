// Datos de envío y devolución que acompañan cada Offer del schema Product.
// scripts/prerender.mjs tiene la misma constante (OFERTA_ENVIO): si cambia la
// política, actualizar los dos.
export const OFERTA_ENVIO = {
  // Envío: a todo Colombia, gratis en Bogotá. El costo fuera de Bogotá depende
  // del peso y la zona (legal?tab=envios), así que no se declara una tarifa fija.
  shippingDetails: {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "CO" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 8, unitCode: "DAY" },
    },
  },
  // Devoluciones: se gestionan por garantía; aplica el retracto de ley
  // (5 días hábiles, transporte a cargo del comprador).
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "CO",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 5,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: "https://netpowerit.co/legal?tab=envios",
  },
} as const;
