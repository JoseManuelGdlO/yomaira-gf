import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { clearSession, redirectIfAuthenticated } from "@/lib/auth-guard";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — MedFlow" }] }),
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
});

function LoginPage() {
  const { login, loading, user } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate({ to: "/dashboard" });
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
      await login(email.trim(), password);
      toast.success("Bienvenido");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión. Verifica tus credenciales.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const isLoading = loading || busy;

  return (
    <div className="min-h-screen w-full flex items-stretch bg-surface">
      <div
        className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, oklch(${branding.primary} / 0.92), oklch(${branding.accent} / 0.88))`,
        }}
      >
        <div className="absolute -right-10 -bottom-10 text-[20rem] opacity-15 select-none leading-none">
          {branding.logoEmoji}
        </div>
        <div className="relative z-10 max-w-md px-12">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur grid place-items-center text-3xl mb-8 border border-white/20">
            {branding.logoEmoji}
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight">{branding.clinicName}</h1>
          <p className="mt-3 text-base opacity-90">{branding.specialty}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center space-y-2">
            <div className="text-4xl">{branding.logoEmoji}</div>
            <h1 className="font-display text-2xl font-semibold">{branding.clinicName}</h1>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">Accede al panel del consultorio</p>
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
                  placeholder="admin@medflow.local"
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
        </div>
      </div>
    </div>
  );
}
