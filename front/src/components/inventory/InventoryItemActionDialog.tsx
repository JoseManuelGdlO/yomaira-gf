import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InventoryItem } from "@/lib/api";

type ActionMode = "deactivate" | "delete";

type Props = {
  item: InventoryItem | null;
  mode: ActionMode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
};

export function InventoryItemActionDialog({ item, mode, open, onOpenChange, onConfirm, pending }: Props) {
  const isDelete = mode === "delete";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            {isDelete ? "Eliminar insumo" : "Desactivar insumo"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              {isDelete ? (
                <>
                  <p>
                    ¿Eliminar permanentemente <strong className="text-foreground">{item?.name}</strong>?
                  </p>
                  <p>Esta acción no se puede deshacer. El insumo desaparecerá del inventario.</p>
                  <p>
                    Si fue usado en consultas, no se podrá eliminar — en ese caso desactívalo para conservar
                    el historial.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ¿Desactivar <strong className="text-foreground">{item?.name}</strong>?
                  </p>
                  <p>
                    El insumo seguirá en la lista como inactivo y conservará su historial. Podrás reactivarlo
                    cuando quieras.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending
              ? isDelete
                ? "Eliminando…"
                : "Desactivando…"
              : isDelete
                ? "Eliminar"
                : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
