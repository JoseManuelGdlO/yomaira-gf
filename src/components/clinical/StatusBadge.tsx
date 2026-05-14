import { type Appointment } from "@/mocks/data";

const styles: Record<Appointment["status"], string> = {
  pendiente: "bg-warning/15 text-warning border-warning/30",
  confirmada: "bg-success/15 text-success border-success/30",
  completada: "bg-muted text-muted-foreground border-border",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
