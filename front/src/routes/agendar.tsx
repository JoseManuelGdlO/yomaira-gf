import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type PublicBrandingDTO, type PublicPatientDTO } from "@/lib/api";
import { todayISO } from "@/lib/format";
import { Calendar, CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar cita — MedFlow" }] }),
  component: AgendarPage,
});

type Step = "phone" | "patient" | "slot" | "done";

function AgendarPage() {
  const [branding, setBranding] = useState<PublicBrandingDTO | null>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [patient, setPatient] = useState<PublicPatientDTO | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [guardian, setGuardian] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("Consulta");
  const [busy, setBusy] = useState(false);
  const [cancelToken, setCancelToken] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    api.publicBooking
      .branding()
      .then(setBranding)
      .catch(() => setBranding({ clinicName: "Consultorio" }));
  }, []);

  useEffect(() => {
    if (step !== "slot" || !date) return;
    setBusy(true);
    api.publicBooking
      .slots(date)
      .then(setSlots)
      .catch(() => toast.error("No se pudieron cargar horarios"))
      .finally(() => setBusy(false));
  }, [date, step]);

  const lookup = async () => {
    if (phone.length < 8) {
      toast.error("Ingresa un teléfono válido");
      return;
    }
    setBusy(true);
    try {
      const found = await api.publicBooking.lookupPatient(phone);
      if (found) {
        setPatient(found);
        setIsNew(false);
      } else {
        setPatient(null);
        setIsNew(true);
      }
      setStep("patient");
    } catch {
      toast.error("Error al buscar paciente");
    } finally {
      setBusy(false);
    }
  };

  const book = async () => {
    if (!time) {
      toast.error("Selecciona un horario");
      return;
    }
    setBusy(true);
    try {
      const body = patient
        ? { patientId: patient.id, date, time, reason }
        : { name, guardian, phone, date, time, reason };
      const res = await api.publicBooking.book(body);
      setAppointmentId(res.appointment.id);
      setCancelToken(res.cancelToken);
      setStep("done");
      toast.success("Cita solicitada. El consultorio la confirmará pronto.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo agendar";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = async () => {
    if (!appointmentId || !cancelToken) return;
    setBusy(true);
    try {
      await api.publicBooking.cancel(appointmentId, cancelToken);
      toast.success("Cita cancelada");
      setStep("phone");
      setPhone("");
      setPatient(null);
      setCancelToken(null);
      setAppointmentId(null);
    } catch {
      toast.error("No se pudo cancelar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-10">
      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="text-4xl">{branding?.logoEmoji ?? "🩺"}</div>
          <h1 className="font-display text-2xl font-semibold">{branding?.clinicName ?? "Consultorio"}</h1>
          <p className="text-sm text-muted-foreground">Agenda tu cita en línea</p>
        </header>

        <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
          {step === "phone" && (
            <>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" /> Teléfono del tutor
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10 dígitos"
                className="w-full h-11 px-3 rounded-lg border bg-surface text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void lookup()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
              </button>
            </>
          )}

          {step === "patient" && (
            <>
              {patient && !isNew ? (
                <div className="rounded-lg bg-surface p-3 text-sm">
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-muted-foreground">Tutor: {patient.guardian}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Paciente nuevo — completa los datos:</p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del paciente"
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-sm"
                  />
                  <input
                    value={guardian}
                    onChange={(e) => setGuardian(e.target.value)}
                    placeholder="Nombre del tutor"
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep("slot")}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
              >
                Elegir fecha y hora
              </button>
            </>
          )}

          {step === "slot" && (
            <>
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fecha
              </label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                className="w-full h-10 px-3 rounded-lg border bg-surface text-sm"
              />
              <label className="text-sm font-medium">Horario disponible</label>
              {busy ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin horarios para esta fecha.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      className={`py-2 rounded-lg text-sm border ${
                        time === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-surface"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo"
                className="w-full h-10 px-3 rounded-lg border bg-surface text-sm"
              />
              <button
                type="button"
                disabled={busy || !time}
                onClick={() => void book()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
              >
                Confirmar solicitud
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-medium">¡Solicitud enviada!</p>
              <p className="text-sm text-muted-foreground">
                Tu cita quedó <strong>pendiente</strong>. Recibirás confirmación del consultorio.
              </p>
              {cancelToken && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void cancelBooking()}
                  className="text-sm text-destructive underline"
                >
                  Cancelar esta solicitud
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Acceso personal del consultorio
          </a>
        </p>
      </div>
    </div>
  );
}
