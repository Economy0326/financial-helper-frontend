import type {
  ConsultationStep,
} from "@/lib/api/types";

type ConsultationStepMeta = {
  label: string;
  number: number;
  href: string;
};

export const consultationStepMeta: Record<
  ConsultationStep,
  ConsultationStepMeta
> = {
  CATEGORY: {
    label: "문제 선택",
    number: 1,
    href: "/consultation/problem-category",
  },

  SITUATION: {
    label: "상황 입력",
    number: 2,
    href: "/consultation/situation",
  },

  FOLLOW_UP: {
    label: "추가 질문",
    number: 3,
    href: "/consultation/follow-up",
  },

  SUMMARY: {
    label: "내용 확인",
    number: 4,
    href: "/consultation/summary",
  },

  ANALYSIS: {
    label: "AI 분석",
    number: 5,
    href: "/consultation/analysis",
  },

  REPORT: {
    label: "결과 리포트",
    number: 6,
    href: "/consultation/report",
  },
};

export function getConsultationStepHref(
  step: ConsultationStep,
) {
  return consultationStepMeta[step].href;
}