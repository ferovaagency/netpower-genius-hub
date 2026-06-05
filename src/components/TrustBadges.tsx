import { ShieldCheck, CreditCard, Landmark, Lock } from "lucide-react";

interface TrustBadgesProps {
  className?: string;
  compact?: boolean;
}

/**
 * Sellos de confianza para mostrar bajo CTAs de cotización/compra.
 * Comunica: pagos seguros con Wompi, PSE y tarjetas de crédito.
 */
export default function TrustBadges({ className = "", compact = false }: TrustBadgesProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${compact ? "text-[10px]" : "text-xs"} text-muted-foreground ${className}`}
      aria-label="Métodos de pago seguros"
    >
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
        <Lock className="w-3 h-3 text-primary" />
        <span className="font-semibold">Pago seguro</span>
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
        <ShieldCheck className="w-3 h-3 text-primary" />
        <span className="font-semibold">Wompi</span>
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
        <Landmark className="w-3 h-3 text-primary" />
        <span className="font-semibold">PSE</span>
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
        <CreditCard className="w-3 h-3 text-primary" />
        <span className="font-semibold">Tarjetas Crédito/Débito</span>
      </span>
    </div>
  );
}
