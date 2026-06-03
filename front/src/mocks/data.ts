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
  weightKg?: number | null;
  lastVisit: string;
  avatarColor: string;
  consentPhoto?: string;
};

export type Consultation = {
  id: string;
  patientId: string;
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  nextTreatment: string;
  paymentAndNextAppointment: string;
  evolutionNote: string;
  doctor: string;
};

export type FranklScale = "na" | "I" | "II" | "III" | "IV";
export type DentitionType = "temporal" | "mixta" | "permanente";

export type PatientDentalChart = {
  id: string;
  patientId: string;
  toothTreatments: Record<string, string>;
  frankl: FranklScale;
  dentition: DentitionType[];
  atm: string;
  ganglios: string;
  softTissues: string;
  frenula: string;
};

export type BudgetItem = {
  description: string;
  tooth?: string;
  amount: number;
};

export type TreatmentBudget = {
  id: string;
  patientId: string;
  status: string;
  items: BudgetItem[];
  notes: string;
  subtotal: number;
  total: number;
};

export type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  reason: string;
  status: "pendiente" | "confirmada" | "completada" | "cancelada";
  scheduledBy?: "staff" | "patient";
};

export type Medication = { id?: string; name: string; presentation: string };

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

// Backward-compatible exports.
// These were hardcoded fixtures in the prototype; the app now consumes the
// equivalent collections from the API. Kept as empty arrays so any legacy
// import compiles without changes.
export const PATIENTS: Patient[] = [];
export const CONSULTATIONS: Consultation[] = [];
export const APPOINTMENTS: Appointment[] = [];
export const INITIAL_PRESCRIPTIONS: Prescription[] = [];
export const MEDICATIONS: Medication[] = [];
