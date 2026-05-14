import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { Printer, ArrowLeft } from "lucide-react";
import { z } from "zod";

const search = z.object({ patientId: z.string().optional() });

export const Route = createFileRoute("/_app/consentimiento")({
  head: () => ({ meta: [{ title: "Consentimiento informado — MedFlow" }] }),
  validateSearch: (s) => search.parse(s),
  component: ConsentPage,
});

function ConsentPage() {
  const { patientId } = Route.useSearch();
  const { patients } = useStore();
  const { branding } = useBranding();
  const patient = patientId ? patients.find((p) => p.id === patientId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/pacientes" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90">
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>

      <article className="bg-card border rounded-2xl p-8 lg:p-12 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0">
        <header className="flex items-start gap-4 border-b pb-6 mb-6">
          <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground grid place-items-center text-2xl">{branding.logoEmoji}</div>
          <div>
            <div className="font-display text-xl font-semibold">{branding.doctorName}</div>
            <div className="text-sm text-muted-foreground">{branding.specialty}</div>
            <div className="text-xs text-muted-foreground mt-1">Cédula {branding.cedula}</div>
          </div>
        </header>

        <h1 className="font-display text-2xl font-semibold mb-4">Aviso sobre el manejo de conducta durante la consulta dental</h1>

        {patient && (
          <div className="text-sm bg-surface rounded-lg p-3 mb-6 border">
            <span className="text-muted-foreground">Paciente:</span> <span className="font-medium">{patient.name}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">Tutor:</span> <span className="font-medium">{patient.guardian}</span>
          </div>
        )}

        <ol className="space-y-3 text-sm leading-relaxed list-decimal pl-5">
          <li>Toda consulta (de primera vez o de valoración subsecuente) y todo tratamiento generan honorarios.</li>
          <li>En la consulta de primera vez la presencia de los padres es indispensable. Durante el tratamiento, los padres permanecen en la recepción (excepto pacientes con alguna necesidad especial), ya que su presencia puede modificar el comportamiento del niño e interferir con el procedimiento. Se hace excepción con menores de 1 año.</li>
          <li className="italic">Papá, mamá: tu hijo estará bien, será tratado con todo el respeto y amor que merece.</li>
          <li>
            Durante el tratamiento, el niño puede llorar por:
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>Su edad — con niños muy pequeños es complicado controlar su conducta.</li>
              <li>El dolor del problema con el que llegan a consulta.</li>
              <li>Su temperamento.</li>
              <li>Experiencias dentales anteriores negativas.</li>
              <li>Ideas erróneas sobre el dentista.</li>
              <li>Los ruidos de los instrumentos.</li>
            </ul>
            <p className="mt-1 italic">Los tratamientos que se realizan no generan dolor; el niño puede llorar por los motivos mencionados, pero nunca porque se le esté lastimando.</p>
          </li>
          <li>Durante el tratamiento, por ningún motivo el padre, madre o tutor deberá abandonar el consultorio.</li>
          <li>En caso de no obtener la cooperación del niño, se recurre a restricción física para limitar sus movimientos y proteger su integridad. Si es necesaria, se les informará antes del procedimiento.</li>
          <li>Asistir con un odontopediatra no garantiza que el niño no llore; garantiza que se realice el tratamiento adecuado y se lleve a término.</li>
          <li>Para proteger la integridad física del niño y de acuerdo con su comportamiento y edad, se le ofrecerá la mejor opción para llevar a cabo el tratamiento.</li>
          <li>El éxito del tratamiento depende del equipo entre papás, paciente y odontopediatra. Los hábitos higiénicos y alimenticios en casa son la base para que los tratamientos tengan más duración.</li>
        </ol>

        <div className="mt-12 pt-6 border-t">
          <div className="text-sm text-muted-foreground mb-1">Nombre y firma del padre, madre o tutor:</div>
          <div className="h-16 border-b border-foreground/40" />
          <div className="mt-6 text-sm text-muted-foreground">Fecha: ____ / ____ / ________</div>
        </div>
      </article>

      <style>{`@media print { aside, header.h-16 { display: none !important; } main { padding: 0 !important; max-width: none !important; } }`}</style>
    </div>
  );
}