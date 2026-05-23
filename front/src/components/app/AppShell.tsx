import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, Calendar, Pill, History, Palette, Settings, Search, FileSignature, ShieldCheck, LogOut } from "lucide-react";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth";
import { canAccessNav } from "@/lib/permissions";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";

const BASE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/recetas", label: "Recetas", icon: Pill },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/consentimiento", label: "Consentimiento", icon: FileSignature },
  { to: "/branding", label: "Personalización", icon: Palette },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

export function AppShell() {
  const { branding } = useBranding();
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const displayName = user?.name ?? branding.doctorName;
  const displayEmail = user?.email;
  const nav = useMemo(() => {
    const showAdmin = hasPermission("users.read") || hasPermission("roles.read");
    const items = BASE_NAV.filter((item) => {
      if (item.to === "/configuracion") {
        return (
          hasPermission("branding.read") ||
          hasPermission("branding.write") ||
          hasPermission("clinical_questions.read") ||
          hasPermission("clinical_questions.write")
        );
      }
      return canAccessNav(item.to, hasPermission);
    });
    if (showAdmin) {
      items.push({ to: "/administracion", label: "Administración", icon: ShieldCheck });
    }
    return items;
  }, [hasPermission]);
  const [q, setQ] = useState("");
  const { patients } = useStore();
  const results = q.length > 1 ? patients.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center text-xl shadow-sm">
            {branding.logoEmoji}
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold truncate">{branding.clinicName}</div>
            <div className="text-xs text-muted-foreground truncate">{branding.specialty}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
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
            {displayEmail && (
              <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">{branding.logoEmoji}</div>
            <span className="font-display font-semibold">{branding.clinicName}</span>
          </div>
          <div className="flex-1 max-w-xl relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar paciente..."
                className="w-full pl-10 pr-4 h-10 rounded-lg bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {results.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
                {results.map((p) => (
                  <Link key={p.id} to="/pacientes/$id" params={{ id: p.id }} onClick={() => setQ("")} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/10">
                    <div className="h-8 w-8 rounded-full grid place-items-center text-sm font-semibold" style={{ backgroundColor: p.avatarColor }}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.age} años · {p.guardian}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg text-sm">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                {displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
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
    </div>
  );
}
