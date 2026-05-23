import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { PrintPrescriptionPortal } from "./PrintPrescriptionPortal";
import { PrescriptionPreview } from "./PrescriptionPreview";
import { PatientAvatar } from "@/components/clinical/PatientAvatar";
import { fmtLong } from "@/lib/format";
import { FileText, Printer, X } from "lucide-react";
import type { Prescription } from "@/mocks/data";

export function ViewPrescriptionDialog({
  prescription,
  open,
  onOpenChange,
  autoPrint = false,
}: {
  prescription: Prescription | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  autoPrint?: boolean;
}) {
  const { patients } = useStore();
  const patient = prescription ? patients.find((p) => p.id === prescription.patientId) : null;

  useEffect(() => {
    if (!open || !autoPrint || !prescription || !patient) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [open, autoPrint, prescription, patient]);

  if (!prescription || !patient) return null;

  const printRx = () => {
    window.print();
  };

  return (
    <>
      {open && <PrintPrescriptionPortal rx={prescription} patient={patient} />}
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-xl">Receta médica</DialogTitle>
              <DialogDescription>
                {patient.name} · {fmtLong(prescription.date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 bg-surface rounded-xl p-3 no-print">
          <PatientAvatar patient={patient} />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {prescription.items.length} medicamentos
              {prescription.diagnosis ? ` · ${prescription.diagnosis}` : ""}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={printRx}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1 border rounded-xl px-3 py-2 text-sm font-medium hover:bg-card"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <PrescriptionPreview rx={prescription} patient={patient} />
      </DialogContent>
    </Dialog>
    </>
  );
}
