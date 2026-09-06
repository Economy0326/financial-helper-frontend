"use client";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import PrimaryButton from "@/components/ui/PrimaryButton";

import {
  useActiveConsultationQuery,
  useAnalysisStateQuery,
  useReopenAnalysisMutation,
  useRetryAnalysisMutation,
  useStartAnalysisMutation,
} from "@/lib/query/consultation";

import {
  useSessionQuery,
} from "@/lib/query/session";

import {
  getAnalysisPageAccess,
} from "@/lib/consultation/access";

import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

export default function AnalysisFlow() {
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
    getAnalysisPageAccess(
      currentStep,
    );

  const canLoadAnalysis =
    pageAccess.status === "allowed" &&
    Boolean(consultationId);

  const analysisQuery =
    useAnalysisStateQuery(
      consultationId,
      canLoadAnalysis,
    );

  const startMutation =
    useStartAnalysisMutation();

  const retryMutation =
    useRetryAnalysisMutation();

  const reopenMutation =
    useReopenAnalysisMutation();

  const isInitialLoading =
    sessionQuery.isLoading ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isLoading
    ) ||
    (
      canLoadAnalysis &&
      analysisQuery.isLoading
    );

  if (isInitialLoading) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            분석 상태를 확인하고 있어요.
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
      "wrong-step"
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

  // Network Error
  // 서버에서는 분석이 계속 진행 중일 수도 있으니, 여기서는 Analysis Retry를 호출하면 안 된다.
  // 따라서 GET status만 다시 조회한다.
  if (analysisQuery.isError) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            분석 상태를 확인하지 못했어요.
          </h1>

          <p className="mt-3 leading-7 text-foreground-muted">
            분석이 중단됐다는 뜻은 아니에요.
            <br />
            서버의 현재 상태를 다시 확인해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                void analysisQuery
                  .refetch();
              }}
            >
              다시 확인하기
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  const state =
    analysisQuery.data;

  if (!state) {
    return null;
  }

  // Summary Confirm은 됐지만 Start request가 Network Error 등으로 실제로 서버에 도착하지 않은 경우
  // Page mount로 자동 실행하지 않고 명시적 사용자 Action을 제공한다. 
  if (
    state.status === "NOT_STARTED"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            분석을 시작할 준비가 됐어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            확인하신 상담 내용을 바탕으로
            핵심 쟁점을 정리할게요.
          </p>

          {startMutation.isError ? (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-md rounded-control border border-danger bg-surface p-4"
            >
              분석을 시작하지 못했어요.
            </div>
          ) : null}

          <PrimaryButton
            type="button"
            className="mx-auto mt-8 w-full max-w-sm"
            disabled={
              startMutation.isPending ||
              !consultationId
            }
            onClick={() => {
              if (!consultationId) {
                return;
              }

              startMutation.mutate({
                consultationId,
              });
            }}
          >
            {startMutation.isPending
              ? "시작 중..."
              : "분석 시작하기"}
          </PrimaryButton>
        </div>
      </>
    );
  }

  if (
    state.status === "QUEUED" ||
    state.status === "PROCESSING"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div
          className="py-16 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            aria-hidden="true"
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary motion-reduce:animate-none"
          />

          <h1 className="mt-8 text-3xl font-bold text-foreground">
            상담 내용을 분석하고 있어요
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            핵심 쟁점과 필요한 다음 행동을
            정리하고 있어요.
            <br />
            잠시만 기다려 주세요.
          </p>

          <p className="mt-6 text-sm text-foreground-muted">
            정확한 진행률을 알 수 없어
            임의의 퍼센트는 표시하지 않아요.
          </p>
        </div>
      </>
    );
  }

  if (
    state.status === "FAILED"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            분석을 완료하지 못했어요
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            입력하신 상담 내용은 그대로 저장되어 있어요.
            <br />
            다시 시도하면 같은 상담 정보로 분석을 시작합니다.
          </p>

          {retryMutation.isError ? (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-md rounded-control border border-danger bg-surface p-4"
            >
              다시 분석을 시작하지 못했어요.
            </div>
          ) : null}

          <PrimaryButton
            type="button"
            className="mx-auto mt-8 w-full max-w-sm"
            disabled={
              retryMutation.isPending ||
              !consultationId
            }
            onClick={() => {
              if (!consultationId) {
                return;
              }

              retryMutation.mutate({
                consultationId,
              });
            }}
          >
            {retryMutation.isPending
              ? "다시 시작 중..."
              : "다시 시도"}
          </PrimaryButton>
        </div>
      </>
    );
  }

  if (
    state.status ===
      "NEEDS_MORE_INFO"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-12">
          <header className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              조금 더 확인할 정보가 있어요
            </h1>

            <p className="mt-4 leading-7 text-foreground-muted">
              현재 정보만으로 단정하지 않고,
              필요한 내용을 먼저 보완할게요.
            </p>
          </header>

          <section className="mx-auto mt-8 max-w-xl rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-bold text-foreground">
              추가로 확인하면 좋은 정보
            </h2>

            <ul className="mt-4 space-y-4">
              {state.additionalInformationNeeded.map(
                (item) => (
                  <li
                    key={item.topic}
                    className="rounded-control bg-surface-subtle p-4"
                  >
                    <p className="font-bold text-foreground">
                      {item.topic}
                    </p>

                    <p className="mt-1 leading-6 text-foreground-muted">
                      {item.reason}
                    </p>
                  </li>
                ),
              )}
            </ul>
          </section>

          {reopenMutation.isError ? (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-xl rounded-control border border-danger bg-surface p-4"
            >
              정보 수정 화면으로 이동하지 못했어요.
            </div>
          ) : null}

          <PrimaryButton
            type="button"
            className="mx-auto mt-8 w-full max-w-sm"
            disabled={
              reopenMutation.isPending ||
              !consultationId
            }
            onClick={() => {
              if (!consultationId) {
                return;
              }

              reopenMutation.mutate(
                {
                  consultationId,
                },
                {
                  onSuccess: () => {
                    router.push(
                      "/consultation/situation",
                    );
                  },
                },
              );
            }}
          >
            {reopenMutation.isPending
              ? "이동 중..."
              : "정보 보완하기"}
          </PrimaryButton>
        </div>
      </>
    );
  }

  // COMPLETED
  return (
    <>
      <ConsultationProgress
        currentStep={5}
        totalSteps={6}
        label="AI 분석"
      />

      <div
        className="py-16 text-center"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle text-2xl font-bold text-primary"
        >
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-bold text-foreground">
          분석이 완료됐어요
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted">
          확인하신 상담 내용을 바탕으로
          핵심 쟁점 분석이 끝났어요.
        </p>

        <PrimaryButton
          type="button"
          className="mx-auto mt-8 w-full max-w-sm"
          onClick={() => {
            // 아직 fixture
            router.push(
              "/consultation/report",
            );
          }}
        >
          결과 보기
        </PrimaryButton>
      </div>
    </>
  );
}