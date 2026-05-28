import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Patient } from "@/mocks/data";

type Props = {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeletePatientDialog({ patient, open, onOpenChange, onDeleted }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { deletePatient } = useStore();
  const navigate = useNavigate();

  const reset = () => {
    setStep(1);
    setConfirmName("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!patient || confirmName !== patient.name) return;
    setDeleting(true);
    try {
      await deletePatient(patient.id);
      toast.success(`${patient.name} fue eliminado permanentemente`);
      handleOpenChange(false);
      if (onDeleted) {
        onDeleted();
      } else {
        navigate({ to: "/pacientes" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el paciente");
    } finally {
      setDeleting(false);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Eliminar paciente
              </DialogTitle>
              <DialogDescription className="text-left pt-2 space-y-2">
                <span className="block">
                  Esta acción es <strong>permanente e irreversible</strong>. El paciente y todos sus
                  datos se eliminarán de forma definitiva del sistema.
                </span>
                <span className="block">
                  Se borrarán también las citas, consultas, recetas, historia clínica, odontograma y
                  presupuestos asociados a <strong>{patient.name}</strong>.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => setStep(2)}>
                Sí, quiero eliminar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription className="text-left pt-2">
                Para confirmar, escribe el nombre completo del paciente:{" "}
                <strong>{patient.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={patient.name}
              autoFocus
              className="w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setConfirmName("");
                }}
                disabled={deleting}
              >
                Volver
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={confirmName !== patient.name || deleting}
                onClick={handleDelete}
              >
                {deleting ? "Eliminando…" : "Eliminar permanentemente"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
