import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar cita — MediFlow" }] }),
  component: AgendarIndexPage,
});

function AgendarIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-16">
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="text-4xl">🩺</div>
        <h1 className="font-display text-2xl font-semibold">Agendar cita</h1>
        <p className="text-sm text-muted-foreground">
          Usa el enlace de agendamiento que te compartió tu consultorio. El enlace tiene la forma{" "}
          <code className="text-xs bg-surface px-1 py-0.5 rounded">/agendar/nombre-consultorio</code>.
        </p>
        <p className="text-sm text-muted-foreground">
          Si eres personal del consultorio,{" "}
          <Link to="/login" className="text-primary hover:underline">
            inicia sesión aquí
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
