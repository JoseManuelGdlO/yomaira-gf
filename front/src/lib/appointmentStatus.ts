import type { Appointment } from "@/mocks/data";

export const APPOINTMENT_STATUS_LABELS: Record<Appointment["status"], string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

/** Colores alineados con StatusBadge */
const statusStyles: Record<
  Appointment["status"],
  { card: string; time: string; row: string; legend: string }
> = {
  pendiente: {
    card: "bg-warning/10 border-warning/35 hover:bg-warning/15",
    time: "text-warning",
    row: "border-l-warning bg-warning/5",
    legend: "bg-warning",
  },
  confirmada: {
    card: "bg-success/10 border-success/35 hover:bg-success/15",
    time: "text-success",
    row: "border-l-success bg-success/5",
    legend: "bg-success",
  },
  completada: {
    card: "bg-muted/60 border-border hover:bg-muted/80",
    time: "text-muted-foreground",
    row: "border-l-muted-foreground/50 bg-muted/30",
    legend: "bg-muted-foreground",
  },
  cancelada: {
    card: "bg-destructive/10 border-destructive/35 hover:bg-destructive/15 opacity-75",
    time: "text-destructive",
    row: "border-l-destructive bg-destructive/5 opacity-75",
    legend: "bg-destructive",
  },
};

export function appointmentStatusCardClass(status: Appointment["status"]) {
  return statusStyles[status].card;
}

export function appointmentStatusTimeClass(status: Appointment["status"]) {
  return statusStyles[status].time;
}

export function appointmentStatusRowClass(status: Appointment["status"]) {
  return statusStyles[status].row;
}

export function appointmentStatusLegendClass(status: Appointment["status"]) {
  return statusStyles[status].legend;
}

export const AGENDA_LEGEND_STATUSES: Appointment["status"][] = [
  "pendiente",
  "confirmada",
  "completada",
  "cancelada",
];
