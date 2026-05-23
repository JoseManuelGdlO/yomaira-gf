import type { ConsentPoint } from "@/lib/consent";
import { DEFAULT_CONSENT_POINTS, DEFAULT_CONSENT_TITLE } from "@/lib/consent";

export type Branding = {
  id: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
  logoEmoji: string;
  signatureName: string;
  // Colors as oklch components for direct CSS injection
  primary: string;       // oklch values
  secondary: string;
  accent: string;
  surface: string;
  sidebar: string;
  // Hex copies for color pickers in branding UI
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  fontDisplay: string;
  rxFooter: string;
  consentTitle?: string;
  consentPoints?: ConsentPoint[] | null;
};

export const BRANDINGS: Branding[] = [
  {
    id: "yomaira",
    clinicName: "Smile Kids Dental",
    doctorName: "C.D.E.O. Yomaira García Flores",
    specialty: "Odontopediatría",
    cedula: "12345678",
    email: "contacto@smilekids.mx",
    phone: "+52 55 1234 5678",
    address: "Av. Reforma 123, Col. Centro, CDMX",
    logoEmoji: "🦷",
    signatureName: "Dra. Yomaira García",
    primary: "0.55 0.25 320",
    secondary: "0.85 0.09 320",
    accent: "0.45 0.13 265",
    surface: "0.985 0.008 320",
    sidebar: "0.99 0.005 320",
    primaryHex: "#B100D4",
    secondaryHex: "#DDB7E8",
    accentHex: "#2D4D8F",
    fontDisplay: "Fraunces",
    rxFooter: "Sonríe, juega, crece. Cuidamos tu sonrisa desde la primera dentición.",
    consentTitle: DEFAULT_CONSENT_TITLE,
    consentPoints: DEFAULT_CONSENT_POINTS,
  },
  {
    id: "ramirez",
    clinicName: "Cardio Plus",
    doctorName: "Dr. Andrés Ramírez Solís",
    specialty: "Cardiología",
    cedula: "87654321",
    email: "consulta@cardioplus.mx",
    phone: "+52 55 9876 5432",
    address: "Polanco 456, CDMX",
    logoEmoji: "❤️",
    signatureName: "Dr. A. Ramírez",
    primary: "0.5 0.2 25",
    secondary: "0.85 0.08 25",
    accent: "0.4 0.12 250",
    surface: "0.985 0.006 25",
    sidebar: "0.99 0.003 25",
    primaryHex: "#C8102E",
    secondaryHex: "#F4C7CF",
    accentHex: "#1F3A8A",
    fontDisplay: "Fraunces",
    rxFooter: "Cuidando tu corazón, cada latido cuenta.",
    consentTitle: "Consentimiento informado para procedimientos cardiológicos",
    consentPoints: [
      { id: "1", text: "Autorizo la realización de los estudios y procedimientos indicados por el médico tratante." },
      { id: "2", text: "He sido informado de los riesgos, beneficios y alternativas del tratamiento propuesto." },
      { id: "3", text: "Me comprometo a informar sobre mi historial clínico, medicamentos y alergias de forma veraz." },
    ],
  },
  {
    id: "lopez",
    clinicName: "Derma Studio",
    doctorName: "Dra. María López Hernández",
    specialty: "Dermatología",
    cedula: "55512233",
    email: "hola@dermastudio.mx",
    phone: "+52 55 4455 6677",
    address: "Roma Norte 89, CDMX",
    logoEmoji: "✨",
    signatureName: "Dra. M. López",
    primary: "0.55 0.13 200",
    secondary: "0.88 0.07 200",
    accent: "0.5 0.1 160",
    surface: "0.985 0.006 200",
    sidebar: "0.99 0.003 200",
    primaryHex: "#0FB5BA",
    secondaryHex: "#BCE7E9",
    accentHex: "#10A37F",
    fontDisplay: "Fraunces",
    rxFooter: "Tu piel, nuestra pasión.",
    consentTitle: "Consentimiento informado para procedimientos dermatológicos",
    consentPoints: [
      { id: "1", text: "Autorizo el tratamiento dermatológico acordado con mi médico." },
      { id: "2", text: "Entiendo que pueden presentarse enrojecimiento o sensibilidad temporal en la zona tratada." },
    ],
  },
];

export const DEFAULT_BRANDING_ID = "yomaira";
