"use client";

import HomeResumeSection, {
  type HomeResumeState,
} from "@/components/home/HomeResumeSection";

import type {
  ConsultationCategory
} from "@/lib/api/types";

import {
  useActiveConsultationQuery,
} from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";

import {
  consultationStepMeta,
} from "@/lib/consultation/navigation";

const categoryLabels: Record<
  ConsultationCategory,
  string
> = {
  INSURANCE: "보험",
  LOAN: "대출",
  CARD: "카드",
  UNKNOWN: "금융 문제",
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

      isRetrying:
        sessionQuery.isFetching,

      onRetry: () => {
        void sessionQuery.refetch();
      },
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

      isRetrying:
        activeConsultationQuery.isFetching,

      onRetry: () => {
        void activeConsultationQuery.refetch();
      },
    };
  } else {
    const consultation =
      activeConsultationQuery.data;

    const step =
      consultationStepMeta[
        consultation.currentStep
      ];

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