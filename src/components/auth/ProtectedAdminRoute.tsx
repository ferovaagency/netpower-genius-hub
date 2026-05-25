import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "unauth" | "forbidden">("loading");
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const check = async (session: { user: { id: string } } | null) => {
      if (!session?.user) {
        if (active) setState("unauth");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (error || !data) setState("forbidden");
      else setState("ok");
    };

    // Set up listener BEFORE getting session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session as never);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session as never));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "unauth") {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (state === "forbidden") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
        <p className="text-muted-foreground">
          Tu cuenta no tiene permisos de administrador. Contacta al equipo de Netpower IT.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
