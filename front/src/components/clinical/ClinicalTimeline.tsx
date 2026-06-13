import { Link } from "@tanstack/react-router";
import type { Consultation, Patient } from "@/mocks/data";
import { fmtMedium } from "@/lib/format";
import { Stethoscope } from "lucide-react";
import { PatientAvatar } from "./PatientAvatar";

function fallbackPatient(consultation: Consultation): Patient {
  return {
    id: consultation.patientId,
    name: consultation.patient?.name ?? "Paciente",
    avatarColor: consultation.patient?.avatarColor ?? "#DDB7E8",
    allergies: consultation.patient?.allergies ?? [],
    age: 0,
    birthDate: "",
    gender: "F",
    guardian: "",
    guardianPhone: "",
    email: "",
    conditions: [],
    bloodType: "",
    lastVisit: "",
  };
}

export function ClinicalTimeline({ items }: { items: Consultation[] }) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">Sin consultas registradas.</div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      {items.map((c) => {
        const patient = fallbackPatient(c);
        return (
          <div key={c.id} className="relative pb-8 last:pb-0">
            <div className="absolute -left-[18px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-4 w-4 text-primary shrink-0" />
              <Link
                to="/pacientes/$id"
                params={{ id: c.patientId }}
                className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors"
              >
                <PatientAvatar patient={patient} size={28} />
                <span className="text-sm font-medium truncate">{patient.name}</span>
              </Link>
              {c.reason && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  · {c.reason}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{fmtMedium(c.date)}</span>
            </div>
            <Link
              to="/pacientes/$id"
              params={{ id: c.patientId }}
              className="block bg-surface rounded-xl border p-4 ml-0 hover:border-primary/30 transition-colors"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Diagnóstico</div>
              <div className="text-sm font-medium mt-0.5">{c.diagnosis}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">Tratamiento</div>
              <div className="text-sm mt-0.5">{c.treatment}</div>
              {c.nextTreatment && (
                <>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">
                    Próximo tratamiento
                  </div>
                  <div className="text-sm mt-0.5">{c.nextTreatment}</div>
                </>
              )}
              {(c.evolutionNote || c.notes) && (
                <>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">
                    Nota de evolución
                  </div>
                  <div className="text-sm mt-0.5 italic text-muted-foreground">
                    {c.evolutionNote || c.notes}
                  </div>
                </>
              )}
              {c.doctor && (
                <div className="text-xs text-muted-foreground mt-3">— {c.doctor}</div>
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
