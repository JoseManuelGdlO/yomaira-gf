import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { clearSession, homeRouteForUser, redirectIfAuthenticated } from "@/lib/auth-guard";
import { MediFlowLogo } from "@/components/app/MediFlowLogo";
import { MEDIFLOW_PLATFORM } from "@/lib/theme/platformBranding";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: `Iniciar sesión — ${MEDIFLOW_PLATFORM.name}` }],
  }),
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
});

function LoginPage() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate({ to: homeRouteForUser(user) });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Ingresa tu correo y contraseña");
      return;
    }
    setBusy(true);
    try {
      clearSession();
      const res = await login(email.trim(), password);
      toast.success("Bienvenido");
      navigate({ to: homeRouteForUser(res.user) });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión. Verifica tus credenciales.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const isLoading = loading || busy;
  const gradient = `linear-gradient(135deg, ${MEDIFLOW_PLATFORM.primaryHex}, ${MEDIFLOW_PLATFORM.accentHex})`;

  return (
    <div className="min-h-screen w-full flex items-stretch bg-surface">
      <div
        className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden text-white"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="rounded-2xl bg-white/95 p-6 shadow-xl mb-8">
            <MediFlowLogo imgClassName="max-w-[240px] mx-auto" />
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{MEDIFLOW_PLATFORM.name}</h1>
          <p className="mt-3 text-base opacity-95">{MEDIFLOW_PLATFORM.tagline}</p>
          <p className="mt-2 text-sm opacity-80">{MEDIFLOW_PLATFORM.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center">
            <MediFlowLogo imgClassName="max-w-[180px]" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Entra con tu cuenta — cada consultorio conserva su propia personalización
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Correo</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg border bg-card text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contraseña</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg border bg-card text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Entrar
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/privacidad" search={{ from: "login" }} className="hover:text-foreground hover:underline">
              Política de privacidad
            </Link>
            {" · "}
            {MEDIFLOW_PLATFORM.name} · Plataforma para consultorios
          </p>
        </div>
      </div>
    </div>
  );
}
