// Convierte un File de imagen a WebP usando canvas en el navegador.
// Mantiene la dimensión original (cap opcional) y devuelve un Blob WebP.
export async function fileToWebP(
  file: File,
  opts: { quality?: number; maxDimension?: number } = {}
): Promise<{ blob: Blob; fileName: string }> {
  const { quality = 0.85, maxDimension = 1600 } = opts;

  // Si ya es webp, no reconvertir.
  if (file.type === "image/webp") {
    return { blob: file, fileName: file.name.replace(/\.[^.]+$/, ".webp") };
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    i.src = dataUrl;
  });

  // Cap dimensions, preserve aspect ratio.
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falló la conversión a WebP"))),
      "image/webp",
      quality
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return { blob, fileName: `${baseName}.webp` };
}
