import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Consultation, Patient } from "@/mocks/data";
import { PatientAvatar } from "./PatientAvatar";
import { fmtLong } from "@/lib/format";
import { formatConsultationPaymentColumn } from "@/lib/finance";
import { ArrowRight, Eye, Package, Stethoscope } from "lucide-react";

const NOTE_PREVIEW_LEN = 160;

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

function Section({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

export function ConsultationCard({
  consultation,
  onQuickView,
}: {
  consultation: Consultation;
  onQuickView: (patientId: string) => void;
}) {
  const patient = fallbackPatient(consultation);
  const evolutionNote = consultation.evolutionNote || consultation.notes;
  const [expandedNote, setExpandedNote] = useState(false);
  const noteTruncated = evolutionNote.length > NOTE_PREVIEW_LEN;
  const noteDisplay =
    noteTruncated && !expandedNote ? `${evolutionNote.slice(0, NOTE_PREVIEW_LEN)}…` : evolutionNote;
  const inventoryCount = consultation.inventoryUsages?.length ?? 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <PatientAvatar patient={patient} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-display text-lg font-semibold">{patient.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{fmtLong(consultation.date)}</p>
            </div>
            {consultation.reason && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                <Stethoscope className="h-3.5 w-3.5" />
                {consultation.reason}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Section label="Diagnóstico" value={consultation.diagnosis} />
            <Section label="Tratamiento" value={consultation.treatment} />
            {consultation.nextTreatment && (
              <Section label="Próximo tratamiento" value={consultation.nextTreatment} />
            )}
            {evolutionNote && (
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Nota de evolución</div>
                <p className="text-sm mt-0.5 italic text-muted-foreground">{noteDisplay}</p>
                {noteTruncated && (
                  <button
                    type="button"
                    onClick={() => setExpandedNote((v) => !v)}
                    className="text-xs text-primary mt-1 hover:underline"
                  >
                    {expandedNote ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t text-sm">
            {consultation.doctor && (
              <span className="text-muted-foreground">Dr(a). {consultation.doctor}</span>
            )}
            {(consultation.charge || consultation.paymentAndNextAppointment) && (
              <span className="text-muted-foreground">
                {formatConsultationPaymentColumn(consultation)}
              </span>
            )}
            {inventoryCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                <Package className="h-3 w-3" />
                {inventoryCount} insumo{inventoryCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              to="/pacientes/$id"
              params={{ id: consultation.patientId }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Ver expediente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => onQuickView(consultation.patientId)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
            >
              <Eye className="h-4 w-4" />
              Vista rápida
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
