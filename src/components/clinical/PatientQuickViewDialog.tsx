import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PatientAvatar } from "./PatientAvatar";
import { ClinicalTimeline } from "./ClinicalTimeline";
import { fmtShort } from "@/lib/format";
import { Phone, Mail, Cake, Droplet, AlertCircle, FileText, ArrowRight, Pill } from "lucide-react";

export function PatientQuickViewDialog({ patientId, open, onOpenChange }: { patientId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { patients, consultations, prescriptions } = useStore();
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return null;
  const patientConsults = consultations.filter((c) => c.patientId === patient.id);
  const patientRx = prescriptions.filter((r) => r.patientId === patient.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Expediente clínico</DialogTitle>
          <DialogDescription className="sr-only">Vista rápida del expediente</DialogDescription>
        </DialogHeader>

        {/* Patient header */}
        <div className="flex items-start gap-4 pb-4 border-b">
          <PatientAvatar patient={patient} size={64} />
          <div className="flex-1 min-w-0">
            <div className="font-display text-2xl font-semibold">{patient.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1.5"><Cake className="h-4 w-4" /> {patient.age} años</span>
              <span className="inline-flex items-center gap-1.5"><Droplet className="h-4 w-4" /> {patient.bloodType}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {patient.guardianPhone}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {patient.email}</span>
            </div>
            {patient.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {patient.allergies.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                    <AlertCircle className="h-3 w-3" /> {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={FileText} label="Consultas" value={patientConsults.length} />
          <Stat icon={Pill} label="Recetas" value={patientRx.length} />
          <Stat icon={Cake} label="Última visita" value={fmtShort(patient.lastVisit)} small />
        </div>

        {/* Datos generales */}
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBlock title="Datos generales">
            <Row label="Tutor" value={patient.guardian} />
            <Row label="Género" value={patient.gender === "F" ? "Femenino" : "Masculino"} />
            <Row label="Nacimiento" value={fmtShort(patient.birthDate)} />
          </InfoBlock>
          <InfoBlock title="Antecedentes">
            {patient.conditions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin antecedentes registrados.</div>
            ) : (
              <ul className="space-y-1.5">
                {patient.conditions.map((c) => <li key={c} className="text-sm">• {c}</li>)}
              </ul>
            )}
          </InfoBlock>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-3">Historial reciente</h3>
          <ClinicalTimeline items={patientConsults.slice(0, 3)} />
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Link to="/pacientes/$id" params={{ id: patient.id }} onClick={() => setTimeout(() => onOpenChange(false), 0)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90">
            Abrir expediente completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon: Icon, label, value, small }: { icon: any; label: string; value: string | number; small?: boolean }) {
  return (
    <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={small ? "text-sm font-medium truncate" : "font-display text-lg font-semibold"}>{value}</div>
      </div>
    </div>
  );
}
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground tracking-wide mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
