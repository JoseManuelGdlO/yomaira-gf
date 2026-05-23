import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureAnyPermission } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useStore } from "@/lib/store";
import { PrescriptionPreview } from "@/components/prescription/PrescriptionPreview";
import { ConsentDocument } from "@/components/consent/ConsentDocument";
import { ConsentFormEditor } from "@/components/consent/ConsentFormEditor";
import { getConsentContent } from "@/lib/consent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/branding")({
  head: () => ({ meta: [{ title: "Personalización — MediFlow" }] }),
  beforeLoad: () => ensureAnyPermission("branding.read", "branding.write"),
  component: BrandingPage,
});

function hexToOklch(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (v: number) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const R = lin(r), G = lin(g), B = lin(b);
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}`;
}

const PRESETS = [
  { name: "Odontopediatría", primary: "#B100D4", secondary: "#DDB7E8", accent: "#2D4D8F", emoji: "🦷" },
  { name: "Cardiología", primary: "#C8102E", secondary: "#F4C7CF", accent: "#1F3A8A", emoji: "❤️" },
  { name: "Dermatología", primary: "#0FB5BA", secondary: "#BCE7E9", accent: "#10A37F", emoji: "✨" },
  { name: "Pediatría", primary: "#F97316", secondary: "#FED7AA", accent: "#0EA5E9", emoji: "🧸" },
  { name: "Neurología", primary: "#6366F1", secondary: "#C7D2FE", accent: "#0F766E", emoji: "🧠" },
];

type BrandingTab = "identidad" | "receta" | "consentimiento";

function tabFromHash(): BrandingTab {
  if (typeof window === "undefined") return "identidad";
  if (window.location.hash === "#consentimiento") return "consentimiento";
  return "identidad";
}

function BrandingPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("branding.write");
  const { branding, updateBranding } = useBranding();
  const { patients } = useStore();
  const samplePatient = patients[0];
  const consent = getConsentContent(branding);
  const [tab, setTab] = useState<BrandingTab>(tabFromHash);

  useEffect(() => {
    const sync = () => setTab(tabFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const onTabChange = (value: string) => {
    const next = value as BrandingTab;
    setTab(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", next === "consentimiento" ? "#consentimiento" : window.location.pathname);
    }
  };

  const setHex = (key: "primary" | "secondary" | "accent", hex: string) => {
    const oklch = hexToOklch(hex);
    const hexKey = (key + "Hex") as "primaryHex" | "secondaryHex" | "accentHex";
    updateBranding({ [key]: oklch, [hexKey]: hex } as Parameters<typeof updateBranding>[0]);
  };

  const editableClass = !canWrite ? "pointer-events-none opacity-60" : "";

  const previewRx = {
    id: "preview",
    patientId: samplePatient?.id ?? "preview",
    date: new Date().toISOString().slice(0, 10),
    diagnosis: "Caries en pieza 64",
    items: [
      { medication: "Ibuprofeno suspensión 100mg/5ml", dose: "5 ml", frequency: "cada 8 horas", duration: "3 días" },
      { medication: "Amoxicilina suspensión 250mg/5ml", dose: "7.5 ml", frequency: "cada 8 horas", duration: "7 días" },
    ],
    indications: "Tomar con alimentos. Mantener buena higiene bucal.",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Personalización</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Identidad visual, recetas y carta de consentimiento de tu consultorio.
        </p>
        {!canWrite && (
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
            Solo lectura: no tienes permiso para modificar la personalización.
          </p>
        )}
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="h-auto w-full flex flex-wrap justify-start gap-1 bg-surface p-1 rounded-xl border">
          <TabsTrigger value="identidad" className="rounded-lg px-4 py-2">
            Identidad y colores
          </TabsTrigger>
          <TabsTrigger value="receta" className="rounded-lg px-4 py-2">
            Receta médica
          </TabsTrigger>
          <TabsTrigger value="consentimiento" className="rounded-lg px-4 py-2">
            Consentimiento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identidad" className="mt-0 space-y-6">
          <div className={`grid lg:grid-cols-2 gap-6 ${editableClass}`}>
            <Card title="Identidad del consultorio">
              <Input label="Nombre del consultorio" value={branding.clinicName} onChange={(v) => updateBranding({ clinicName: v })} />
              <Input label="Doctor" value={branding.doctorName} onChange={(v) => updateBranding({ doctorName: v })} />
              <Input label="Especialidad" value={branding.specialty} onChange={(v) => updateBranding({ specialty: v })} />
              <Input label="Cédula profesional" value={branding.cedula} onChange={(v) => updateBranding({ cedula: v })} />
              <div>
                <label className="text-sm font-medium">Logo (emoji)</label>
                <input
                  value={branding.logoEmoji}
                  onChange={(e) => updateBranding({ logoEmoji: e.target.value })}
                  maxLength={2}
                  className="mt-1 w-20 h-12 text-2xl text-center rounded-lg bg-surface border"
                />
              </div>
            </Card>

            <Card title="Colores del consultorio">
              <p className="text-sm text-muted-foreground -mt-2">
                Elige los tres colores que verán tus pacientes en la app, recetas e impresos.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <ColorPicker
                  label="Color principal"
                  hint="Botones, menú seleccionado y elementos importantes"
                  value={branding.primaryHex}
                  onChange={(v) => setHex("primary", v)}
                />
                <ColorPicker
                  label="Color claro de fondo"
                  hint="Tarjetas, campos y zonas suaves de la pantalla"
                  value={branding.secondaryHex}
                  onChange={(v) => setHex("secondary", v)}
                />
                <ColorPicker
                  label="Color de detalle"
                  hint="Encabezado de recetas, textos destacados y pie de documentos"
                  value={branding.accentHex}
                  onChange={(v) => setHex("accent", v)}
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Plantillas listas por especialidad</div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setHex("primary", p.primary);
                        setHex("secondary", p.secondary);
                        setHex("accent", p.accent);
                        updateBranding({ logoEmoji: p.emoji });
                        toast.success(`Preset "${p.name}" aplicado`);
                      }}
                      className="inline-flex items-center gap-2 text-sm bg-surface border rounded-lg px-3 py-1.5 hover:bg-card"
                    >
                      <span>{p.emoji}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Los cambios se ven de inmediato en la aplicación. También puedes elegir una plantilla y ajustar los colores después.
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receta" className="mt-0">
          <div className={`grid lg:grid-cols-2 gap-6 items-start ${editableClass}`}>
            <Card title="Datos de la receta">
              <Input label="Firma" value={branding.signatureName} onChange={(v) => updateBranding({ signatureName: v })} />
              <div>
                <label className="text-sm font-medium">Pie de página</label>
                <textarea
                  value={branding.rxFooter}
                  onChange={(e) => updateBranding({ rxFooter: e.target.value })}
                  rows={2}
                  className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Input label="Teléfono" value={branding.phone} onChange={(v) => updateBranding({ phone: v })} />
              <Input label="Dirección" value={branding.address} onChange={(v) => updateBranding({ address: v })} />
            </Card>
            {samplePatient && (
              <div className="lg:sticky lg:top-24">
                <p className="text-sm font-medium text-muted-foreground mb-3">Vista previa</p>
                <PrescriptionPreview rx={previewRx} patient={samplePatient} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="consentimiento" className="mt-0" id="consentimiento">
          <div className={`grid lg:grid-cols-2 gap-6 items-start ${editableClass}`}>
            <Card title="Contenido de la carta">
              <p className="text-sm text-muted-foreground -mt-2">
                Personaliza el título y los puntos. Cada consultorio puede tener su propio texto.
              </p>
              <ConsentFormEditor
                title={consent.title}
                points={consent.points}
                onSave={(patch) => updateBranding(patch)}
              />
            </Card>
            {samplePatient && (
              <div className="lg:sticky lg:top-24">
                <p className="text-sm font-medium text-muted-foreground mb-3">Vista previa</p>
                <ConsentDocument branding={branding} patient={samplePatient} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-card border rounded-2xl p-6 space-y-4 scroll-mt-24">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ColorPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-surface/40 p-3">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5 mb-2">{hint}</p>}
      <div className="flex items-center gap-2 bg-card border rounded-lg p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none uppercase"
        />
      </div>
    </div>
  );
}
