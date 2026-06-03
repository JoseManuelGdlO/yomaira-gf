import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, ApiError, type Appointment } from "@/lib/api";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/confirmar-cita/$id")({
  head: () => ({ meta: [{ title: "Confirmar cita — MediFlow" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ConfirmarCitaPage,
});

type Status = "loading" | "success" | "error";

function fmtDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function ConfirmarCitaPage() {
  const { id } = Route.useParams();
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>("loading");
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("El enlace está incompleto. Use el enlace que recibió por correo.");
      return;
    }

    let cancelled = false;
    api.publicBooking
      .confirm(id, token)
      .then((appt) => {
        if (cancelled) return;
        setAppointment(appt);
        setStatus("success");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        if (e instanceof ApiError) {
          setErrorMessage(e.message);
        } else {
          setErrorMessage("No se pudo confirmar la cita. Intente de nuevo más tarde.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-10">
      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="text-4xl">🩺</div>
          <h1 className="font-display text-2xl font-semibold">Confirmar cita</h1>
        </header>

        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          {status === "loading" && (
            <div className="text-center space-y-4 py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Confirmando su cita…</p>
            </div>
          )}

          {status === "success" && appointment && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-medium text-lg">¡Cita confirmada!</p>
              <p className="text-sm text-muted-foreground">
                Su cita quedó confirmada para el{" "}
                <strong>
                  {fmtDate(appointment.date)} a las {appointment.time}
                </strong>
                .
              </p>
              <p className="text-sm text-muted-foreground">Recibirá un correo de confirmación.</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4 py-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-medium">No se pudo confirmar</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
