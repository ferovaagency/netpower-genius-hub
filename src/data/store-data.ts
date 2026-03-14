import { Product, Category, Brand } from "@/types/store";

export const categories: Category[] = [
  { id: "1", slug: "baterias-ups", name: "Baterías Para UPS", description: "Baterías de reemplazo para UPS de todas las marcas", image: "", icon: "🔋", productCount: 45 },
  { id: "2", slug: "ups-accesorios", name: "UPS y Accesorios", description: "Sistemas de alimentación ininterrumpida y accesorios", image: "", icon: "⚡", productCount: 68 },
  { id: "3", slug: "infraestructura-tic", name: "Infraestructura TIC", description: "Equipos de red, switches, routers y cableado estructurado", image: "", icon: "🌐", productCount: 52 },
  { id: "4", slug: "energia-solar", name: "Energía Solar", description: "Paneles solares, inversores y sistemas fotovoltaicos", image: "", icon: "☀️", productCount: 34 },
  { id: "5", slug: "servidores", name: "Servidores", description: "Servidores rack, torre y accesorios para data center", image: "", icon: "🖥️", productCount: 28 },
  { id: "6", slug: "licencias", name: "Licencias", description: "Licencias de software Microsoft, Fortinet, Kaspersky", image: "", icon: "📄", productCount: 41 },
  { id: "7", slug: "monitores", name: "Monitores", description: "Monitores LED, IPS y gaming de las mejores marcas", image: "", icon: "🖥️", productCount: 36 },
  { id: "8", slug: "accesorios", name: "Accesorios", description: "Teclados, mouse, cables, adaptadores y más", image: "", icon: "🔌", productCount: 89 },
];

export const brands: Brand[] = [
  { id: "1", slug: "apc", name: "APC", logo: "" },
  { id: "2", slug: "cdp", name: "CDP", logo: "" },
  { id: "3", slug: "powest", name: "Powest", logo: "" },
  { id: "4", slug: "hp", name: "HP", logo: "" },
  { id: "5", slug: "samsung", name: "Samsung", logo: "" },
  { id: "6", slug: "logitech", name: "Logitech", logo: "" },
  { id: "7", slug: "epson", name: "Epson", logo: "" },
  { id: "8", slug: "dahua", name: "Dahua", logo: "" },
  { id: "9", slug: "hikvision", name: "Hikvision", logo: "" },
  { id: "10", slug: "adata", name: "ADATA", logo: "" },
  { id: "11", slug: "aoc", name: "AOC", logo: "" },
  { id: "12", slug: "brother", name: "Brother", logo: "" },
  { id: "13", slug: "targus", name: "Targus", logo: "" },
  { id: "14", slug: "wattana", name: "Wattana", logo: "" },
];

export const products: Product[] = [
  {
    id: "1", slug: "ups-apc-back-1500va", name: "UPS APC Back-UPS 1500VA 120V",
    description: "El Back-UPS™ de APC proporciona energía de reserva de la batería en el hogar y en la oficina durante cortes y fluctuaciones del suministro eléctrico.",
    shortDesc: "UPS interactivo 1500VA / 900W con regulador automático de voltaje",
    price: 489900, salePrice: 429900, sku: "BX1500M-LM60", stock: 15,
    images: [], categoryId: "2", brandId: "1",
    specs: { "Potencia": "1500VA / 900W", "Voltaje": "120V", "Autonomía": "10 min carga completa", "Tomas": "6 con batería + 4 solo protección", "Tipo": "Interactivo", "Conexión": "NEMA 5-15P" },
    metaTitle: "UPS APC Back-UPS 1500VA – Precio en Colombia | NetPower IT",
    metaDesc: "Compra el UPS APC Back-UPS 1500VA 120V al mejor precio en Colombia. Protege tus equipos con garantía oficial APC. Envío a todo el país.",
    active: true, featured: true
  },
  {
    id: "2", slug: "ups-cdp-r-smart-2000va", name: "UPS CDP R-Smart 2000VA Online",
    description: "UPS online de doble conversión CDP R-Smart con factor de potencia 0.9, ideal para servidores y equipos críticos.",
    shortDesc: "UPS online doble conversión 2000VA / 1800W para servidores",
    price: 1890000, salePrice: null, sku: "RSMART-2000", stock: 8,
    images: [], categoryId: "2", brandId: "2",
    specs: { "Potencia": "2000VA / 1800W", "Tipo": "Online doble conversión", "Voltaje E/S": "110/120V", "Autonomía": "6 min carga completa", "Factor potencia": "0.9", "Pantalla": "LCD" },
    metaTitle: "UPS CDP R-Smart 2000VA Online – Precio Colombia | NetPower IT",
    metaDesc: "UPS CDP R-Smart 2000VA online doble conversión. Protección para servidores y equipos críticos. Distribuidor autorizado en Colombia.",
    active: true, featured: true
  },
  {
    id: "3", slug: "bateria-ups-12v-9ah", name: "Batería para UPS 12V 9Ah Sellada",
    description: "Batería de reemplazo sellada de plomo ácido 12V 9Ah, compatible con la mayoría de UPS del mercado.",
    shortDesc: "Batería sellada 12V 9Ah compatible con UPS APC, CDP, Powest",
    price: 89900, salePrice: 74900, sku: "BAT-12V9AH", stock: 120,
    images: [], categoryId: "1", brandId: "14",
    specs: { "Voltaje": "12V", "Capacidad": "9Ah", "Tipo": "Plomo ácido sellada (AGM)", "Dimensiones": "151 x 65 x 94 mm", "Peso": "2.5 kg", "Vida útil": "3-5 años" },
    metaTitle: "Batería UPS 12V 9Ah – Comprar en Colombia | NetPower IT",
    metaDesc: "Batería de reemplazo para UPS 12V 9Ah sellada AGM. Compatible con APC, CDP, Powest. Envío a toda Colombia.",
    active: true, featured: true
  },
  {
    id: "4", slug: "switch-dahua-24-puertos-poe", name: "Switch Dahua 24 Puertos PoE Gigabit",
    description: "Switch gestionable Dahua de 24 puertos PoE Gigabit + 4 SFP, ideal para redes de videovigilancia y empresariales.",
    shortDesc: "Switch PoE 24 puertos Gigabit + 4 SFP, 370W PoE budget",
    price: 1250000, salePrice: 1099000, sku: "DH-PFS4226-24GT-370", stock: 5,
    images: [], categoryId: "3", brandId: "8",
    specs: { "Puertos": "24x GE PoE + 4x SFP", "PoE Budget": "370W", "Gestión": "L2 Gestionable", "Capacidad switching": "56 Gbps", "MAC Table": "16K", "Montaje": "Rack 1U" },
    metaTitle: "Switch Dahua 24 Puertos PoE Gigabit – Colombia | NetPower IT",
    metaDesc: "Switch Dahua 24 puertos PoE Gigabit gestionable. 370W PoE budget para CCTV y redes. Precio Colombia.",
    active: true, featured: true
  },
  {
    id: "5", slug: "monitor-samsung-24-fhd", name: "Monitor Samsung 24\" FHD IPS 75Hz",
    description: "Monitor Samsung de 24 pulgadas con panel IPS, resolución Full HD 1920x1080 y frecuencia de refresco de 75Hz.",
    shortDesc: "Monitor 24\" IPS FHD 75Hz con modo Eye Saver",
    price: 549000, salePrice: 499000, sku: "LF24T350FHLXZL", stock: 22,
    images: [], categoryId: "7", brandId: "5",
    specs: { "Tamaño": "24 pulgadas", "Panel": "IPS", "Resolución": "1920x1080 (FHD)", "Frecuencia": "75Hz", "Tiempo respuesta": "5ms", "Conectividad": "HDMI, VGA" },
    metaTitle: "Monitor Samsung 24\" FHD IPS – Precio Colombia | NetPower IT",
    metaDesc: "Monitor Samsung 24 pulgadas Full HD IPS 75Hz. Ideal para oficina y hogar. Compra con envío a toda Colombia.",
    active: true, featured: true
  },
  {
    id: "6", slug: "servidor-hp-proliant-ml30", name: "Servidor HP ProLiant ML30 Gen10 Plus",
    description: "Servidor torre HP ProLiant ML30 Gen10 Plus con procesador Intel Xeon, ideal para PYMES.",
    shortDesc: "Servidor torre Intel Xeon E-2314, 16GB RAM, 1TB HDD",
    price: 4890000, salePrice: null, sku: "P44718-001", stock: 3,
    images: [], categoryId: "5", brandId: "4",
    specs: { "Procesador": "Intel Xeon E-2314 2.8GHz", "RAM": "16GB DDR4 ECC", "Almacenamiento": "1TB SATA 7.2K", "Factor forma": "Torre 4U", "Fuente": "350W", "SO": "Sin sistema operativo" },
    metaTitle: "Servidor HP ProLiant ML30 Gen10 – Colombia | NetPower IT",
    metaDesc: "Servidor HP ProLiant ML30 Gen10 Plus Xeon E-2314 16GB. Ideal para PYMES. Distribuidor HP autorizado en Colombia.",
    active: true, featured: true
  },
  {
    id: "7", slug: "panel-solar-550w-monocristalino", name: "Panel Solar 550W Monocristalino",
    description: "Panel solar monocristalino de alta eficiencia 550W, ideal para instalaciones residenciales y comerciales.",
    shortDesc: "Panel solar mono PERC 550W, eficiencia 21.3%",
    price: 890000, salePrice: 799000, sku: "PS-550W-MONO", stock: 30,
    images: [], categoryId: "4", brandId: "14",
    specs: { "Potencia": "550W", "Tipo": "Monocristalino PERC", "Eficiencia": "21.3%", "Voltaje": "41.5V Vmp", "Dimensiones": "2278 x 1134 x 35 mm", "Garantía": "25 años rendimiento" },
    metaTitle: "Panel Solar 550W Monocristalino – Colombia | NetPower IT",
    metaDesc: "Panel solar 550W monocristalino alta eficiencia. Para instalaciones residenciales y comerciales. Envío Colombia.",
    active: true, featured: true
  },
  {
    id: "8", slug: "licencia-microsoft-365-business", name: "Microsoft 365 Business Basic (Anual)",
    description: "Suscripción anual Microsoft 365 Business Basic. Incluye Exchange Online, Teams, SharePoint y OneDrive 1TB.",
    shortDesc: "Licencia anual M365 Business Basic por usuario",
    price: 289000, salePrice: null, sku: "M365-BB-ANUAL", stock: 999,
    images: [], categoryId: "6", brandId: "4",
    specs: { "Tipo": "Suscripción anual", "Usuarios": "1 usuario", "Email": "Exchange Online 50GB", "Almacenamiento": "OneDrive 1TB", "Apps": "Web y móvil", "Teams": "Incluido" },
    metaTitle: "Microsoft 365 Business Basic – Precio Colombia | NetPower IT",
    metaDesc: "Licencia Microsoft 365 Business Basic anual. Exchange, Teams, SharePoint, OneDrive. Distribuidor autorizado Colombia.",
    active: true, featured: false
  },
  {
    id: "9", slug: "teclado-mouse-logitech-mk270", name: "Combo Teclado y Mouse Inalámbrico Logitech MK270",
    description: "Combo inalámbrico Logitech MK270 con teclado de tamaño completo y mouse compacto. Conexión 2.4GHz.",
    shortDesc: "Combo inalámbrico 2.4GHz, alcance 10m, pilas incluidas",
    price: 89900, salePrice: 79900, sku: "920-004432", stock: 45,
    images: [], categoryId: "8", brandId: "6",
    specs: { "Conectividad": "Inalámbrico 2.4GHz", "Receptor": "Nano USB unificador", "Alcance": "10 metros", "Teclado": "Full-size con numpad", "Pilas teclado": "2x AAA (36 meses)", "Pilas mouse": "1x AA (12 meses)" },
    metaTitle: "Logitech MK270 Combo Teclado Mouse – Colombia | NetPower IT",
    metaDesc: "Combo inalámbrico Logitech MK270 teclado y mouse. 2.4GHz, larga duración de baterías. Precio Colombia.",
    active: true, featured: false
  },
  {
    id: "10", slug: "camara-hikvision-4mp-domo", name: "Cámara IP Hikvision 4MP Domo IR 30m",
    description: "Cámara de seguridad IP Hikvision tipo domo con resolución 4MP, visión nocturna IR 30m y protección IP67.",
    shortDesc: "Cámara domo IP 4MP PoE con IR 30m y WDR",
    price: 289000, salePrice: 249000, sku: "DS-2CD1143G2-I", stock: 35,
    images: [], categoryId: "3", brandId: "9",
    specs: { "Resolución": "4MP (2560x1440)", "Lente": "2.8mm", "IR": "30 metros", "Protección": "IP67", "Alimentación": "PoE (802.3af) / 12V DC", "Compresión": "H.265+" },
    metaTitle: "Cámara Hikvision 4MP Domo IP – Colombia | NetPower IT",
    metaDesc: "Cámara IP Hikvision 4MP domo con IR 30m y PoE. Ideal para videovigilancia. Precio Colombia.",
    active: true, featured: false
  },
];

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
