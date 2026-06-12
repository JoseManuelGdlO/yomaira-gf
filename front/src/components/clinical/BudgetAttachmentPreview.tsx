import { useEffect, useState } from "react";
import { dataUrlToObjectUrl, isPdfDataUrl } from "@/lib/budgetAttachment";

export function useBudgetAttachmentPreviewUrl(attachment: string | null): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment) {
      setPreviewUrl(null);
      return;
    }
    const blobUrl = dataUrlToObjectUrl(attachment);
    if (blobUrl) {
      setPreviewUrl(blobUrl);
      return () => URL.revokeObjectURL(blobUrl);
    }
    setPreviewUrl(attachment);
  }, [attachment]);

  return previewUrl;
}

export function BudgetAttachmentPreview({
  attachment,
  previewUrl,
}: {
  attachment: string;
  previewUrl?: string | null;
}) {
  const internalUrl = useBudgetAttachmentPreviewUrl(previewUrl ? null : attachment);
  const resolvedUrl = previewUrl ?? internalUrl ?? attachment;
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewFailed(false);
  }, [attachment]);

  if (previewFailed) {
    return (
      <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
        Vista previa no disponible para este archivo. Usa «Abrir en pestaña nueva».
      </div>
    );
  }

  if (isPdfDataUrl(attachment)) {
    return (
      <iframe
        title="Presupuesto adjunto"
        src={resolvedUrl}
        className="w-full h-[min(480px,60vh)] border-0"
        onError={() => setPreviewFailed(true)}
      />
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt="Presupuesto adjunto"
      className="w-full max-h-[480px] object-contain"
      onError={() => setPreviewFailed(true)}
    />
  );
}
