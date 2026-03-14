import { useState } from "react";
import { Copy, Check, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { GeneratedSheet } from "@/pages/ProductSheetGeneratorPage";

interface Props {
  result: GeneratedSheet;
  imageUrl: string;
  productName: string;
  price: string;
  onPublish: () => void;
  publishing?: boolean;
}

export default function GeneratedSheetResult({ result, imageUrl, productName, price, onPublish, publishing }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground"
      title="Copiar"
    >
      {copied === id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Image preview */}
      {imageUrl && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Imagen del Producto</h3>
          <img src={imageUrl} alt={productName} className="w-full h-48 object-contain rounded-lg bg-muted/20" />
        </div>
      )}

      {/* Short desc */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción Corta</h3>
          <CopyBtn text={result.shortDesc} id="short" />
        </div>
        <p className="text-base text-foreground">{result.shortDesc}</p>
      </div>

      {/* Description with HTML */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción Completa</h3>
          <CopyBtn text={result.description} id="desc" />
        </div>
        <div
          className="prose prose-sm max-w-none max-h-80 overflow-y-auto text-muted-foreground
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-3 [&_h4]:mb-1
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
            [&_li]:text-sm [&_li]:mb-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-sm [&_blockquote]:my-4 [&_blockquote]:bg-accent/30 [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:rounded-r-lg
            [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ __html: result.description }}
        />
      </div>

      {/* Specs */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Especificaciones</h3>
          <CopyBtn text={JSON.stringify(result.specs, null, 2)} id="specs" />
        </div>
        <div className="divide-y divide-border">
          {Object.entries(result.specs).map(([k, v]) => (
            <div key={k} className="flex py-2 text-sm">
              <span className="w-2/5 font-medium text-foreground">{k}</span>
              <span className="w-3/5 text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Beneficios</h3>
          <CopyBtn text={result.benefits.join("\n")} id="benefits" />
        </div>
        <ul className="space-y-1.5">
          {result.benefits.map((b, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span> {b}
            </li>
          ))}
        </ul>
      </div>

      {/* FAQs */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Preguntas Frecuentes</h3>
        <div className="space-y-3">
          {result.faqs.map((faq, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-foreground mb-1">{faq.question}</p>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">SEO</h3>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Meta Título</p>
              <p className="text-sm font-medium text-foreground">{result.metaTitle}</p>
            </div>
            <CopyBtn text={result.metaTitle} id="meta-title" />
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Meta Descripción</p>
              <p className="text-sm text-foreground">{result.metaDesc}</p>
            </div>
            <CopyBtn text={result.metaDesc} id="meta-desc" />
          </div>
        </div>
      </div>

      {/* Publish button */}
      <button
        onClick={onPublish}
        disabled={!price || publishing}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition shadow-button disabled:opacity-50"
      >
        {publishing ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</>
        ) : (
          <><Upload className="w-5 h-5" /> Publicar producto en la tienda</>
        )}
      </button>
      {!price && (
        <p className="text-xs text-destructive text-center">Ingresa un precio para poder publicar</p>
      )}
    </motion.div>
  );
}
