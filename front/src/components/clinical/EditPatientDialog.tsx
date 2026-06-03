import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { Patient } from "@/mocks/data";
import {
  PatientFormFields,
  patientToForm,
  validatePatientForm,
  formToPatientFields,
  type PatientFormValues,
} from "./PatientFormFields";

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient: Patient;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { updatePatient } = useStore();
  const [form, setForm] = useState<PatientFormValues>(() => patientToForm(patient));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(patientToForm(patient));
  }, [open, patient]);

  const submit = async () => {
    const error = validatePatientForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      await updatePatient(patient.id, formToPatientFields(form, patient.birthDate));
      toast.success("Paciente actualizado");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Editar paciente</DialogTitle>
              <DialogDescription>Actualiza los datos del expediente clínico</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <PatientFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
