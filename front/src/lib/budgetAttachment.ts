/** Tamaño máximo del adjunto codificado en base64 (coincide con el backend). */
export const MAX_BUDGET_ATTACHMENT_BYTES = 12 * 1024 * 1024;

export function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export function isAcceptedBudgetFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
}

export function isPdfDataUrl(url: string): boolean {
  return url.startsWith("data:application/pdf");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxDim = 2400;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    for (const quality of [0.88, 0.78, 0.65, 0.5, 0.38]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlByteSize(dataUrl) <= MAX_BUDGET_ATTACHMENT_BYTES) return dataUrl;
    }
    throw new Error("too-large");
  } finally {
    bitmap.close();
  }
}

function isHeicFile(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || /\.heic?$/i.test(file.name);
}

/** Comprime imágenes y valida el tamaño final antes de enviar al servidor. */
export async function prepareBudgetAttachment(
  file: File,
): Promise<{ dataUrl: string; fileName: string }> {
  if (!isAcceptedBudgetFile(file)) {
    throw new Error("format");
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = !isPdf && (file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name));

  let dataUrl: string;
  let fileName = file.name;

  if (isImage && !isHeicFile(file)) {
    try {
      dataUrl = await compressImage(file);
      if (!/\.jpe?g$/i.test(fileName)) {
        fileName = `${fileName.replace(/\.[^.]+$/, "")}.jpg`;
      }
    } catch {
      dataUrl = await readFileAsDataUrl(file);
    }
  } else {
    dataUrl = await readFileAsDataUrl(file);
  }

  if (dataUrlByteSize(dataUrl) > MAX_BUDGET_ATTACHMENT_BYTES) {
    throw new Error("too-large");
  }

  return { dataUrl, fileName };
}

export function budgetAttachmentErrorMessage(code: string): string {
  if (code === "format") return "Formato no admitido. Usa imagen (JPG, PNG, WEBP) o PDF.";
  if (code === "too-large") {
    return "El archivo es demasiado pesado incluso después de comprimirlo. Prueba con una foto más pequeña o un PDF comprimido (máx. ~12 MB).";
  }
  return "No se pudo procesar el archivo";
}

/** Convierte un data URL a blob URL para previsualizar archivos grandes sin límites del navegador. */
export function dataUrlToObjectUrl(dataUrl: string): string | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) return null;
    const header = dataUrl.slice(0, comma);
    const base64 = dataUrl.slice(comma + 1);
    const mime = header.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}
