import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  History,
  Palette,
  Settings,
  Search,
  FileSignature,
  ShieldCheck,
  LogOut,
  Menu,
  Brain,
  BarChart3,
  Package,
  Wallet,
  Building2,
  X,
} from "lucide-react";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth-guard";
import { canAccessNav } from "@/lib/permissions";
import { usePlatformTenant } from "@/lib/platformTenant";
import { useViewAs } from "@/lib/viewAs";
import { api } from "@/lib/api";
import { ViewAsSelector } from "@/components/admin/ViewAsSelector";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const BASE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/comportamiento", label: "Comportamiento", icon: Brain },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/recetas", label: "Recetas", icon: Pill },
  { to: "/inventario", label: "Inventario", icon: Package },
  { to: "/finanzas", label: "Finanzas", icon: Wallet },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/consentimiento", label: "Consentimiento", icon: FileSignature },
  { to: "/branding", label: "Personalización", icon: Palette },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export function AppShell() {
  const { branding } = useBranding();
  const { user, hasPermission, logout } = useAuth();
  const { enteredTenant, exitTenant } = usePlatformTenant();
  const { viewingAs, setViewingAs, effectiveHasPermission } = useViewAs();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isPlatform = !!(user && isPlatformAdmin(user));
  const inTenantPreview = isPlatform && !!enteredTenant;
  const permCheck =
    viewingAs ? effectiveHasPermission : inTenantPreview ? () => true : hasPermission;

  const usersQ = useQuery({
    queryKey: ["platform", "tenant-users", enteredTenant?.id],
    queryFn: () => api.tenants.users(enteredTenant!.id),
    enabled: inTenantPreview,
  });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const handleExitTenant = () => {
    setViewingAs(null);
    exitTenant();
    navigate({ to: "/consultorios" });
  };

  const displayName = viewingAs?.name ?? user?.name ?? branding.doctorName;
  const displayEmail = viewingAs?.email ?? user?.email;

  const nav = useMemo((): NavItem[] => {
    if (isPlatform && !enteredTenant) {
      return [{ to: "/consultorios", label: "Consultorios", icon: Building2 }];
    }

    const showAdmin =
      inTenantPreview && !viewingAs
        ? true
        : permCheck("users.read") || permCheck("roles.read");
    const items: NavItem[] = BASE_NAV.filter((item) => {
      if (item.to === "/configuracion") {
        return (
          permCheck("branding.read") ||
          permCheck("branding.write") ||
          permCheck("clinical_questions.read") ||
          permCheck("clinical_questions.write")
        );
      }
      return canAccessNav(item.to, permCheck);
    });

    if (showAdmin) {
      items.push({ to: "/administracion", label: "Administración", icon: ShieldCheck });
    }

    if (inTenantPreview) {
      items.unshift({ to: "/consultorios", label: "Consultorios", icon: Building2 });
    }

    return items;
  }, [permCheck, isPlatform, enteredTenant, inTenantPreview]);

  const [q, setQ] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { patients } = useStore();
  const showPatientSearch = !isPlatform || inTenantPreview;
  const results =
    showPatientSearch && q.length > 1
      ? patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
      : [];

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const topBannerOffset = viewingAs || (inTenantPreview && !viewingAs) ? "pt-10" : "";

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center text-xl shadow-sm">
          {branding.logoEmoji}
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-semibold truncate">{branding.clinicName}</div>
          <div className="text-xs text-muted-foreground truncate">{branding.specialty}</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Sesión</div>
          <div className="text-sm font-medium truncate">{displayName}</div>
          {displayEmail && <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>}
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void handleLogout();
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex min-h-screen w-full bg-surface ${topBannerOffset}`}>
      {inTenantPreview && !viewingAs && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-700 text-white py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 text-sm font-medium truncate">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>
              Consultorio: <strong>{enteredTenant.clinicName}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitTenant}
            className="text-white hover:bg-white/10 gap-1.5 shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Salir del consultorio</span>
          </Button>
        </div>
      )}

      {inTenantPreview && (
        <ViewAsSelector
          users={usersQ.data ?? []}
          viewingAs={viewingAs}
          onSelectUser={setViewingAs}
        />
      )}

      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        {sidebarContent()}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`h-16 border-b bg-card flex items-center px-4 lg:px-8 gap-3 sticky z-30 ${viewingAs || (inTenantPreview && !viewingAs) ? "top-10" : "top-0"}`}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              {branding.logoEmoji}
            </div>
            <span className="font-display font-semibold truncate">{branding.clinicName}</span>
          </div>
          <div className="flex-1 max-w-xl relative">
            {showPatientSearch ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ) : null}
            {results.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to="/pacientes/$id"
                    params={{ id: p.id }}
                    onClick={() => setQ("")}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/10"
                  >
                    <div
                      className="h-8 w-8 rounded-full grid place-items-center text-sm font-semibold"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.age} años · {p.guardian}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg text-sm">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="leading-tight max-w-[140px] lg:max-w-[200px]">
                <div className="font-medium truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {displayEmail ?? branding.specialty}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-surface transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Navegación principal de la aplicación</SheetDescription>
          <div className="flex h-full flex-col">{sidebarContent(closeMobileMenu)}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
