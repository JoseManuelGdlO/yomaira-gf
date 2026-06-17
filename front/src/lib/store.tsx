import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Patient, Consultation, Appointment, Prescription } from "@/mocks/data";
import type { ClinicalSafetyAlert } from "@/lib/clinicalSafety";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";

type Store = {
  patients: Patient[];
  patientsReady: boolean;
  consultations: Consultation[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  addPrescription: (rx: Prescription) => Promise<{ prescription: Prescription; warnings: ClinicalSafetyAlert[] }>;
  addConsultation: (c: Consultation) => void;
  updatePatient: (id: string, patch: Partial<Patient>) => Promise<Patient>;
  setAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  addAppointment: (a: Appointment) => Promise<Appointment>;
  addPatient: (p: Patient) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const QK = {
  patients: ["patients"] as const,
  patientsList: ["patients", "list"] as const,
  consultations: ["consultations"] as const,
  appointments: ["appointments"] as const,
  prescriptions: ["prescriptions"] as const,
};

function invalidatePatients(qc: ReturnType<typeof useQueryClient>, brandingId: string | undefined) {
  qc.invalidateQueries({ queryKey: tenantKey(QK.patients, brandingId) });
  qc.invalidateQueries({ queryKey: tenantKey(QK.patientsList, brandingId) });
}

function stripLocalId<T extends { id?: unknown }>(input: T): Omit<T, "id"> {
  const { id: _ignored, ...rest } = input;
  return rest;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const enabled = ready && !!user;
  const brandingId = user?.brandingId;

  const patientsQ = useQuery({
    queryKey: tenantKey(QK.patients, brandingId),
    queryFn: () => api.patients.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const consultationsQ = useQuery({
    queryKey: tenantKey(QK.consultations, brandingId),
    queryFn: () => api.consultations.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const appointmentsQ = useQuery({
    queryKey: tenantKey(QK.appointments, brandingId),
    queryFn: () => api.appointments.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });
  const prescriptionsQ = useQuery({
    queryKey: tenantKey(QK.prescriptions, brandingId),
    queryFn: () => api.prescriptions.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: [],
  });

  const createPatient = useMutation({
    mutationFn: (p: Patient) => api.patients.create(stripLocalId(p)),
    onSuccess: () => invalidatePatients(qc, brandingId),
  });

  const updatePatientM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Patient> }) => {
      if (Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, "consentPhoto")) {
        return api.patients.setConsentPhoto(id, (patch.consentPhoto as string | null | undefined) ?? null);
      }
      return api.patients.update(id, patch);
    },
    onSuccess: () => invalidatePatients(qc, brandingId),
  });

  const createAppointment = useMutation({
    mutationFn: (a: Appointment) => api.appointments.create(stripLocalId(a)),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKey(QK.appointments, brandingId) }),
  });

  const setApptStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment["status"] }) =>
      api.appointments.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKey(QK.appointments, brandingId) }),
  });

  const createConsultation = useMutation({
    mutationFn: (c: Consultation) => api.consultations.create(stripLocalId(c)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKey(QK.consultations, brandingId) });
      invalidatePatients(qc, brandingId);
      qc.invalidateQueries({ queryKey: tenantKey(QK.appointments, brandingId) });
    },
  });

  const createPrescription = useMutation({
    mutationFn: (rx: Prescription) => api.prescriptions.create(stripLocalId(rx)),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKey(QK.prescriptions, brandingId) }),
  });

  const deletePatientM = useMutation({
    mutationFn: (id: string) => api.patients.remove(id),
    onSuccess: (_data, id) => {
      invalidatePatients(qc, brandingId);
      qc.invalidateQueries({ queryKey: tenantKey(QK.consultations, brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(QK.appointments, brandingId) });
      qc.invalidateQueries({ queryKey: tenantKey(QK.prescriptions, brandingId) });
      qc.removeQueries({ queryKey: tenantKey(["clinical", "answers", id], brandingId) });
      qc.removeQueries({ queryKey: tenantKey(["dental-chart", id], brandingId) });
      qc.removeQueries({ queryKey: tenantKey(["budget", id], brandingId) });
    },
  });

  const value: Store = {
    patients: patientsQ.data ?? [],
    patientsReady: !patientsQ.isPlaceholderData && patientsQ.isFetched,
    consultations: consultationsQ.data ?? [],
    appointments: appointmentsQ.data ?? [],
    prescriptions: prescriptionsQ.data ?? [],
    addPatient: (p) => createPatient.mutateAsync(p),
    updatePatient: (id, patch) => updatePatientM.mutateAsync({ id, patch }),
    addAppointment: (a) => createAppointment.mutateAsync(a),
    setAppointmentStatus: (id, status) => { setApptStatus.mutate({ id, status }); },
    addConsultation: (c) => { createConsultation.mutate(c); },
    addPrescription: (rx) => createPrescription.mutateAsync(rx),
    deletePatient: (id) => deletePatientM.mutateAsync(id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
