export type Patient = {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  gender: "M" | "F";
  guardian: string;
  guardianPhone: string;
  email: string;
  allergies: string[];
  conditions: string[];
  bloodType: string;
  lastVisit: string;
  avatarColor: string;
};

export type Consultation = {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  doctor: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  date: string; // ISO
  time: string;
  reason: string;
  status: "pendiente" | "confirmada" | "completada" | "cancelada";
};

export type Medication = { name: string; presentation: string };

export type PrescriptionItem = {
  medication: string;
  dose: string;
  frequency: string;
  duration: string;
};

export type Prescription = {
  id: string;
  patientId: string;
  date: string;
  items: PrescriptionItem[];
  indications: string;
  diagnosis: string;
};

const colors = ["#FCE4F5", "#E4E8FC", "#FCE9D6", "#E4FCEA", "#F3E4FC", "#FCEAE4", "#E4F4FC", "#FCF7E4"];

export const PATIENTS: Patient[] = [
  { id: "p1", name: "Sofía Martínez Ruiz", age: 6, birthDate: "2019-03-12", gender: "F", guardian: "Laura Ruiz", guardianPhone: "+52 55 1111 2222", email: "laura.ruiz@mail.com", allergies: ["Penicilina"], conditions: ["Caries en molares"], bloodType: "O+", lastVisit: "2025-05-02", avatarColor: colors[0] },
  { id: "p2", name: "Mateo Hernández López", age: 4, birthDate: "2021-07-22", gender: "M", guardian: "Carlos Hernández", guardianPhone: "+52 55 3333 4444", email: "carlos.h@mail.com", allergies: [], conditions: ["Mordida cruzada"], bloodType: "A+", lastVisit: "2025-05-08", avatarColor: colors[1] },
  { id: "p3", name: "Valentina Cruz Mora", age: 8, birthDate: "2017-11-05", gender: "F", guardian: "Ana Mora", guardianPhone: "+52 55 5555 6666", email: "ana.mora@mail.com", allergies: ["Lidocaína"], conditions: [], bloodType: "B+", lastVisit: "2025-05-10", avatarColor: colors[2] },
  { id: "p4", name: "Diego Ramírez Soto", age: 5, birthDate: "2020-09-18", gender: "M", guardian: "Rosa Soto", guardianPhone: "+52 55 7777 8888", email: "rosa.soto@mail.com", allergies: [], conditions: ["Bruxismo nocturno"], bloodType: "O+", lastVisit: "2025-04-28", avatarColor: colors[3] },
  { id: "p5", name: "Camila Torres Vega", age: 7, birthDate: "2018-02-14", gender: "F", guardian: "Pedro Torres", guardianPhone: "+52 55 9999 0000", email: "pedro.t@mail.com", allergies: [], conditions: ["Frenillo lingual corto"], bloodType: "AB+", lastVisit: "2025-05-12", avatarColor: colors[4] },
  { id: "p6", name: "Lucas Gómez Peña", age: 3, birthDate: "2022-06-30", gender: "M", guardian: "Marta Peña", guardianPhone: "+52 55 1212 3434", email: "marta.p@mail.com", allergies: ["Látex"], conditions: [], bloodType: "A-", lastVisit: "2025-05-13", avatarColor: colors[5] },
  { id: "p7", name: "Renata Flores Ortiz", age: 9, birthDate: "2016-12-01", gender: "F", guardian: "Luis Flores", guardianPhone: "+52 55 5656 7878", email: "luis.f@mail.com", allergies: [], conditions: ["Apiñamiento dental"], bloodType: "O-", lastVisit: "2025-05-09", avatarColor: colors[6] },
  { id: "p8", name: "Santiago Vargas Lima", age: 6, birthDate: "2019-08-25", gender: "M", guardian: "Patricia Lima", guardianPhone: "+52 55 9090 1212", email: "pat.lima@mail.com", allergies: [], conditions: [], bloodType: "B+", lastVisit: "2025-04-20", avatarColor: colors[7] },
  { id: "p9", name: "Isabella Ruiz Cano", age: 5, birthDate: "2020-04-10", gender: "F", guardian: "Sofía Cano", guardianPhone: "+52 55 3232 4545", email: "sofia.cano@mail.com", allergies: [], conditions: ["Hipoplasia de esmalte"], bloodType: "A+", lastVisit: "2025-05-11", avatarColor: colors[0] },
  { id: "p10", name: "Emiliano Castro Díaz", age: 7, birthDate: "2018-01-19", gender: "M", guardian: "Jorge Castro", guardianPhone: "+52 55 6767 8989", email: "jorge.c@mail.com", allergies: ["Ibuprofeno"], conditions: [], bloodType: "O+", lastVisit: "2025-05-06", avatarColor: colors[1] },
  { id: "p11", name: "Ximena Pérez Lara", age: 4, birthDate: "2021-10-03", gender: "F", guardian: "Miriam Lara", guardianPhone: "+52 55 1313 2424", email: "miriam.l@mail.com", allergies: [], conditions: [], bloodType: "B-", lastVisit: "2025-05-01", avatarColor: colors[2] },
  { id: "p12", name: "Tomás Aguilar Núñez", age: 8, birthDate: "2017-05-27", gender: "M", guardian: "Elena Núñez", guardianPhone: "+52 55 7676 8585", email: "elena.n@mail.com", allergies: [], conditions: ["Caries interproximales"], bloodType: "AB-", lastVisit: "2025-04-15", avatarColor: colors[3] },
];

export const CONSULTATIONS: Consultation[] = [
  { id: "c1", patientId: "p1", date: "2025-05-02", reason: "Revisión semestral", diagnosis: "Caries incipiente en molar inferior derecho", treatment: "Aplicación de flúor + sellante", notes: "Paciente cooperadora. Recomendar técnica de cepillado a tutor.", doctor: "Dra. Yomaira" },
  { id: "c2", patientId: "p1", date: "2024-11-15", reason: "Limpieza profiláctica", diagnosis: "Salud bucal en orden", treatment: "Profilaxis y aplicación de flúor", notes: "Sin caries. Próxima cita en 6 meses.", doctor: "Dra. Yomaira" },
  { id: "c3", patientId: "p1", date: "2024-05-10", reason: "Dolor en molar superior", diagnosis: "Caries profunda en pieza 64", treatment: "Pulpotomía y corona de acero", notes: "Tolerancia adecuada al procedimiento.", doctor: "Dra. Yomaira" },
  { id: "c4", patientId: "p2", date: "2025-05-08", reason: "Primera consulta", diagnosis: "Mordida cruzada anterior", treatment: "Plan ortopédico maxilar", notes: "Iniciar con expansor en próxima cita.", doctor: "Dra. Yomaira" },
  { id: "c5", patientId: "p3", date: "2025-05-10", reason: "Control post-extracción", diagnosis: "Cicatrización adecuada", treatment: "Limpieza zona quirúrgica", notes: "Retirar puntos en 3 días.", doctor: "Dra. Yomaira" },
  { id: "c6", patientId: "p5", date: "2025-05-12", reason: "Evaluación de frenillo", diagnosis: "Frenillo lingual tipo III", treatment: "Frenectomía programada", notes: "Coordinar con logopedia.", doctor: "Dra. Yomaira" },
];

const today = new Date();
const iso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const APPOINTMENTS: Appointment[] = [
  { id: "a1", patientId: "p1", date: iso(0), time: "09:00", reason: "Aplicación de flúor", status: "confirmada" },
  { id: "a2", patientId: "p2", date: iso(0), time: "10:30", reason: "Colocación de expansor", status: "confirmada" },
  { id: "a3", patientId: "p4", date: iso(0), time: "12:00", reason: "Revisión bruxismo", status: "pendiente" },
  { id: "a4", patientId: "p5", date: iso(1), time: "09:30", reason: "Frenectomía", status: "confirmada" },
  { id: "a5", patientId: "p6", date: iso(1), time: "11:00", reason: "Primera consulta", status: "pendiente" },
  { id: "a6", patientId: "p7", date: iso(2), time: "10:00", reason: "Control ortopédico", status: "confirmada" },
  { id: "a7", patientId: "p3", date: iso(-1), time: "16:00", reason: "Retiro de puntos", status: "completada" },
  { id: "a8", patientId: "p9", date: iso(3), time: "13:00", reason: "Sellantes", status: "confirmada" },
  { id: "a9", patientId: "p10", date: iso(-2), time: "11:30", reason: "Limpieza", status: "completada" },
  { id: "a10", patientId: "p12", date: iso(4), time: "10:00", reason: "Tratamiento de caries", status: "pendiente" },
  { id: "a11", patientId: "p8", date: iso(-3), time: "09:00", reason: "Consulta general", status: "cancelada" },
];

export const MEDICATIONS: Medication[] = [
  { name: "Amoxicilina", presentation: "Suspensión 250mg/5ml" },
  { name: "Ibuprofeno", presentation: "Suspensión 100mg/5ml" },
  { name: "Paracetamol", presentation: "Suspensión 120mg/5ml" },
  { name: "Clorhexidina", presentation: "Enjuague 0.12%" },
  { name: "Nistatina", presentation: "Suspensión oral 100,000 UI/ml" },
  { name: "Naproxeno", presentation: "Suspensión 125mg/5ml" },
  { name: "Fluoruro de sodio", presentation: "Gel 1.1%" },
  { name: "Lidocaína tópica", presentation: "Gel 2%" },
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx1",
    patientId: "p3",
    date: "2025-05-10",
    diagnosis: "Post-extracción molar temporal",
    items: [
      { medication: "Ibuprofeno suspensión 100mg/5ml", dose: "5 ml", frequency: "cada 8 horas", duration: "3 días" },
      { medication: "Amoxicilina suspensión 250mg/5ml", dose: "7.5 ml", frequency: "cada 8 horas", duration: "7 días" },
    ],
    indications: "Tomar con alimentos. Mantener buena higiene bucal. Evitar alimentos duros por 48 horas.",
  },
];
