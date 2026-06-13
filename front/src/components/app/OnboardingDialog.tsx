import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import {
  Users, Calendar, Pill, Stethoscope, Palette, Sparkles, ArrowRight, ArrowLeft, Check,
  Brain, BarChart3, Package, Wallet, ShieldCheck, FileSignature, Settings, ExternalLink,
} from "lucide-react";

type Step = {
  icon: React.ElementType;
  title: string;
  body: string;
  bullets?: string[];
  cta?: string;
  linkTo?: string;
  linkLabel?: string;
  /** Atajos interactivos en el paso de bienvenida */
  quickLinks?: { label: string; step: number }[];
  /** Solo mostrar si el usuario tiene este permiso (o admin) */
  permission?: string | null;
  admin?: boolean;
};

const ALL_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bienvenida a tu plataforma clínica",
    body: "Este sistema está personalizado para tu consultorio. Explora cada módulo con el tutorial o salta directo a lo que más te interese.",
    bullets: [
      "Pacientes, agenda, historial y recetas en un solo lugar",
      "Inventario, finanzas y estadísticas para tu consultorio",
      "Usuarios, permisos y notificaciones configurables",
    ],
    quickLinks: [
      { label: "Pacientes", step: 1 },
      { label: "Agenda", step: 2 },
      { label: "Estadísticas", step: 6 },
      { label: "Inventario", step: 7 },
      { label: "Equipo", step: 9 },
    ],
  },
  {
    icon: Users,
    title: "Pacientes y expediente",
    body: "Registra nuevos casos, filtra por edad, alergias o última visita, y abre acciones rápidas sin salir de la lista.",
    bullets: [
      "Filtros avanzados y ordenamiento por nombre, edad o visita",
      "Paginación para listas grandes de pacientes",
      "Vista rápida (ojo) y receta express (píldora)",
      "Eliminar pacientes si tienes el permiso correspondiente",
    ],
    linkTo: "/pacientes",
    linkLabel: "Ir a Pacientes",
    permission: "patients.read",
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
    linkTo: "/agenda",
    linkLabel: "Ir a Agenda",
    permission: "appointments.read",
  },
  {
    icon: Stethoscope,
    title: "Historial clínico automático",
    body: "Cuando completas una cita, capturas diagnóstico, tratamiento y notas. Esa información se añade al timeline del paciente.",
    bullets: [
      "Agenda → Completar cita → Registrar consulta",
      "Se actualiza la última visita del paciente",
      "El historial queda firmado por ti como doctora",
    ],
    linkTo: "/historial",
    linkLabel: "Ver historial",
    permission: "consultations.read",
  },
  {
    icon: Pill,
    title: "Recetas imprimibles",
    body: "Genera recetas con tu encabezado, firma y datos profesionales. Escribe libremente medicamentos, dosis, frecuencia y duración.",
    bullets: [
      "Disponible desde Dashboard, Recetas o lista de pacientes",
      "Vista previa antes de imprimir",
      "Imprime con tu logo, firma y cédula",
    ],
    linkTo: "/recetas",
    linkLabel: "Crear receta",
    permission: "prescriptions.read",
  },
  {
    icon: Brain,
    title: "Comportamiento del paciente",
    body: "Registra la escala Frankl en cada consulta y detecta tendencias de cooperación. El dashboard te alerta sobre pacientes que requieren atención especial.",
    bullets: [
      "Escala Frankl I–IV en el expediente y al completar citas",
      "Filtros por tendencia: mejora, estable o declive",
      "Alertas de sedación o tiempo extra en citas de hoy",
    ],
    linkTo: "/comportamiento",
    linkLabel: "Ver comportamiento",
    permission: "patients.read",
  },
  {
    icon: BarChart3,
    title: "Estadísticas e insights",
    body: "Analiza consultas, diagnósticos y medicamentos más frecuentes. El dashboard muestra un resumen; la sección Estadísticas tiene el detalle completo.",
    bullets: [
      "Tendencia de consultas por mes",
      "Top medicamentos y diagnósticos",
      "Insights automáticos para decisiones clínicas",
    ],
    linkTo: "/estadisticas",
    linkLabel: "Ver estadísticas",
    permission: "consultations.read",
  },
  {
    icon: Package,
    title: "Inventario de insumos",
    body: "Crea tu propio catálogo de materiales y medicamentos. Define stock mínimo y recibe alertas en el dashboard cuando algo esté por agotarse.",
    bullets: [
      "Alta, edición y baja de insumos",
      "Cantidad, unidad y stock mínimo por producto",
      "Alerta visual en dashboard con stock bajo",
    ],
    linkTo: "/inventario",
    linkLabel: "Ir a Inventario",
    permission: "inventory.read",
  },
  {
    icon: Wallet,
    title: "Finanzas del consultorio",
    body: "Registra ingresos y egresos, consulta el balance y filtra por periodo. Mantén el control financiero sin salir de la plataforma.",
    bullets: [
      "Movimientos con categoría y notas",
      "Resumen de ingresos, egresos y balance",
      "Filtros por rango de fechas",
    ],
    linkTo: "/finanzas",
    linkLabel: "Ir a Finanzas",
    permission: "finances.read",
  },
  {
    icon: ShieldCheck,
    title: "Usuarios, roles y permisos",
    body: "Crea usuarios para tus trabajadores para que tú no hagas todo. Asigna roles y controla exactamente qué puede ver y hacer cada persona.",
    bullets: [
      "Alta de usuarios con correo y contraseña",
      "Roles predefinidos o personalizados",
      "Permisos granulares por sección (pacientes, inventario, etc.)",
    ],
    linkTo: "/administracion",
    linkLabel: "Gestionar equipo",
    admin: true,
  },
  {
    icon: FileSignature,
    title: "Consentimiento informado",
    body: "Personaliza la carta de consentimiento con los colores y datos de tu consultorio. Imprímela o compártela con los padres de tus pacientes.",
    bullets: [
      "Texto editable con variables del paciente",
      "Aplica tu branding automáticamente",
      "Vista previa e impresión",
    ],
    linkTo: "/consentimiento",
    linkLabel: "Ver consentimiento",
    permission: "patients.read",
  },
  {
    icon: Settings,
    title: "Configuración del consultorio",
    body: "Datos del consultorio, preguntas personalizadas del expediente, notificaciones por correo/push y sincronización con Google Calendar.",
    bullets: [
      "Edita preguntas de la historia clínica",
      "Activa avisos al crear, confirmar o cancelar citas",
      "Conecta Google Calendar para sincronizar citas",
    ],
    linkTo: "/configuracion",
    linkLabel: "Ir a Configuración",
    permission: null,
  },
  {
    icon: Palette,
    title: "Personalización de tu marca",
    body: "Configura logo, colores, tipografía, encabezado y firma. Todo el sistema —incluyendo recetas y consentimiento— se actualiza al instante.",
    bullets: [
      "Colores primary, secondary y accent en vivo",
      "Logo, firma y foto de perfil",
      "Preview de receta con tus cambios",
    ],
    linkTo: "/branding",
    linkLabel: "Personalizar marca",
    permission: "branding.read",
    cta: "Empezar a usar el sistema",
  },
];

function stepVisible(step: Step, hasPermission: (p: string) => boolean): boolean {
  if (step.admin) return hasPermission("users.read") || hasPermission("roles.read");
  if (step.permission === null || step.permission === undefined) {
    if (step.linkTo === "/configuracion") {
      return (
        hasPermission("branding.read") ||
        hasPermission("branding.write") ||
        hasPermission("clinical_questions.read") ||
        hasPermission("clinical_questions.write")
      );
    }
    return true;
  }
  return hasPermission(step.permission);
}

export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { branding } = useBranding();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const steps = ALL_STEPS.filter((s) => stepVisible(s, hasPermission));
  const [step, setStep] = useState(0);
  const s = steps[step] ?? steps[0];
  const Icon = s?.icon ?? Sparkles;
  const isLast = step === steps.length - 1;

  const close = () => {
    onOpenChange(false);
    try { localStorage.setItem("onboarding-seen", "1"); } catch {}
    setTimeout(() => setStep(0), 300);
  };

  const goToSection = (path: string) => {
    close();
    navigate({ to: path });
  };

  if (!s) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Hero */}
        <div
          className="px-8 pt-8 pb-6 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, oklch(${branding.primary}), oklch(${branding.accent}))` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-xs uppercase tracking-wider opacity-80">
                  Paso {step + 1} de {steps.length}
                </div>
              </div>
              <DialogTitle className="font-display text-2xl font-semibold leading-tight">{s.title}</DialogTitle>
              <DialogDescription className="text-sm opacity-90 mt-2 text-white/80">{s.body}</DialogDescription>
            </motion.div>
          </AnimatePresence>
          <div className="absolute -right-6 -bottom-6 text-[8rem] opacity-15 select-none pointer-events-none">
            {branding.logoEmoji}
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-white/70"
              initial={false}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`body-${step}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="px-8 py-6 space-y-3 min-h-[160px]"
          >
            {s.bullets?.map((b) => (
              <div key={b} className="flex items-start gap-3 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center mt-0.5 shrink-0">
                  <Check className="h-3 w-3" />
                </div>
                <span>{b}</span>
              </div>
            ))}

            {s.quickLinks && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Explora un tema directamente:</p>
                <div className="flex flex-wrap gap-2">
                  {s.quickLinks.map((ql) => {
                    const targetIdx = steps.findIndex((st) => st.title === ALL_STEPS[ql.step]?.title);
                    if (targetIdx < 0) return null;
                    return (
                      <button
                        key={ql.label}
                        type="button"
                        onClick={() => setStep(targetIdx)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border bg-surface hover:bg-primary/10 hover:border-primary/30 transition-colors"
                      >
                        {ql.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {s.linkTo && s.linkLabel && (
              <button
                type="button"
                onClick={() => goToSection(s.linkTo!)}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {s.linkLabel} — probar ahora
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-surface/50 flex items-center justify-between gap-4">
          <div className="flex gap-1.5 flex-wrap max-w-[45%]">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Ir al paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
