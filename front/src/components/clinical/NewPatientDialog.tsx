import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { todayISO } from "@/lib/format";
import {
  PatientFormFields,
  emptyPatientForm,
  validatePatientForm,
  formToPatientFields,
  type PatientFormValues,
} from "./PatientFormFields";

const COLORS = ["#FCE4F5", "#E4E8FC", "#FCE9D6", "#E4FCEA", "#F3E4FC", "#FCEAE4"];

export function NewPatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { patients, addPatient } = useStore();
  const [form, setForm] = useState<PatientFormValues>(emptyPatientForm());

  const reset = () => setForm(emptyPatientForm());

  const submit = () => {
    const error = validatePatientForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    const fields = formToPatientFields(form, todayISO());
    addPatient({
      id: "p" + (patients.length + 1) + "_" + Date.now(),
      ...fields,
      lastVisit: todayISO(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    toast.success("Paciente creado");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Nuevo paciente</DialogTitle>
              <DialogDescription>Registra un paciente en el expediente clínico</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <PatientFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Guardar paciente</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
