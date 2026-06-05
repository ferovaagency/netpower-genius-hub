import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "netpower_exit_intent_shown";

type FormValues = { email: string };

export default function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setOpen(true);
        document.removeEventListener("mouseleave", onMouseLeave);
      }
    };

    // Pequeño delay para no disparar en navegación inicial
    const t = setTimeout(() => {
      document.addEventListener("mouseleave", onMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { error } = await (supabase.from as any)("prospects").insert({
        email: values.email.trim().toLowerCase(),
        source: "exit_intent",
        subject: "Matriz Comparativa Servidores y UPS 2026",
      });
      if (error) throw error;
      toast.success("¡Listo! Te enviaremos el PDF a tu correo en breve.");
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Prospect insert error:", err);
      toast.error("No pudimos registrar tu correo. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-2">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Descarga la Matriz Comparativa de Servidores y UPS 2026
          </DialogTitle>
          <DialogDescription>
            PDF gratuito con specs, precios de referencia en COP y recomendaciones para tu proyecto B2B en Colombia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="exit-email">Correo corporativo</Label>
            <Input
              id="exit-email"
              type="email"
              placeholder="tunombre@empresa.com"
              autoComplete="email"
              {...register("email", {
                required: "El correo es obligatorio",
                maxLength: { value: 255, message: "Máximo 255 caracteres" },
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Correo inválido",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Download className="w-4 h-4 mr-2" />
            {submitting ? "Enviando..." : "Descargar PDF gratis"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Al enviar aceptas recibir comunicaciones comerciales de Netpower IT. Puedes darte de baja en cualquier momento.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
