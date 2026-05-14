import { createFileRoute } from "@tanstack/react-router";
import { useBranding } from "@/lib/theme/ThemeProvider";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — MedFlow" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const { branding } = useBranding();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Datos del consultorio y cuenta</p>
      </div>
      <div className="bg-card border rounded-2xl p-6 space-y-3">
        <Row label="Consultorio" value={branding.clinicName} />
        <Row label="Doctor" value={branding.doctorName} />
        <Row label="Especialidad" value={branding.specialty} />
        <Row label="Cédula profesional" value={branding.cedula} />
        <Row label="Email" value={branding.email} />
        <Row label="Teléfono" value={branding.phone} />
        <Row label="Dirección" value={branding.address} />
      </div>
      <p className="text-xs text-muted-foreground">Para editar la identidad visual, ve a Personalización.</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
