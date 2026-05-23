import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export function StatCard({ icon: Icon, label, value, hint, accent }: { icon: LucideIcon; label: string; value: string | number; hint?: string; accent?: "primary" | "accent" | "success" | "warning" }) {
  const accentClass = accent === "accent" ? "bg-accent/10 text-accent" : accent === "success" ? "bg-success/15 text-success" : accent === "warning" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="font-display text-3xl font-semibold mt-2">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
