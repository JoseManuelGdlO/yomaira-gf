import { createFileRoute } from "@tanstack/react-router";
import { useBranding } from "@/lib/theme/ThemeProvider";
import { useStore } from "@/lib/store";
import { PrescriptionPreview } from "@/components/prescription/PrescriptionPreview";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/branding")({
  head: () => ({ meta: [{ title: "Personalización — MedFlow" }] }),
  component: BrandingPage,
});

// Convert hex to oklch components string (rough — using sRGB→OKLab approximation via canvas-free formula)
function hexToOklch(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // gamma correct
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

function BrandingPage() {
  const { branding, updateBranding } = useBranding();
  const { patients } = useStore();
  const samplePatient = patients[0];

  const setHex = (key: "primary" | "secondary" | "accent", hex: string) => {
    const oklch = hexToOklch(hex);
    const hexKey = (key + "Hex") as "primaryHex" | "secondaryHex" | "accentHex";
    updateBranding({ [key]: oklch, [hexKey]: hex } as any);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Personalización</h1>
        <p className="text-muted-foreground text-sm mt-1">Define la identidad visual de tu consultorio. Cambia colores, logo, y formato de receta.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card title="Identidad">
            <Input label="Nombre del consultorio" value={branding.clinicName} onChange={(v) => updateBranding({ clinicName: v })} />
            <Input label="Doctor" value={branding.doctorName} onChange={(v) => updateBranding({ doctorName: v })} />
            <Input label="Especialidad" value={branding.specialty} onChange={(v) => updateBranding({ specialty: v })} />
            <Input label="Cédula profesional" value={branding.cedula} onChange={(v) => updateBranding({ cedula: v })} />
            <div>
              <label className="text-sm font-medium">Logo (emoji por demo)</label>
              <input value={branding.logoEmoji} onChange={(e) => updateBranding({ logoEmoji: e.target.value })} maxLength={2} className="mt-1 w-20 h-12 text-2xl text-center rounded-lg bg-surface border" />
            </div>
          </Card>

          <Card title="Colores">
            <div className="grid grid-cols-3 gap-3">
              <ColorPicker label="Primary" value={branding.primaryHex} onChange={(v) => setHex("primary", v)} />
              <ColorPicker label="Secondary" value={branding.secondaryHex} onChange={(v) => setHex("secondary", v)} />
              <ColorPicker label="Accent" value={branding.accentHex} onChange={(v) => setHex("accent", v)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Presets por especialidad</div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.name} onClick={() => {
                    setHex("primary", p.primary);
                    setHex("secondary", p.secondary);
                    setHex("accent", p.accent);
                    updateBranding({ logoEmoji: p.emoji });
                    toast.success(`Preset "${p.name}" aplicado`);
                  }} className="inline-flex items-center gap-2 text-sm bg-surface border rounded-lg px-3 py-1.5 hover:bg-card">
                    <span>{p.emoji}</span> {p.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Receta médica">
            <Input label="Firma" value={branding.signatureName} onChange={(v) => updateBranding({ signatureName: v })} />
            <div>
              <label className="text-sm font-medium">Pie de página</label>
              <textarea value={branding.rxFooter} onChange={(e) => updateBranding({ rxFooter: e.target.value })} rows={2} className="mt-1 w-full p-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Input label="Teléfono" value={branding.phone} onChange={(v) => updateBranding({ phone: v })} />
            <Input label="Dirección" value={branding.address} onChange={(v) => updateBranding({ address: v })} />
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="text-sm font-medium text-muted-foreground">Vista previa de receta en vivo</div>
          <PrescriptionPreview
            rx={{
              id: "preview", patientId: samplePatient.id, date: new Date().toISOString().slice(0, 10),
              diagnosis: "Caries en pieza 64",
              items: [
                { medication: "Ibuprofeno suspensión 100mg/5ml", dose: "5 ml", frequency: "cada 8 horas", duration: "3 días" },
                { medication: "Amoxicilina suspensión 250mg/5ml", dose: "7.5 ml", frequency: "cada 8 horas", duration: "7 días" },
              ],
              indications: "Tomar con alimentos. Mantener buena higiene bucal.",
            }}
            patient={samplePatient}
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-6 space-y-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2 bg-surface border rounded-lg p-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-sm outline-none uppercase" />
      </div>
    </div>
  );
}
