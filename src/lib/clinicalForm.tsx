import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type QuestionType = "text" | "textarea" | "yes_no" | "checkbox_group";
export type Question = {
  id: string;
  section: string;
  label: string;
  type: QuestionType;
  options?: string[];
  builtin?: boolean;
};
export type Answers = Record<string, string | string[]>;

export const DEFAULT_QUESTIONS: Question[] = [
  // Identificación
  { id: "nickname", section: "Identificación", label: "¿Cómo le gusta que le digan?", type: "text", builtin: true },
  { id: "favorite_character", section: "Identificación", label: "Personaje o caricatura favorita", type: "text", builtin: true },
  { id: "referred_by", section: "Identificación", label: "¿Quién los recomendó con nosotros?", type: "text", builtin: true },
  { id: "reason", section: "Identificación", label: "Motivo de la consulta", type: "textarea", builtin: true },

  // Antecedentes sistémicos
  { id: "antecedents", section: "Antecedentes sistémicos", label: "Marque los antecedentes positivos", type: "checkbox_group", builtin: true,
    options: ["Cardiacos", "Renales", "Sanguíneos", "Pulmonares", "Psicológicos / neurológicos", "Alérgicos", "Otros"] },
  { id: "antecedents_other", section: "Antecedentes sistémicos", label: "Especifique otros antecedentes", type: "text", builtin: true },

  // Antecedentes médicos
  { id: "hospitalized", section: "Antecedentes médicos", label: "¿Ha estado hospitalizado?", type: "yes_no", builtin: true },
  { id: "surgery", section: "Antecedentes médicos", label: "¿Ha sido intervenido quirúrgicamente?", type: "yes_no", builtin: true },
  { id: "current_treatment", section: "Antecedentes médicos", label: "¿Actualmente está enfermo y/o bajo tratamiento médico?", type: "textarea", builtin: true },
  { id: "first_visit", section: "Antecedentes médicos", label: "¿Es la primera vez que acude a consulta odontológica?", type: "yes_no", builtin: true },
  { id: "previous_reasons", section: "Antecedentes médicos", label: "¿Por qué motivos fue atendido anteriormente?", type: "textarea", builtin: true },
  { id: "previous_behavior", section: "Antecedentes médicos", label: "¿Cómo fue su comportamiento en tratamientos anteriores?", type: "textarea", builtin: true },

  // Higiene y dieta
  { id: "brush_freq", section: "Higiene y dieta", label: "¿Cuántas veces al día cepilla sus dientes?", type: "text", builtin: true },
  { id: "brush_help", section: "Higiene y dieta", label: "¿Se cepilla solo/a o recibe ayuda?", type: "text", builtin: true },
  { id: "toothpaste", section: "Higiene y dieta", label: "¿Qué pasta dental usa?", type: "text", builtin: true },
  { id: "floss", section: "Higiene y dieta", label: "¿Usa hilo dental?", type: "yes_no", builtin: true },
  { id: "sugar", section: "Higiene y dieta", label: "Consumo de azúcares (dulces, chocolates, yogurt, jugos de caja, leche saborizada, cereal, galletas)", type: "textarea", builtin: true },
  { id: "water", section: "Higiene y dieta", label: "¿Qué tipo de agua consumen? (purificada, llave, garrafón)", type: "text", builtin: true },

  // Antecedentes perinatales
  { id: "mom_meds", section: "Antecedentes perinatales", label: "¿La madre consumió medicamentos (antibióticos) durante el embarazo?", type: "textarea", builtin: true },
  { id: "baby_meds", section: "Antecedentes perinatales", label: "¿El/la paciente consumió medicamentos (antibióticos) los primeros meses de vida?", type: "textarea", builtin: true },
  { id: "pregnancy_complications", section: "Antecedentes perinatales", label: "¿Complicaciones durante el embarazo, bajo peso al nacer, prematuro?", type: "textarea", builtin: true },
  { id: "full_term", section: "Antecedentes perinatales", label: "¿Embarazo a término? (9 meses / 40 semanas)", type: "yes_no", builtin: true },
  { id: "birth_type", section: "Antecedentes perinatales", label: "¿Nació por parto o cesárea?", type: "text", builtin: true },

  // Hábitos orales
  { id: "bottle", section: "Hábitos orales", label: "¿Usa o usó biberón?", type: "yes_no", builtin: true },
  { id: "formula", section: "Hábitos orales", label: "¿Consume o consumió leche de fórmula?", type: "yes_no", builtin: true },
  { id: "breast_milk", section: "Hábitos orales", label: "¿Consume o consumió leche materna?", type: "yes_no", builtin: true },
  { id: "pacifier", section: "Hábitos orales", label: "¿Usa o usó chupón / se chupa el dedo?", type: "yes_no", builtin: true },
  { id: "lip_biting", section: "Hábitos orales", label: "¿Se chupa o muerde el labio superior o inferior?", type: "yes_no", builtin: true },
  { id: "speech", section: "Hábitos orales", label: "¿Ha notado alguna alteración en el habla (pronunciación de algunas letras)?", type: "textarea", builtin: true },
  { id: "complementary_feeding", section: "Hábitos orales", label: "Si tiene 6 meses cumplidos: ¿ya lleva alimentación complementaria?", type: "yes_no", builtin: true },

  // Notas
  { id: "notes", section: "Anotaciones del odontopediatra", label: "Anotaciones clínicas", type: "textarea", builtin: true },
];

type Ctx = {
  questions: Question[];
  customQuestions: Question[];
  addQuestion: (q: Omit<Question, "id" | "builtin">) => void;
  removeQuestion: (id: string) => void;
  getAnswers: (patientId: string) => Answers;
  setAnswer: (patientId: string, qid: string, value: string | string[]) => void;
  hasHistory: (patientId: string) => boolean;
};

const ClinicalCtx = createContext<Ctx | null>(null);
const LS_QUESTIONS = "clinical-custom-questions";
const LS_ANSWERS = "clinical-answers";

export function ClinicalFormProvider({ children }: { children: ReactNode }) {
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [answersByPatient, setAnswersByPatient] = useState<Record<string, Answers>>({});

  useEffect(() => {
    try {
      const q = localStorage.getItem(LS_QUESTIONS);
      if (q) setCustomQuestions(JSON.parse(q));
      const a = localStorage.getItem(LS_ANSWERS);
      if (a) setAnswersByPatient(JSON.parse(a));
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(LS_QUESTIONS, JSON.stringify(customQuestions)); } catch {} }, [customQuestions]);
  useEffect(() => { try { localStorage.setItem(LS_ANSWERS, JSON.stringify(answersByPatient)); } catch {} }, [answersByPatient]);

  const value: Ctx = {
    questions: [...DEFAULT_QUESTIONS, ...customQuestions],
    customQuestions,
    addQuestion: (q) => setCustomQuestions((p) => [...p, { ...q, id: `cq-${Date.now()}`, builtin: false }]),
    removeQuestion: (id) => setCustomQuestions((p) => p.filter((x) => x.id !== id)),
    getAnswers: (pid) => answersByPatient[pid] ?? {},
    setAnswer: (pid, qid, value) => setAnswersByPatient((prev) => ({ ...prev, [pid]: { ...(prev[pid] ?? {}), [qid]: value } })),
    hasHistory: (pid) => Object.keys(answersByPatient[pid] ?? {}).length > 0,
  };

  return <ClinicalCtx.Provider value={value}>{children}</ClinicalCtx.Provider>;
}

export function useClinicalForm() {
  const ctx = useContext(ClinicalCtx);
  if (!ctx) throw new Error("useClinicalForm must be used within ClinicalFormProvider");
  return ctx;
}