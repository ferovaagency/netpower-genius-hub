import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, MapPin } from "lucide-react";

const socialProofData = [
  { product: "UPS APC Back-UPS 1500VA", city: "Bogotá", time: "hace 3 min" },
  { product: "Batería UPS 12V 9Ah", city: "Medellín", time: "hace 5 min" },
  { product: "Switch Dahua 24 Puertos PoE", city: "Cali", time: "hace 8 min" },
  { product: "Monitor Samsung 24\" FHD", city: "Barranquilla", time: "hace 12 min" },
  { product: "Panel Solar 550W", city: "Bucaramanga", time: "hace 15 min" },
  { product: "Combo Logitech MK270", city: "Cartagena", time: "hace 18 min" },
  { product: "Cámara Hikvision 4MP Domo", city: "Pereira", time: "hace 22 min" },
  { product: "UPS CDP R-Smart 2000VA", city: "Manizales", time: "hace 25 min" },
  { product: "Microsoft 365 Business Basic", city: "Ibagué", time: "hace 30 min" },
  { product: "Servidor HP ProLiant ML30", city: "Cúcuta", time: "hace 35 min" },
  { product: "Batería UPS 12V 9Ah", city: "Santa Marta", time: "hace 40 min" },
  { product: "Switch Dahua 24 Puertos PoE", city: "Villavicencio", time: "hace 45 min" },
  { product: "Panel Solar 550W", city: "Pasto", time: "hace 50 min" },
  { product: "UPS APC Back-UPS 1500VA", city: "Neiva", time: "hace 55 min" },
  { product: "Monitor Samsung 24\" FHD", city: "Armenia", time: "hace 1 hora" },
];

export default function SocialProofPopup() {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // First popup after 8 seconds
    const initialTimer = setTimeout(() => {
      setCurrentIndex(0);
      setIsVisible(true);
    }, 8000);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (currentIndex < 0) return;

    // Show for 5 seconds, then hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    // After hiding, wait 15-25s and show next
    const nextTimer = setTimeout(() => {
      const nextIdx = (currentIndex + 1) % socialProofData.length;
      setCurrentIndex(nextIdx);
      setIsVisible(true);
    }, 5000 + 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [currentIndex]);

  const item = currentIndex >= 0 ? socialProofData[currentIndex] : null;

  return (
    <AnimatePresence>
      {isVisible && item && (
        <motion.div
          initial={{ opacity: 0, x: -80, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-40 bg-card border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[320px] cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setIsVisible(false)}
        >
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Alguien compró
            </p>
            <p className="text-xs text-primary font-medium truncate">{item.product}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {item.city} · {item.time}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            className="text-muted-foreground hover:text-foreground text-xs shrink-0 ml-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
