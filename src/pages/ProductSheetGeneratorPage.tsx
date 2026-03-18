import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Sparkles, Loader2, Plus, Trash2,
  DollarSign, Image as ImageIcon, Edit3, Power,
} from "lucide-react";
import { categories, brands } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GeneratedSheetResult from "@/components/admin/GeneratedSheetResult";
import BulkProductImporter from "@/components/admin/BulkProductImporter";
import type { Product } from "@/types/store";
import {
  upsertProductDB,
  updateProductDB,
  deleteProductDB,
  setProductActiveDB,
  fetchAllProducts,
} from "@/hooks/useProducts";
import { generateSlug } from "@/lib/slug";

interface SpecEntry { key: string; value: string }

export interface GeneratedSheet {
  description: string;
  shortDesc: string;
  specs: Record<string, string>;
  benefits: string[];
  faqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDesc: string;
  suggestedImageSearch?: string;
}

type TabMode = "create" | "edit";

export default function ProductSheetGeneratorPage() {
...
                <button onClick={handleGenerate} disabled={loading} type="button"
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generando ficha...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {tab === "edit" ? "Regenerar Ficha con IA" : "Generar Ficha con IA"}</>
                  )}
                </button>

                {tab === "create" && (
                  <div className="mt-6 border-t border-border pt-6">
                    <BulkProductImporter onCompleted={resetForm} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center justify-center text-center shadow-card">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-base font-semibold text-foreground">Generando ficha de producto...</p>
                    <p className="text-sm text-muted-foreground mt-1">Esto puede tomar 15-30 segundos</p>
                  </motion.div>
                )}
                {!loading && !result && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-2xl border border-border/50 border-dashed p-10 flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <p className="text-base text-muted-foreground">
                      {tab === "edit"
                        ? "Busca un producto por nombre, selecciónalo y genera la ficha actualizada"
                        : "Completa los datos del producto y genera la ficha o usa la carga masiva"}
                    </p>
                  </motion.div>
                )}
                {!loading && result && (
                  <GeneratedSheetResult
                    result={result} imageUrl={imageUrl} productName={productName}
                    price={price} onPublish={handlePublish} publishing={publishing} isEdit={tab === "edit"} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
