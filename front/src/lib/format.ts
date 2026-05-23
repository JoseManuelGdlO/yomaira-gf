// SSR-stable date formatting (avoids locale/timezone hydration mismatches)
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const WEEKDAYS_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function parts(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return { y, m, d };
}

export function fmtShort(iso: string) {
  const { y, m, d } = parts(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
export function fmtLong(iso: string) {
  const { y, m, d } = parts(iso);
  return `${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
}
export function fmtMedium(iso: string) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
export function fmtDay(iso: string) {
  return parts(iso).d;
}
export function fmtMonthShort(iso: string) {
  return MONTHS_SHORT[parts(iso).m - 1];
}
// JS Date getDay: 0 = Sun. We want lunes=0
function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}
export function fmtWeekdayShort(date: Date) {
  return WEEKDAYS_SHORT[weekdayIndex(date)];
}
export function fmtWeekdayLong(date: Date) {
  return WEEKDAYS[weekdayIndex(date)];
}
export function fmtMonthLong(date: Date) {
  return MONTHS_LONG[date.getMonth()];
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
