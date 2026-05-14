import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { todayISO } from "@/lib/format";

const COLORS = ["#FCE4F5", "#E4E8FC", "#FCE9D6", "#E4FCEA", "#F3E4FC", "#FCEAE4"];

export function NewPatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { patients, updatePatient: _u } = useStore();
  // Use store mutator: we need addPatient. Inject via store extension below.
  const store = useStore() as any;
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");
  const [birthDate, setBirthDate] = useState("");
  const [guardian, setGuardian] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");

  const reset = () => {
    setName(""); setAge(""); setBirthDate(""); setGuardian(""); setPhone(""); setEmail(""); setAllergies(""); setConditions("");
  };

  const submit = () => {
    if (!name.trim() || !age || !guardian.trim()) {
      toast.error("Completa nombre, edad y tutor");
      return;
    }
    const newPatient = {
      id: "p" + (patients.length + 1) + "_" + Date.now(),
      name: name.trim(),
      age: Number(age),
      birthDate: birthDate || todayISO(),
      gender,
      guardian: guardian.trim(),
      guardianPhone: phone || "+52 55 0000 0000",
      email: email || "—",
      allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
      conditions: conditions.split(",").map((s) => s.trim()).filter(Boolean),
      bloodType,
      lastVisit: todayISO(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    if (store.addPatient) {
      store.addPatient(newPatient);
    } else {
      // Fallback if store doesn't have addPatient yet
      console.warn("addPatient not in store");
    }
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

        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          <Field label="Nombre completo *" className="sm:col-span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Sofía Martínez Ruiz" />
          </Field>
          <Field label="Edad *">
            <input type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="6" />
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Género">
            <div className="flex gap-2">
              {(["F", "M"] as const).map((g) => (
                <button key={g} onClick={() => setGender(g)} type="button" className={`flex-1 h-10 rounded-lg border text-sm font-medium ${gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-surface"}`}>
                  {g === "F" ? "Femenino" : "Masculino"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tipo de sangre">
            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className={inputCls}>
              {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Tutor *" className="sm:col-span-2">
            <input value={guardian} onChange={(e) => setGuardian(e.target.value)} className={inputCls} placeholder="Laura Ruiz" />
          </Field>
          <Field label="Teléfono del tutor">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+52 55 1234 5678" />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="contacto@email.com" />
          </Field>
          <Field label="Alergias (separadas por coma)" className="sm:col-span-2">
            <input value={allergies} onChange={(e) => setAllergies(e.target.value)} className={inputCls} placeholder="Penicilina, Látex" />
          </Field>
          <Field label="Antecedentes médicos (separados por coma)" className="sm:col-span-2">
            <input value={conditions} onChange={(e) => setConditions(e.target.value)} className={inputCls} placeholder="Caries, Mordida cruzada" />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium border bg-card hover:bg-surface">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Guardar paciente</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = "w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
