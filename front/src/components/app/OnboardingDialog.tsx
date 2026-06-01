import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBranding } from "@/lib/theme/ThemeProvider";
import {
  Users, Calendar, FileText, Pill, Stethoscope, Palette, Sparkles, ArrowRight, ArrowLeft, Check,
} from "lucide-react";

type Step = {
  icon: React.ElementType;
  title: string;
  body: string;
  bullets?: string[];
  cta?: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bienvenida a tu plataforma clínica",
    body: "Este sistema está personalizado para tu consultorio. Aquí podrás administrar pacientes, agenda, historial clínico y recetas — todo en un solo lugar.",
    bullets: [
      "Diseñada para tu especialidad y branding",
      "Pensada para flujos rápidos en consulta",
      "Tus datos quedan organizados por paciente",
    ],
  },
  {
    icon: Users,
    title: "Pacientes y expediente",
    body: "Desde Pacientes registras nuevos casos, consultas un expediente completo y abres acciones rápidas (vista clínica y receta) sin salir de la lista.",
    bullets: [
      "Botón “Nuevo paciente” para alta inmediata",
      "Icono de ojo: vista rápida del expediente",
      "Icono de píldora: receta express",
    ],
  },
  {
    icon: Calendar,
    title: "Agenda de citas",
    body: "Programa citas para pacientes existentes o registra al paciente al mismo tiempo si es nuevo. Visualiza por semana o día.",
    bullets: [
      "Botón “Nueva cita” con paciente existente o nuevo",
      "Cambia el estado: pendiente, confirmada, cancelada",
      "Acción “Completar” al finalizar la consulta",
    ],
  },
  {
    icon: Stethoscope,
    title: "Cómo se actualiza el historial clínico",
    body: "Cuando completas una cita, capturas diagnóstico, tratamiento y notas. Esa información se añade automáticamente al timeline clínico del paciente.",
    bullets: [
      "Agenda → Completar cita → Registrar consulta",
      "Se actualiza la última visita del paciente",
      "El historial queda firmado por ti como doctora",
    ],
  },
  {
    icon: Pill,
    title: "Recetas imprimibles",
    body: "Genera recetas con tu encabezado, firma y datos profesionales. Escribe libremente los medicamentos, dosis, frecuencia y duración.",
    bullets: [
      "Disponible desde Dashboard, Recetas o lista de pacientes",
      "Vista previa antes de imprimir",
      "Imprime con tu logo, firma y cédula",
    ],
  },
  {
    icon: Palette,
    title: "Personalización de tu marca",
    body: "En la sección Personalización configuras logo, colores, tipografía, encabezado y firma. Todo el sistema (incluyendo recetas) se actualiza al instante.",
    cta: "Empezar a usar el sistema",
  },
];

export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { branding } = useBranding();
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  const close = () => {
    onOpenChange(false);
    try { localStorage.setItem("onboarding-seen", "1"); } catch {}
    setTimeout(() => setStep(0), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Hero */}
        <div
          className="px-8 pt-8 pb-6 text-white relative"
          style={{ background: `linear-gradient(135deg, oklch(${branding.primary}), oklch(${branding.accent}))` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
              <Icon className="h-6 w-6" />
            </div>
            <div className="text-xs uppercase tracking-wider opacity-80">
              Paso {step + 1} de {STEPS.length}
            </div>
          </div>
          <DialogTitle className="font-display text-2xl font-semibold leading-tight">{s.title}</DialogTitle>
          <DialogDescription className="text-sm opacity-90 mt-2 text-white/80">{s.body}</DialogDescription>
          <div className="absolute -right-6 -bottom-6 text-[8rem] opacity-15 select-none">
            {branding.logoEmoji}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-3 min-h-[140px]">
          {s.bullets?.map((b) => (
            <div key={b} className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center mt-0.5 shrink-0">
                <Check className="h-3 w-3" />
              </div>
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-surface/50 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Ir al paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
            )}
            <button onClick={close} className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
              Saltar
            </button>
            {!isLast ? (
              <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={close} className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">
                {s.cta ?? "Listo"} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
