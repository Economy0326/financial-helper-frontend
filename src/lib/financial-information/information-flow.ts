import { create } from "zustand";
import type { EvidenceSnapshot, EvidenceExplanation } from "@/lib/api/document-evidence";

type Step = { question: string; condition: string; answer: string; snapshot: EvidenceSnapshot | null };
type Flow = {
  question: string; submitted: string; stage: "input" | "clarification" | "result" | "stop";
  steps: Step[]; condition: string | null; snapshot: EvidenceSnapshot | null;
  explanation: EvidenceExplanation | null; setExplanation: (value: EvidenceExplanation | null) => void;
  busy: boolean; error: string; requestId: number; saved: boolean; setSaved: (value: boolean) => void;
  setQuestion: (value: string) => void;
  begin: () => number;
  finish: (id: number, result: EvidenceSnapshot, question: string, condition: string | null) => void;
  fail: (id: number) => void;
  answer: (answer: string) => string;
  previous: () => void;
  revisit: (index: number) => void;
  stop: () => void;
  resume: () => void;
  reset: () => void;
};

const initial = { question: "", submitted: "", stage: "input" as const, steps: [] as Step[], condition: null, snapshot: null, explanation: null, busy: false, error: "", saved: false };
export const useInformationFlow = create<Flow>((set, get) => ({
  ...initial, requestId: 0,
  setQuestion: question => set({ question }),
  setSaved: saved => set({ saved }),
  setExplanation: explanation => set({ explanation }),
  begin: () => { const id = get().requestId + 1; set({ requestId: id, busy: true, error: "" }); return id; },
  finish: (id, snapshot, submitted, condition) => {
    if (get().requestId !== id) return;
    const repeated = condition && get().steps.some(step => step.condition === condition &&
      JSON.stringify(step.snapshot?.options ?? []) === JSON.stringify(snapshot.options ?? []));
    set({ busy: false, snapshot, submitted, condition: repeated ? null : condition,
      stage: condition && !repeated ? "clarification" : snapshot.status === "READY_CANDIDATES" ? "result" : "stop" });
  },
  fail: id => { if (get().requestId === id) set({ busy: false, error: "정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요." }); },
  answer: answer => {
    const { submitted, condition, steps, snapshot } = get();
    if (!condition || !answer.trim()) return submitted;
    set({ steps: [...steps, { question: submitted, condition, answer: answer.trim(), snapshot }], condition: null, snapshot: null });
    return `${submitted} ${answer.trim()}`;
  },
  previous: () => { const steps = get().steps; const previous = steps.at(-1); if (!previous) return;
    set({ steps: steps.slice(0, -1), submitted: previous.question, condition: previous.condition,
      snapshot: previous.snapshot, stage: "clarification", error: "", busy: false, requestId: get().requestId + 1 }); },
  revisit: index => { const steps = get().steps; const previous = steps[index]; if (!previous) return;
    set({ steps: steps.slice(0, index), submitted: previous.question, condition: previous.condition,
      snapshot: previous.snapshot, stage: "clarification", explanation: null, saved: false, error: "", busy: false, requestId: get().requestId + 1 }); },
  stop: () => set({ stage: "stop", busy: false, requestId: get().requestId + 1 }),
  resume: () => { if (get().condition) set({ stage: "clarification", error: "" }); },
  reset: () => set({ ...initial, requestId: get().requestId + 1 }),
}));
