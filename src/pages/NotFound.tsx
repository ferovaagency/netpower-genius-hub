import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MessageCircle, Home, ShoppingBag } from "lucide-react";

const WHATSAPP_NUMBER = "573018417895";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const waMessage = encodeURIComponent(
    `Hola NetPower IT, estaba buscando un producto en ${location.pathname} pero no lo encontré. ¿Está disponible?`
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center px-6 max-w-md">
        <h1 className="mb-3 text-5xl font-extrabold text-foreground">404</h1>
        <p className="mb-2 text-lg font-semibold text-foreground">Página no encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          ¿Buscas un producto que no aparece? Pregúntanos por WhatsApp si está disponible.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-6 rounded-lg bg-[hsl(145,63%,42%)] text-[hsl(0,0%,100%)] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <MessageCircle className="w-4 h-4" /> Preguntar por WhatsApp
          </a>
          <Link
            to="/tienda"
            className="h-11 px-6 rounded-lg border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition"
          >
            <ShoppingBag className="w-4 h-4" /> Ir a la tienda
          </Link>
        </div>
        <Link to="/" className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-6">
          <Home className="w-3 h-3" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
