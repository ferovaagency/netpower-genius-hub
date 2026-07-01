import { Link } from "react-router-dom";

export default function PromoTricolorBox({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-lg border-2 border-primary/40 bg-gradient-to-r from-yellow-50 via-blue-50 to-red-50 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}>
      <p className="font-bold text-foreground mb-2">🇨🇴 Promo Tricolor — Obsequio por tu compra</p>
      <ul className="space-y-1 text-foreground/90">
        <li>• <span className="font-semibold">$1.000.000 – $4.999.999:</span> apuntador Klip Xtreme KPS-006 o KPS-005.</li>
        <li>• <span className="font-semibold">$5.000.000 – $9.999.999:</span> teclado Logitech Pebble Keys 2 K380S.</li>
        <li>• <span className="font-semibold">Superiores a $10.000.000:</span> audífonos Cubbit Studio (negro).</li>
      </ul>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Válido del 1 al 31 de julio de 2026 o hasta agotar existencias. Aplica también para cotizaciones.{" "}
        <Link to="/legal?tab=promo-tricolor" className="underline text-primary hover:opacity-80">
          Ver términos y condiciones
        </Link>
      </p>
    </div>
  );
}
