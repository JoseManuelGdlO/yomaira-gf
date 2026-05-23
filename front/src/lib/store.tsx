import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Patient, Consultation, Appointment, Prescription } from "@/mocks/data";
import { useAuth } from "@/lib/auth";

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

const QK = {
  patients: ["patients"] as const,
  consultations: ["consultations"] as const,
  appointments: ["appointments"] as const,
  prescriptions: ["prescriptions"] as const,
};

function stripLocalId<T extends { id?: unknown }>(input: T): Omit<T, "id"> {
  const { id: _ignored, ...rest } = input;
  return rest;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const enabled = ready && !!user;

  const patientsQ = useQuery({
    queryKey: QK.patients,
    queryFn: () => api.patients.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const consultationsQ = useQuery({
    queryKey: QK.consultations,
    queryFn: () => api.consultations.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const appointmentsQ = useQuery({
    queryKey: QK.appointments,
    queryFn: () => api.appointments.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const prescriptionsQ = useQuery({
    queryKey: QK.prescriptions,
    queryFn: () => api.prescriptions.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });

  const createPatient = useMutation({
    mutationFn: (p: Patient) => api.patients.create(stripLocalId(p)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.patients }),
  });

  const updatePatientM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Patient> }) => {
      if (Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, "consentPhoto")) {
        return api.patients.setConsentPhoto(id, (patch.consentPhoto as string | null | undefined) ?? null);
      }
      return api.patients.update(id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.patients }),
  });

  const createAppointment = useMutation({
    mutationFn: (a: Appointment) => api.appointments.create(stripLocalId(a)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.appointments }),
  });

  const setApptStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment["status"] }) =>
      api.appointments.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.appointments }),
  });

  const createConsultation = useMutation({
    mutationFn: (c: Consultation) => api.consultations.create(stripLocalId(c)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.consultations });
      qc.invalidateQueries({ queryKey: QK.patients });
      qc.invalidateQueries({ queryKey: QK.appointments });
    },
  });

  const createPrescription = useMutation({
    mutationFn: (rx: Prescription) => api.prescriptions.create(stripLocalId(rx)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.prescriptions }),
  });

  const value: Store = {
    patients: patientsQ.data ?? [],
    consultations: consultationsQ.data ?? [],
    appointments: appointmentsQ.data ?? [],
    prescriptions: prescriptionsQ.data ?? [],
    addPatient: (p) => { createPatient.mutate(p); },
    updatePatient: (id, patch) => { updatePatientM.mutate({ id, patch }); },
    addAppointment: (a) => { createAppointment.mutate(a); },
    setAppointmentStatus: (id, status) => { setApptStatus.mutate({ id, status }); },
    addConsultation: (c) => { createConsultation.mutate(c); },
    addPrescription: (rx) => { createPrescription.mutate(rx); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
