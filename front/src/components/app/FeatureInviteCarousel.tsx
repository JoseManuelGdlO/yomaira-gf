import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Package, ShieldCheck, Brain, BarChart3, Wallet, FileSignature, Bell, Users, Calendar, Pill, Palette,
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type FeatureTip = {
  icon: React.ElementType;
  title: string;
  message: string;
  to: string;
  /** Permiso mínimo para mostrar la tarjeta */
  permission?: string | null;
  /** Requiere acceso a administración (users.read o roles.read) */
  admin?: boolean;
  gradient: string;
};

const TIPS: FeatureTip[] = [
  {
    icon: Package,
    title: "Tu propio inventario",
    message: "Puedes crear tu propio inventario de insumos. Ve a la sección y comienza ya — recibirás alertas cuando el stock esté bajo.",
    to: "/inventario",
    permission: "inventory.read",
    gradient: "from-amber-500/15 to-orange-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Usuarios para tu equipo",
    message: "Crea usuarios para tus trabajadores para que tú no hagas todo. Además controla qué pueden ver y qué no con roles y permisos.",
    to: "/administracion",
    admin: true,
    gradient: "from-violet-500/15 to-purple-500/10",
  },
  {
    icon: Brain,
    title: "Comportamiento del paciente",
    message: "Registra la escala Frankl y detecta tendencias de cooperación. Ideal para planificar sedación y tiempos de consulta.",
    to: "/comportamiento",
    permission: "patients.read",
    gradient: "from-sky-500/15 to-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Estadísticas clínicas",
    message: "Descubre patrones en diagnósticos, medicamentos y consultas. Toma mejores decisiones con insights de los últimos 90 días.",
    to: "/estadisticas",
    permission: "consultations.read",
    gradient: "from-emerald-500/15 to-teal-500/10",
  },
  {
    icon: Wallet,
    title: "Control de finanzas",
    message: "Lleva ingresos, egresos y balance de tu consultorio en un solo lugar. Registra movimientos y consulta resúmenes por periodo.",
    to: "/finanzas",
    permission: "finances.read",
    gradient: "from-green-500/15 to-lime-500/10",
  },
  {
    icon: Users,
    title: "Pacientes con filtros avanzados",
    message: "Busca por nombre, edad, alergias o última visita. Ordena la lista y navega con paginación para encontrar cualquier expediente al instante.",
    to: "/pacientes",
    permission: "patients.read",
    gradient: "from-primary/15 to-accent/10",
  },
  {
    icon: Calendar,
    title: "Agenda inteligente",
    message: "Programa citas, confírmalas y complétalas para actualizar el historial clínico automáticamente.",
    to: "/agenda",
    permission: "appointments.read",
    gradient: "from-indigo-500/15 to-violet-500/10",
  },
  {
    icon: Pill,
    title: "Recetas en segundos",
    message: "Genera recetas imprimibles con tu logo y firma. Disponible desde el dashboard, la lista de pacientes o la sección Recetas.",
    to: "/recetas",
    permission: "prescriptions.read",
    gradient: "from-rose-500/15 to-pink-500/10",
  },
  {
    icon: FileSignature,
    title: "Consentimiento informado",
    message: "Personaliza la carta de consentimiento con tu branding y compártela con los padres antes de cada procedimiento.",
    to: "/consentimiento",
    permission: "patients.read",
    gradient: "from-fuchsia-500/15 to-purple-500/10",
  },
  {
    icon: Bell,
    title: "Notificaciones y Google Calendar",
    message: "Activa avisos por correo o push al crear citas. Conecta Google Calendar para sincronizar tu agenda automáticamente.",
    to: "/configuracion",
    permission: null,
    gradient: "from-cyan-500/15 to-sky-500/10",
  },
  {
    icon: Palette,
    title: "Tu marca en todo el sistema",
    message: "Configura colores, logo, tipografía y firma. Todo —incluyendo recetas— se actualiza al instante con tu identidad.",
    to: "/branding",
    permission: "branding.read",
    gradient: "from-primary/20 to-accent/15",
  },
];

const AUTOPLAY_MS = 5500;

export function FeatureInviteCarousel() {
  const { hasPermission } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  const visibleTips = useMemo(
    () =>
      TIPS.filter((tip) => {
        if (tip.admin) return hasPermission("users.read") || hasPermission("roles.read");
        if (tip.permission === null || tip.permission === undefined) return true;
        return hasPermission(tip.permission);
      }),
    [hasPermission],
  );

  useEffect(() => {
    if (!api || visibleTips.length <= 1) return;

    const onSelect = () => setActive(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();

    const timer = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(timer);
      api.off("select", onSelect);
    };
  }, [api, visibleTips.length]);

  if (visibleTips.length === 0) return null;

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {visibleTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <CarouselItem key={tip.to + tip.title} className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3">
                <Link
                  to={tip.to}
                  className={cn(
                    "group block h-full rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30",
                    "bg-gradient-to-br",
                    tip.gradient,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-sm leading-snug">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{tip.message}</p>
                      <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary group-hover:underline">
                        Ir ahora →
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {visibleTips.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {visibleTips.map((tip, i) => (
            <button
              key={tip.to}
              type="button"
              aria-label={`Ver invitación: ${tip.title}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
