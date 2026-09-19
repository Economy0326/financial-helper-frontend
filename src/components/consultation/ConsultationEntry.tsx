"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  useActiveConsultationQuery,
  useStartConsultationMutation,
} from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import { getConsultationStepHref } from "@/lib/consultation/navigation";
import { ApiResponseError } from "@/lib/api/errors";

function entryErrorMessage(error: unknown) {
  if (error instanceof ApiResponseError) {
    if (error.code === "ACCOUNT_NEW_CONSULTATION_QUOTA_EXHAUSTED") {
      return "최근 7일 새 상담 한도를 모두 사용했어요. 진행 중인 상담과 지난 결과는 상담 내역에서 계속 확인할 수 있어요.";
    }
    if (error.code === "CONSULTATION_NOT_FOUND") {
      return "저장된 상담 상태가 바뀌었어요. 상담 내역을 새로 확인해 주세요.";
    }
  }
  return "잠시 후 다시 확인해 주세요.";
}

export default function ConsultationEntry() {
  const router = useRouter();
  const automaticStartAttempted = useRef(false);
  const sessionQuery = useSessionQuery();
  const authenticated = sessionQuery.data?.authenticated === true;
  const hasActiveConsultation =
    authenticated && sessionQuery.data?.hasActiveConsultation === true;
  const activeConsultationQuery = useActiveConsultationQuery(
    hasActiveConsultation,
  );
  const startMutation = useStartConsultationMutation();

  useEffect(() => {
    if (sessionQuery.isSuccess && !authenticated) {
      router.replace("/auth/login");
    }
  }, [authenticated, router, sessionQuery.isSuccess]);

  useEffect(() => {
    if (
      !authenticated ||
      sessionQuery.data?.hasActiveConsultation !== false ||
      automaticStartAttempted.current
    ) {
      return;
    }

    automaticStartAttempted.current = true;
    startMutation.mutate(false, {
      onSuccess: (consultation) => {
        router.replace(getConsultationStepHref(consultation.currentStep));
      },
    });
  }, [authenticated, router, sessionQuery.data?.hasActiveConsultation, startMutation]);

  if (
    sessionQuery.isLoading ||
    (hasActiveConsultation && activeConsultationQuery.isLoading) ||
    startMutation.isPending ||
    (sessionQuery.isSuccess && !authenticated)
  ) {
    return (
      <div className="py-20 text-center" role="status" aria-live="polite">
        <p className="text-lg font-semibold text-foreground">
          상담 상태를 확인하고 있어요.
        </p>
      </div>
    );
  }

  if (
    sessionQuery.isError ||
    activeConsultationQuery.isError ||
    startMutation.isError
  ) {
    const error = startMutation.error ?? activeConsultationQuery.error ?? sessionQuery.error;
    const quotaExhausted = error instanceof ApiResponseError &&
      error.code === "ACCOUNT_NEW_CONSULTATION_QUOTA_EXHAUSTED";
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          상담 상태를 확인하지 못했어요.
        </h1>
        <p className="mt-3 leading-7 text-foreground-muted">
          {entryErrorMessage(error)}
        </p>
        <Link
          href={quotaExhausted ? "/account" : "/"}
          className="mx-auto mt-8 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {quotaExhausted ? "상담 내역 보기" : "홈으로"}
        </Link>
      </div>
    );
  }

  const activeConsultation = activeConsultationQuery.data;
  if (!activeConsultation) {
    return null;
  }

  return (
    <section className="py-12 text-center" aria-labelledby="entry-heading">
      <h1 id="entry-heading" className="break-keep text-3xl font-bold text-foreground">
        진행 중인 상담이 있어요
      </h1>
      <p className="mt-4 break-keep leading-7 text-foreground-muted">
        이전 상담을 이어서 진행하거나 새 상담을 시작할 수 있어요.
      </p>

      <div className="mx-auto mt-8 max-w-sm space-y-3">
        <Link
          href={getConsultationStepHref(activeConsultation.currentStep)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          이어서 하기
        </Link>
        <SecondaryButton
          type="button"
          className="w-full border-primary text-primary"
          disabled={startMutation.isPending}
          onClick={() => {
            startMutation.mutate(true, {
              onSuccess: (consultation) => {
                router.replace(getConsultationStepHref(consultation.currentStep));
              },
            });
          }}
        >
          {startMutation.isPending ? "새 상담 준비 중..." : "새 상담 시작하기"}
        </SecondaryButton>
      </div>

      <p className="mt-4 break-keep text-sm leading-6 text-foreground-muted">
        새 상담을 시작하면 현재 진행 중인 상담은 종료돼요.
      </p>
    </section>
  );
}
