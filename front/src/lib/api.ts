import type {
  Patient,
  Consultation,
  Appointment,
  Medication,
  Prescription,
  PrescriptionItem,
  PatientDentalChart,
  TreatmentBudget,
  BudgetItem,
  FranklScale,
  DentitionType,
  InventoryItem,
  InventoryUsage,
  FinanceCharge,
  FinanceExpense,
  FinanceSummary,
  FinanceChargeInput,
  PaymentMethod,
} from "@/mocks/data";
import type { ClinicalAnalytics, AnalyticsPeriod } from "@/lib/analytics";
import type { Branding } from "@/mocks/brandings";

export type {
  Patient,
  Consultation,
  Appointment,
  Medication,
  Prescription,
  PrescriptionItem,
  Branding,
  PatientDentalChart,
  TreatmentBudget,
  BudgetItem,
  FranklScale,
  DentitionType,
  InventoryItem,
  InventoryUsage,
  FinanceCharge,
  FinanceExpense,
  FinanceSummary,
  FinanceChargeInput,
  PaymentMethod,
};

const TOKEN_KEY = "med:token";
const REFRESH_KEY = "med:refresh";

const RAW_BASE = (import.meta.env?.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

export function getToken(): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
export function getRefresh(): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setRefresh(token: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem(REFRESH_KEY, token);
    else window.localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

export type PaginatedPatientsResponse = {
  data: Patient[];
  meta: { total: number; limit: number; offset: number };
};

export type PaginatedConsultationsResponse = {
  data: Consultation[];
  meta: { total: number; limit: number; offset: number };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = "ERROR", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  noAuth?: boolean;
  raw?: boolean;
};

let unauthorizedListener: (() => void) | null = null;
export function onUnauthorized(fn: () => void): void {
  unauthorizedListener = fn;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(API_BASE + (path.startsWith("/") ? path : "/" + path));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (!opts.noAuth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.noAuth) {
      setToken(null);
      setRefresh(null);
      unauthorizedListener?.();
    }
    const errPayload = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(
      res.status,
      errPayload?.message ?? `Request failed (${res.status})`,
      errPayload?.code ?? "ERROR",
      errPayload?.details,
    );
  }

  if (opts.raw) return payload as T;
  return ((payload as { data?: T } | null)?.data ?? (payload as T));
}

// ============================================================
// Tipos auxiliares para crear/actualizar
// ============================================================

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  brandingId: string;
  brandingSlug: string;
  roles: string[];
  permissions: string[];
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type DashboardStats = {
  patients: number;
  appointmentsTotal: number;
  todayAppointments: number;
  confirmedAppointments: number;
  prescriptions: number;
  consultations: number;
};

export type { FranklSummary, FranklAlert, FranklTrend, PatientFranklReading, DashboardFranklData, DashboardFranklPatient, FranklReadingScale } from "@/lib/frankl";
export type {
  ClinicalSafetyAlert,
  ClinicalSafetyReport,
  ClinicalSafetyContext,
  PrescriptionItemInput,
} from "@/lib/clinicalSafety";
import type { FranklSummary, PatientFranklReading, DashboardFranklData, FranklReadingScale } from "@/lib/frankl";
import type { ClinicalSafetyReport, ClinicalSafetyContext, PrescriptionItemInput, ClinicalSafetyAlert } from "@/lib/clinicalSafety";

export type AppointmentWithFrankl = Appointment & {
  franklSummary?: FranklSummary;
};

export type ClinicalQuestionDTO = {
  id: string;
  code: string;
  section: string;
  label: string;
  type: "text" | "textarea" | "yes_no" | "checkbox_group";
  options: string[] | null;
  builtin: boolean;
  position: number;
};

export type ClinicalAnswersDTO = {
  patientId: string;
  answers: Record<string, string | string[] | null>;
};

export type PermissionDTO = {
  id: string;
  code: string;
  description: string | null;
};

export type RoleDTO = {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionDTO[];
  createdAt?: string;
  updatedAt?: string;
};

export type UserRoleDTO = {
  id: string;
  name: string;
  description: string | null;
};

export type UserDTO = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  roles: UserRoleDTO[];
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
};

// ============================================================
// API surface
// ============================================================

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>("/auth/login", { method: "POST", body: { email, password }, noAuth: true }),
    me: () => request<AuthUser>("/auth/me"),
    refresh: (refreshToken: string) =>
      request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        noAuth: true,
      }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  },
  patients: {
    list: () => request<Patient[]>("/patients"),
    listPage: (params: { q?: string; limit: number; offset: number }) =>
      request<PaginatedPatientsResponse>("/patients", { query: params, raw: true }),
    get: (id: string) => request<Patient>(`/patients/${id}`),
    create: (body: Omit<Patient, "id">) => request<Patient>("/patients", { method: "POST", body }),
    update: (id: string, body: Partial<Patient>) => request<Patient>(`/patients/${id}`, { method: "PATCH", body }),
    remove: (id: string) => request<void>(`/patients/${id}`, { method: "DELETE" }),
    setConsentPhoto: (id: string, consentPhoto: string | null) =>
      request<Patient>(`/patients/${id}/consent-photo`, { method: "PATCH", body: { consentPhoto } }),
  },
  appointments: {
    list: (q?: { date?: string; from?: string; to?: string; patientId?: string; status?: string }) =>
      request<Appointment[]>("/appointments", { query: q }),
    create: (body: Omit<Appointment, "id">) => request<Appointment>("/appointments", { method: "POST", body }),
    update: (id: string, body: Partial<Appointment>) =>
      request<Appointment>(`/appointments/${id}`, { method: "PATCH", body }),
    setStatus: (id: string, status: Appointment["status"]) =>
      request<Appointment>(`/appointments/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id: string) => request<void>(`/appointments/${id}`, { method: "DELETE" }),
    complete: (
      id: string,
      body: {
        diagnosis: string;
        treatment: string;
        notes?: string;
        nextTreatment?: string;
        paymentAndNextAppointment?: string;
        evolutionNote?: string;
        doctor?: string;
        frankl?: FranklReadingScale;
        inventoryUsages?: InventoryUsageInput[];
        charge?: FinanceChargeInput | null;
      },
    ) =>
      request<{ appointment: Appointment; consultation: Consultation }>(`/appointments/${id}/complete`, {
        method: "POST",
        body,
      }),
  },
  consultations: {
    list: (q?: { patientId?: string }) => request<Consultation[]>("/consultations", { query: q }),
    listPage: (params: {
      q?: string;
      patientId?: string;
      from?: string;
      to?: string;
      limit: number;
      offset: number;
    }) => request<PaginatedConsultationsResponse>("/consultations", { query: params, raw: true }),
    create: (body: Omit<Consultation, "id"> & { charge?: FinanceChargeInput | null }) =>
      request<Consultation>("/consultations", { method: "POST", body }),
    update: (id: string, body: Partial<Consultation> & { charge?: FinanceChargeInput | null }) =>
      request<Consultation>(`/consultations/${id}`, { method: "PATCH", body }),
  },
  prescriptions: {
    list: (q?: { patientId?: string }) => request<Prescription[]>("/prescriptions", { query: q }),
    create: async (body: Omit<Prescription, "id">) => {
      const payload = await request<{ data: Prescription; warnings?: ClinicalSafetyAlert[] }>(
        "/prescriptions",
        { method: "POST", body, raw: true },
      );
      return { prescription: payload.data, warnings: payload.warnings ?? [] };
    },
    remove: (id: string) => request<void>(`/prescriptions/${id}`, { method: "DELETE" }),
  },
  medications: {
    list: () => request<Medication[]>("/medications"),
  },
  inventory: {
    list: (q?: { lowStock?: boolean; active?: boolean }) =>
      request<InventoryItem[]>("/inventory", {
        query: {
          lowStock: q?.lowStock ? "true" : undefined,
          active: q?.active === true ? "true" : q?.active === false ? "false" : undefined,
        },
      }),
    lowStock: () => request<InventoryItem[]>("/inventory/low-stock"),
    get: (id: string) => request<InventoryItem>(`/inventory/${id}`),
    create: (body: Omit<InventoryItem, "id" | "isLowStock">) =>
      request<InventoryItem>("/inventory", { method: "POST", body }),
    update: (id: string, body: Partial<Omit<InventoryItem, "id" | "isLowStock">>) =>
      request<InventoryItem>(`/inventory/${id}`, { method: "PATCH", body }),
    restock: (id: string, addQuantity: number) =>
      request<InventoryItem>(`/inventory/${id}/restock`, { method: "POST", body: { addQuantity } }),
    remove: (id: string) => request<void>(`/inventory/${id}`, { method: "DELETE" }),
  },
  finances: {
    charges: {
      list: (q?: { from?: string; to?: string; patientId?: string; consultationId?: string }) =>
        request<FinanceCharge[]>("/finances/charges", { query: q }),
      get: (id: string) => request<FinanceCharge>(`/finances/charges/${id}`),
      create: (body: {
        patientId: string;
        date: string;
        amount: number;
        paymentMethod: PaymentMethod;
        note?: string;
      }) => request<FinanceCharge>("/finances/charges", { method: "POST", body }),
      update: (
        id: string,
        body: Partial<{
          patientId: string;
          date: string;
          amount: number;
          paymentMethod: PaymentMethod;
          note: string;
        }>,
      ) => request<FinanceCharge>(`/finances/charges/${id}`, { method: "PATCH", body }),
      remove: (id: string) => request<void>(`/finances/charges/${id}`, { method: "DELETE" }),
    },
    expenses: {
      list: (q?: { from?: string; to?: string }) =>
        request<FinanceExpense[]>("/finances/expenses", { query: q }),
      get: (id: string) => request<FinanceExpense>(`/finances/expenses/${id}`),
      create: (body: { date: string; amount: number; category?: string; description?: string }) =>
        request<FinanceExpense>("/finances/expenses", { method: "POST", body }),
      update: (
        id: string,
        body: Partial<{ date: string; amount: number; category: string; description: string }>,
      ) => request<FinanceExpense>(`/finances/expenses/${id}`, { method: "PATCH", body }),
      remove: (id: string) => request<void>(`/finances/expenses/${id}`, { method: "DELETE" }),
    },
    summary: (q?: { from?: string; to?: string }) =>
      request<FinanceSummary>("/finances/summary", { query: q }),
  },
  brandings: {
    me: () => request<Branding>("/brandings/me"),
    update: (id: string, body: Partial<Branding>) =>
      request<Branding>(`/brandings/${id}`, { method: "PATCH", body }),
  },
  clinicalQuestions: {
    list: () => request<ClinicalQuestionDTO[]>("/clinical-questions"),
    create: (body: Omit<ClinicalQuestionDTO, "id" | "code" | "builtin" | "position"> & { code?: string; position?: number }) =>
      request<ClinicalQuestionDTO>("/clinical-questions", { method: "POST", body }),
    remove: (id: string) => request<void>(`/clinical-questions/${id}`, { method: "DELETE" }),
  },
  clinicalAnswers: {
    get: (patientId: string) => request<ClinicalAnswersDTO>(`/patients/${patientId}/clinical-answers`),
    upsert: (patientId: string, answers: Record<string, string | string[] | null>) =>
      request<ClinicalAnswersDTO>(`/patients/${patientId}/clinical-answers`, {
        method: "PUT",
        body: { answers },
      }),
  },
  dentalChart: {
    get: (patientId: string) => request<PatientDentalChart>(`/patients/${patientId}/dental-chart`),
    upsert: (patientId: string, body: Partial<PatientDentalChart>) =>
      request<PatientDentalChart>(`/patients/${patientId}/dental-chart`, { method: "PUT", body }),
  },
  budget: {
    get: (patientId: string) => request<TreatmentBudget>(`/patients/${patientId}/budget`),
    upsert: (patientId: string, body: { items: BudgetItem[]; notes?: string }) =>
      request<TreatmentBudget>(`/patients/${patientId}/budget`, { method: "PUT", body }),
    setAttachment: (
      patientId: string,
      body: { attachment: string | null; attachmentFileName?: string | null },
    ) =>
      request<TreatmentBudget>(`/patients/${patientId}/budget/attachment`, { method: "PATCH", body }),
  },
  frankl: {
    list: (patientId: string) => request<PatientFranklReading[]>(`/patients/${patientId}/frankl-readings`),
    summary: (patientId: string) => request<FranklSummary>(`/patients/${patientId}/frankl-summary`),
  },
  clinicalSafety: {
    get: (patientId: string, context: ClinicalSafetyContext = "prescription") =>
      request<ClinicalSafetyReport>(`/patients/${patientId}/clinical-safety`, { query: { context } }),
    check: (
      patientId: string,
      body: { context?: ClinicalSafetyContext; items: PrescriptionItemInput[] },
    ) =>
      request<ClinicalSafetyReport>(`/patients/${patientId}/clinical-safety/check`, {
        method: "POST",
        body,
      }),
  },
  dashboard: {
    stats: () => request<DashboardStats>("/dashboard/stats"),
    upcoming: () => request<AppointmentWithFrankl[]>("/dashboard/upcoming"),
    frankl: (scope?: "all" | "today") =>
      request<DashboardFranklData>("/dashboard/frankl", { query: scope ? { scope } : undefined }),
    analytics: (period: AnalyticsPeriod = "90d") =>
      request<ClinicalAnalytics>("/dashboard/analytics", { query: { period } }),
  },
  users: {
    list: () => request<UserDTO[]>("/users"),
    create: (body: {
      email: string;
      password: string;
      name: string;
      active?: boolean;
      roleIds?: string[];
    }) => request<UserDTO>("/users", { method: "POST", body }),
    update: (
      id: string,
      body: { email?: string; password?: string; name?: string; active?: boolean },
    ) => request<UserDTO>(`/users/${id}`, { method: "PATCH", body }),
    remove: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
    setRoles: (id: string, roleIds: string[]) =>
      request<UserDTO>(`/users/${id}/roles`, { method: "PUT", body: { roleIds } }),
  },
  roles: {
    list: () => request<RoleDTO[]>("/roles"),
    create: (body: { name: string; description?: string | null; permissionIds?: string[] }) =>
      request<RoleDTO>("/roles", { method: "POST", body }),
    update: (id: string, body: { name?: string; description?: string | null }) =>
      request<RoleDTO>(`/roles/${id}`, { method: "PATCH", body }),
    remove: (id: string) => request<void>(`/roles/${id}`, { method: "DELETE" }),
    setPermissions: (id: string, permissionIds: string[]) =>
      request<RoleDTO>(`/roles/${id}/permissions`, { method: "PUT", body: { permissionIds } }),
  },
  permissions: {
    list: () => request<PermissionDTO[]>("/permissions"),
  },
  notifications: {
    getPreferences: () =>
      request<NotificationPreferencesDTO>("/notifications/preferences"),
    updatePreferences: (body: Partial<NotificationPreferencesDTO>) =>
      request<NotificationPreferencesDTO>("/notifications/preferences", { method: "PATCH", body }),
    subscribePush: (body: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
      request<{ ok: boolean }>("/notifications/push/subscribe", { method: "POST", body }),
    unsubscribePush: (body: { endpoint: string }) =>
      request<void>("/notifications/push/subscribe", { method: "DELETE", body }),
  },
  integrations: {
    googleConnect: () => request<{ url: string }>("/integrations/google/connect"),
    googleStatus: () =>
      request<{ connected: boolean; calendarId?: string; configured: boolean }>(
        "/integrations/google/status",
      ),
    googleDisconnect: () => request<void>("/integrations/google", { method: "DELETE" }),
  },
  publicBooking: {
    branding: (slug: string) =>
      request<PublicBrandingDTO>("/public/branding", { noAuth: true, query: { slug } }),
    lookupPatient: (slug: string, phone: string) =>
      request<PublicPatientDTO | null>("/public/patients/lookup", {
        noAuth: true,
        query: { slug, phone },
      }),
    slots: (slug: string, date: string) =>
      request<string[]>("/public/appointment-slots", { noAuth: true, query: { slug, date } }),
    book: (body: PublicBookBody) =>
      request<{ appointment: Appointment; cancelToken: string }>("/public/appointment-requests", {
        method: "POST",
        body,
        noAuth: true,
      }),
    cancel: (id: string, token: string) =>
      request<Appointment>(`/public/appointments/${id}/cancel`, {
        method: "POST",
        body: { token },
        noAuth: true,
      }),
    confirm: (id: string, token: string) =>
      request<Appointment>(`/public/appointments/${id}/confirm`, {
        method: "POST",
        body: { token },
        noAuth: true,
      }),
  },
};

export type NotificationPreferencesDTO = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  onAppointmentCreated: boolean;
  onAppointmentConfirmed: boolean;
  onAppointmentCancelled: boolean;
  pushConfigured: boolean;
  vapidPublicKey: string | null;
};

export type PublicBrandingDTO = {
  clinicName: string;
  specialty?: string;
  logoEmoji?: string;
  phone?: string;
  address?: string;
  slug?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  surface?: string;
  sidebar?: string;
};

export type PublicPatientDTO = {
  id: string;
  name: string;
  guardian: string;
  phone: string;
};

export type PublicBookBody = {
  slug: string;
  patientId?: string;
  name?: string;
  guardian?: string;
  phone?: string;
  date: string;
  time: string;
  reason?: string;
};

export type InventoryUsageInput = {
  inventoryItemId: string;
  quantity: number;
};
