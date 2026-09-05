"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import {
  useActiveConsultationQuery,
  useConfirmConsultationSummaryMutation,
  useConsultationSummaryQuery,
  usePrepareConsultationSummaryMutation,
} from "@/lib/query/consultation";

import {
  useSessionQuery,
} from "@/lib/query/session";

import {
  getSummaryPageAccess,
} from "@/lib/consultation/access";

import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

export default function SummaryConfirmationFlow() {
  const router =
    useRouter();

  const sessionQuery =
    useSessionQuery();

  const hasActiveConsultation =
    sessionQuery.isSuccess &&
    sessionQuery.data
      .hasActiveConsultation;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      hasActiveConsultation,
    );

  const consultationId =
    activeConsultationQuery.data
      ?.consultationId ?? null;

  const currentStep =
    activeConsultationQuery.data
      ?.currentStep ?? null;

  const pageAccess =
    getSummaryPageAccess(
      currentStep,
    );

  const canLoadSummary =
    pageAccess.status === "allowed" &&
    Boolean(consultationId);

  const summaryQuery =
    useConsultationSummaryQuery(
      consultationId,
      canLoadSummary,
    );

  const prepareSummaryMutation =
    usePrepareConsultationSummaryMutation();

  const confirmSummaryMutation =
    useConfirmConsultationSummaryMutation();

  useEffect(() => {
    if (
      currentStep === "ANALYSIS"
    ) {
      router.replace(
        "/consultation/analysis",
      );
    }
  }, [
    currentStep,
    router,
  ]);

  useEffect(() => {
    if (
      !consultationId ||
      !canLoadSummary ||
      summaryQuery.data?.kind !==
        "not-prepared" ||
      prepareSummaryMutation.isPending
    ) {
      return;
    }

    prepareSummaryMutation.mutate({
      consultationId,
    });
  }, [
    consultationId,
    canLoadSummary,
    summaryQuery.data,
    prepareSummaryMutation,
  ]);

  const isLoading =
    sessionQuery.isLoading ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isLoading
    ) ||
    (
      canLoadSummary &&
      summaryQuery.isLoading
    ) ||
    prepareSummaryMutation.isPending;

  if (isLoading) {
    return (
      <>
        <ConsultationProgress
          currentStep={4}
          totalSteps={6}
          label="상담 내용 확인"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            상담 내용을 정리하고 있어요.
          </p>

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

  if (
    sessionQuery.isSuccess &&
    !hasActiveConsultation
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          진행 중인 상담이 없어요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          먼저 상담을 시작해 주세요.
        </p>

        <Link
          href="/consultation/problem-category"
          className={[
            "mx-auto mt-8 inline-flex min-h-12 items-center justify-center",
            "rounded-control bg-primary px-5 py-3",
            "font-bold text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-focus focus-visible:ring-offset-2",
          ].join(" ")}
        >
          상담 시작하기
        </Link>
      </div>
    );
  }

  if (
    pageAccess.status ===
      "wrong-step" &&
    currentStep !== "ANALYSIS"
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          현재 상담 단계와 맞지 않는 화면이에요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          저장된 상담 단계에서 계속 진행해 주세요.
        </p>

        <Link
          href={getConsultationStepHref(
            pageAccess.currentStep,
          )}
          className={[
            "mx-auto mt-8 inline-flex min-h-12 items-center justify-center",
            "rounded-control bg-primary px-5 py-3",
            "font-bold text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-focus focus-visible:ring-offset-2",
          ].join(" ")}
        >
          현재 단계로 이동
        </Link>
      </div>
    );
  }

  if (
    sessionQuery.isError ||
    activeConsultationQuery.isError ||
    summaryQuery.isError ||
    prepareSummaryMutation.isError
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={4}
          totalSteps={6}
          label="상담 내용 확인"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            상담 요약을 불러오지 못했어요.
          </h1>

          <p className="mt-3 leading-7 text-foreground-muted">
            입력하신 내용은 저장되어 있어요.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                void sessionQuery.refetch();
                void activeConsultationQuery.refetch();
                void summaryQuery.refetch();
              }}
            >
              다시 시도
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  "/consultation/situation",
                )
              }
            >
              상황 수정하기
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state =
    summaryQuery.data;

  if (
    !state ||
    state.kind !== "ready" ||
    !state.summary
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={4}
          totalSteps={6}
          label="상담 내용 확인"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
        >
          <p className="font-semibold text-foreground">
            상담 요약을 준비하고 있어요.
          </p>
        </div>
      </>
    );
  }

  const isPending =
    confirmSummaryMutation.isPending;

  return (
    <>
      <ConsultationProgress
        currentStep={4}
        totalSteps={6}
        label="상담 내용 확인"
      />

      <header className="mt-10 text-center sm:mt-12">
        <p className="text-sm font-semibold text-primary">
          상담 내용 확인
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          제가 이해한 내용이 맞는지 확인해 주세요
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          아래 요약은 입력하신 상담 내용과 추가 질문 답변을 바탕으로 정리한 내용이에요.
        </p>
      </header>

      <section className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-bold text-foreground">
          {state.summary.headline}
        </h2>

        <p className="mt-4 whitespace-pre-line leading-7 text-foreground">
          {state.summary.summaryText}
        </p>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground-muted">
            핵심 포인트
          </h3>

          <ul className="mt-3 space-y-3">
            {state.summary.keyPoints.map(
              (point) => (
                <li
                  key={point}
                  className="rounded-control bg-surface-subtle px-4 py-3 leading-6 text-foreground"
                >
                  • {point}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {confirmSummaryMutation.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-semibold text-danger">
            요약 확인을 완료하지 못했어요.
          </p>

          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            if (!consultationId) {
              return;
            }

            confirmSummaryMutation.mutate(
              {
                consultationId,
              },
              {
                onSuccess: () => {
                  router.push(
                    "/consultation/analysis",
                  );
                },
              },
            );
          }}
        >
          {isPending
            ? "확인 중..."
            : "맞아요"}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={() =>
            router.push(
              "/consultation/situation",
            )
          }
        >
          수정할래요
        </SecondaryButton>
      </div>
    </>
  );
}