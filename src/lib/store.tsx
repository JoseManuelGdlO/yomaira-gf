import { createContext, useContext, useState, type ReactNode } from "react";
import { PATIENTS, CONSULTATIONS, APPOINTMENTS, INITIAL_PRESCRIPTIONS, type Patient, type Consultation, type Appointment, type Prescription } from "@/mocks/data";

type Store = {
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  addPrescription: (rx: Prescription) => void;
  addConsultation: (c: Consultation) => void;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  setAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  addAppointment: (a: Appointment) => void;
  addPatient: (p: Patient) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [consultations, setConsultations] = useState<Consultation[]>(CONSULTATIONS);
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);

  return (
    <Ctx.Provider value={{
      patients, consultations, appointments, prescriptions,
      addPrescription: (rx) => setPrescriptions((p) => [rx, ...p]),
      addConsultation: (c) => setConsultations((p) => [c, ...p]),
      updatePatient: (id, patch) => setPatients((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x)),
      setAppointmentStatus: (id, status) => setAppointments((p) => p.map((x) => x.id === id ? { ...x, status } : x)),
      addAppointment: (a) => setAppointments((p) => [...p, a]),
      addPatient: (np) => setPatients((p) => [np, ...p]),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
