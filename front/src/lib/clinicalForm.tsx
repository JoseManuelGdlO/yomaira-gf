import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { tenantKey } from "@/lib/tenantQuery";
import { toast } from "sonner";

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

type Ctx = {
  questions: Question[];
  customQuestions: Question[];
  addQuestion: (q: Omit<Question, "id" | "builtin">) => void;
  removeQuestion: (id: string, onSuccess?: () => void) => void;
  getAnswers: (patientId: string) => Answers;
  saveAnswers: (patientId: string, answers: Answers) => Promise<void>;
  hasHistory: (patientId: string) => boolean;
};

const ClinicalCtx = createContext<Ctx | null>(null);
const QK_QUESTIONS = ["clinical", "questions"] as const;
const qkAnswers = (patientId: string) => ["clinical", "answers", patientId] as const;

export function ClinicalFormProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const enabled = ready && !!user;
  const brandingId = user?.brandingId;
  const qc = useQueryClient();
  const questionsKey = tenantKey(QK_QUESTIONS, brandingId);
  const answersRef = useRef<Record<string, Answers>>({});
  const answersFetched = useRef<Set<string>>(new Set());
  const answersLoading = useRef<Set<string>>(new Set());

  useEffect(() => {
    answersRef.current = {};
    answersFetched.current = new Set();
    answersLoading.current = new Set();
  }, [brandingId]);

  const questionsQ = useQuery({
    queryKey: questionsKey,
    queryFn: () => api.clinicalQuestions.list(),
    enabled,
    staleTime: 60_000,
    placeholderData: [],
  });

  const questions: Question[] = useMemo(() => {
    const list = questionsQ.data ?? [];
    return list.map((q) => ({
      id: q.code,
      section: q.section,
      label: q.label,
      type: q.type,
      options: q.options ?? undefined,
      builtin: q.builtin,
    }));
  }, [questionsQ.data]);

  const customQuestions = useMemo(() => questions.filter((q) => !q.builtin), [questions]);

  const idToCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questionsQ.data ?? []) map.set(q.id, q.code);
    return map;
  }, [questionsQ.data]);

  const codeToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questionsQ.data ?? []) map.set(q.code, q.id);
    return map;
  }, [questionsQ.data]);

  const addM = useMutation({
    mutationFn: (q: Omit<Question, "id" | "builtin">) =>
      api.clinicalQuestions.create({
        section: q.section,
        label: q.label,
        type: q.type,
        options: q.options ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: questionsKey }),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => api.clinicalQuestions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: questionsKey }),
  });

  const ensureAnswers = useCallback(
    (patientId: string) => {
      if (!enabled) return;
      if (answersFetched.current.has(patientId) || answersLoading.current.has(patientId)) return;
      answersLoading.current.add(patientId);
      api.clinicalAnswers
        .get(patientId)
        .then((res) => {
          const map: Answers = {};
          for (const [code, value] of Object.entries(res.answers ?? {})) {
            if (value === null || value === undefined) continue;
            map[code] = value as string | string[];
          }
          answersRef.current[patientId] = map;
          answersFetched.current.add(patientId);
          qc.setQueryData(qkAnswers(patientId), map);
        })
        .catch(() => {})
        .finally(() => {
          answersLoading.current.delete(patientId);
        });
    },
    [enabled, qc],
  );

  const upsertM = useMutation({
    mutationFn: ({ patientId, answers }: { patientId: string; answers: Record<string, string | string[]> }) =>
      api.clinicalAnswers.upsert(patientId, answers),
  });

  const getAnswers = useCallback(
    (patientId: string): Answers => {
      ensureAnswers(patientId);
      const cached = qc.getQueryData<Answers>(qkAnswers(patientId));
      return cached ?? answersRef.current[patientId] ?? {};
    },
    [ensureAnswers, qc],
  );

  const saveAnswers = useCallback(
    async (patientId: string, answers: Answers) => {
      await upsertM.mutateAsync({ patientId, answers });
      answersRef.current[patientId] = answers;
      qc.setQueryData(qkAnswers(patientId), answers);
      answersFetched.current.add(patientId);
    },
    [qc, upsertM],
  );

  const hasHistory = useCallback(
    (patientId: string) => {
      const cached = qc.getQueryData<Answers>(qkAnswers(patientId)) ?? answersRef.current[patientId];
      return !!cached && Object.keys(cached).length > 0;
    },
    [qc],
  );

  const addQuestion = useCallback(
    (q: Omit<Question, "id" | "builtin">) => addM.mutate(q),
    [addM],
  );

  const removeQuestion = useCallback(
    (questionCode: string, onSuccess?: () => void) => {
      const realId = codeToId.get(questionCode);
      if (!realId) {
        toast.error("Pregunta no encontrada");
        return;
      }
      removeM.mutate(realId, {
        onSuccess: () => onSuccess?.(),
        onError: () => toast.error("No se pudo eliminar la pregunta"),
      });
    },
    [codeToId, removeM],
  );

  const value: Ctx = {
    questions,
    customQuestions,
    addQuestion,
    removeQuestion,
    getAnswers,
    saveAnswers,
    hasHistory,
  };

  return <ClinicalCtx.Provider value={value}>{children}</ClinicalCtx.Provider>;
}

export function useClinicalForm() {
  const ctx = useContext(ClinicalCtx);
  if (!ctx) throw new Error("useClinicalForm must be used within ClinicalFormProvider");
  return ctx;
}

export function usePatientClinicalAnswers(patientId: string) {
  const { user, ready } = useAuth();
  const brandingId = user?.brandingId;
  return useQuery({
    queryKey: tenantKey(qkAnswers(patientId), brandingId),
    queryFn: async (): Promise<Answers> => {
      const res = await api.clinicalAnswers.get(patientId);
      const map: Answers = {};
      for (const [code, value] of Object.entries(res.answers ?? {})) {
        if (value === null || value === undefined) continue;
        map[code] = value as string | string[];
      }
      return map;
    },
    enabled: ready && !!user && !!patientId,
  });
}
