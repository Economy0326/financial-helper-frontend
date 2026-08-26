"use client";

import HomeResumeSection, {
  type HomeResumeState,
} from "@/components/home/HomeResumeSection";

import type {
  ConsultationCategory,
  ConsultationStep,
} from "@/lib/api/types";

import {
  useActiveConsultationQuery,
} from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";

const categoryLabels: Record<
  ConsultationCategory,
  string
> = {
  INSURANCE: "보험",
  LOAN: "대출",
  CARD: "카드",
  UNKNOWN: "금융 문제",
};

const stepMeta: Record<
  ConsultationStep,
  {
    label: string;
    number: number;
    href: string;
  }
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

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "저장 시간 확인 불가";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function HomeResumeContainer() {
  const sessionQuery = useSessionQuery();

  const hasActiveConsultation =
    sessionQuery.data
      ?.hasActiveConsultation === true;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      hasActiveConsultation,
    );

  let state: HomeResumeState;

  if (sessionQuery.isLoading) {
    state = {
      status: "loading",
    };
  } else if (sessionQuery.isError) {
    state = {
      status: "error",
    };
  } else if (!hasActiveConsultation) {
    state = {
      status: "none",
    };
  } else if (
    activeConsultationQuery.isLoading
  ) {
    state = {
      status: "loading",
    };
  } else if (
    activeConsultationQuery.isError ||
    !activeConsultationQuery.data
  ) {
    state = {
      status: "error",
    };
  } else {
    const consultation =
      activeConsultationQuery.data;

    const step =
      stepMeta[consultation.currentStep];

    const categoryLabel =
      consultation.category
        ? categoryLabels[
            consultation.category
          ]
        : "금융 문제";

    state = {
      status: "active",
      consultation: {
        title: `${categoryLabel} 상담`,
        stepLabel:
          `${step.label} (${step.number}/6)`,
        updatedAtLabel:
          formatUpdatedAt(
            consultation.updatedAt,
          ),
        href: step.href,
      },
    };
  }

  return (
    <HomeResumeSection state={state} />
  );
}