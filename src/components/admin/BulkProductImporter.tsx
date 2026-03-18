import { useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, FileSpreadsheet, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slug';
import { getParentCategory } from '@/lib/catalog';
import { inferCategoryForBulkProduct, parseBulkImportFile, type BulkImportRow } from '@/lib/catalog-import';

interface BulkProductImporterProps {
  onCompleted: () => Promise<void> | void;
}

type ImportStatus = 'pending' | 'processing' | 'ok' | 'error';

interface ImportResult {
  rowNumber: number;
  name: string;
  category: string;
  status: ImportStatus;
  message: string;
}

const DEFAULT_WARRANTY = '12 meses con fabricante';
const DEFAULT_CONDITION = 'Nuevo';

export default function BulkProductImporter({ onCompleted }: BulkProductImporterProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseBulkImportFile(file);
      setFileName(file.name);
      setRows(parsedRows);
      setResults(parsedRows.map((row) => ({
        rowNumber: row.rowNumber,
        name: row.name,
        category: inferCategoryForBulkProduct(row),
        status: 'pending',
        message: 'En cola',
      })));

      toast({
        title: 'Archivo cargado',
        description: `${parsedRows.length} productos listos para procesar`,
      });
    } catch (error: any) {
      setFileName('');
      setRows([]);
      setResults([]);
      toast({
        title: 'No se pudo leer el archivo',
        description: error?.message || 'Verifica que sea un CSV o Excel válido',
        variant: 'destructive',
      });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleProcessBulk = async () => {
    if (rows.length === 0) {
      return toast({
        title: 'Carga un archivo primero',
        description: 'Usa un archivo .csv o .xlsx con una fila por producto',
        variant: 'destructive',
      });
    }

    setProcessing(true);
    let completed = 0;
    let failed = 0;
    const usedSlugs = new Set<string>();

    for (const row of rows) {
      setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: 'processing', message: 'Generando ficha y guardando...' } : item));

      try {
        const inferredCategory = inferCategoryForBulkProduct(row);
        const generated = await supabase.functions.invoke('generate-description', {
          body: {
            productName: row.name,
            price: row.price ?? null,
            condition: DEFAULT_CONDITION,
            warranty: DEFAULT_WARRANTY,
            additionalNotes: [
              row.brand,
              row.category ? `Categoría sugerida: ${row.category}` : null,
              row.description,
              row.shortDescription,
              row.notes,
              `Categoría obligatoria final: ${inferredCategory}`,
            ].filter(Boolean).join(' | '),
          },
        });

        if (generated.error) throw generated.error;

        const aiData = generated.data || {};
        const normalizedCategory = getParentCategory(
          row.category || aiData.category || inferredCategory,
          `${row.name} ${row.brand || ''} ${row.description || ''} ${row.shortDescription || ''} ${row.notes || ''}`,
        );

        const normalizedImages: string[] = row.imageUrl && row.imageUrl.trim()
          ? [row.imageUrl.trim()]
          : [];

        const baseSlug = generateSlug(row.name);
        let suffix = 1;
        let finalSlug = baseSlug;
        while (true) {
          const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
          if (usedSlugs.has(candidate)) {
            suffix += 1;
            continue;
          }

          const { data: existing } = await supabase.from('products').select('id').eq('slug', candidate).maybeSingle();
          if (!existing) {
            finalSlug = candidate;
            usedSlugs.add(candidate);
            break;
          }
          suffix += 1;
        }

        const payload = {
          name: row.name,
          slug: finalSlug,
          price: row.price ?? 0,
          sale_price: null,
          sku: row.sku || null,
          category: normalizedCategory,
          brand: row.brand || aiData.brand || null,
          condition: DEFAULT_CONDITION,
          warranty: DEFAULT_WARRANTY,
          short_description: row.shortDescription || row.description || aiData.short_description || null,
          description: aiData.description || row.description || row.notes || null,
          specs: aiData.specs || null,
          meta_title: aiData.meta_title || null,
          meta_description: aiData.meta_description || null,
          images: normalizedImages,
          reviews: Array.isArray(aiData.reviews) ? aiData.reviews : null,
          active: true,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;

        completed += 1;
        setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, category: normalizedCategory, status: 'ok', message: 'Producto guardado en la base de datos' } : item));
      } catch (error: any) {
        failed += 1;
        setResults((prev) => prev.map((item) => item.rowNumber === row.rowNumber ? { ...item, status: 'error', message: error?.message || 'No se pudo procesar' } : item));
      }
    }

    setProcessing(false);
    await onCompleted();
    toast({ title: 'Carga masiva finalizada', description: `${completed} OK · ${failed} con error` });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bebas">Carga masiva por archivo</h2>
          <p className="text-xs text-muted-foreground">Sube un archivo .csv o .xlsx con columnas como: name, description, price, brand, category, image_url, sku.</p>
        </div>
        <Badge variant="secondary">Categorías finales: Computadores · Licenciamiento · Servidores</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Archivo de productos</label>
          <Input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">Cada fila representa un producto. Se evita duplicar productos por slug.</p>
        </div>

        <Button onClick={handleProcessBulk} disabled={processing || rows.length === 0}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {processing ? 'Procesando archivo...' : 'Procesar archivo'}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {fileName || 'Sin archivo cargado'}
        </span>
        <span>{rows.length} filas detectadas</span>
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-2 rounded-lg border bg-background p-4">
          {results.map((result) => (
            <div key={result.rowNumber} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Fila {result.rowNumber} · {result.name}</p>
                <p className="text-xs text-muted-foreground">{result.category} · {result.message}</p>
              </div>
              <Badge variant={result.status === 'ok' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'} className="gap-1">
                {result.status === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : result.status === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : result.status === 'processing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {result.status === 'pending' ? 'Pendiente' : result.status === 'processing' ? 'Procesando' : result.status === 'ok' ? 'OK' : 'Error'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
