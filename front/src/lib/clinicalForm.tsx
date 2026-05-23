import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  setAnswer: (patientId: string, qid: string, value: string | string[]) => void;
  hasHistory: (patientId: string) => boolean;
};

const ClinicalCtx = createContext<Ctx | null>(null);
const QK_QUESTIONS = ["clinical", "questions"] as const;
const qkAnswers = (patientId: string) => ["clinical", "answers", patientId] as const;

export function ClinicalFormProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const enabled = ready && !!user;
  const qc = useQueryClient();

  const questionsQ = useQuery({
    queryKey: QK_QUESTIONS,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_QUESTIONS }),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => api.clinicalQuestions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_QUESTIONS }),
  });

  // Per-patient answers cache, fetched lazily on first read.
  const answersRef = useRef<Record<string, Answers>>({});
  const answersFetched = useRef<Set<string>>(new Set());
  const answersLoading = useRef<Set<string>>(new Set());

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

  const setAnswer = useCallback(
    (patientId: string, qid: string, value: string | string[]) => {
      const code = idToCode.get(qid) ?? qid;
      const current = answersRef.current[patientId] ?? qc.getQueryData<Answers>(qkAnswers(patientId)) ?? {};
      const next: Answers = { ...current, [code]: value };
      answersRef.current[patientId] = next;
      qc.setQueryData(qkAnswers(patientId), next);
      upsertM.mutate({ patientId, answers: { [code]: value } });
    },
    [idToCode, qc, upsertM],
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
    setAnswer,
    hasHistory,
  };

  return <ClinicalCtx.Provider value={value}>{children}</ClinicalCtx.Provider>;
}

export function useClinicalForm() {
  const ctx = useContext(ClinicalCtx);
  if (!ctx) throw new Error("useClinicalForm must be used within ClinicalFormProvider");
  return ctx;
}
