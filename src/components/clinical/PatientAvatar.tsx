import { type Patient } from "@/mocks/data";

export function PatientAvatar({ patient, size = 40 }: { patient: Patient; size?: number }) {
  const initials = patient.name.split(" ").slice(0, 2).map((n) => n.charAt(0)).join("");
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-foreground/80 shrink-0"
      style={{ width: size, height: size, backgroundColor: patient.avatarColor, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
