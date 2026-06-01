import { Loader2, Save } from "lucide-react";

export function FloatingSaveButton({
  onClick,
  saving = false,
  disabled = false,
  visible = true,
}: {
  onClick: () => void;
  saving?: boolean;
  disabled?: boolean;
  visible?: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || saving}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg hover:bg-primary/90 disabled:opacity-60 transition-all"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </button>
    </div>
  );
}
