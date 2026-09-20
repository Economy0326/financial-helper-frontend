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
  usePrepareConsultationReportMutation,
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

import {
  ApiResponseError,
} from "@/lib/api/errors";

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

  const prepareReportMutation =
    usePrepareConsultationReportMutation();

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

  const retryLimitReached =
    retryMutation.error instanceof
      ApiResponseError &&
    retryMutation.error.code ===
      "ANALYSIS_RETRY_LIMIT_EXCEEDED";

  const failedGuidance = (() => {
    switch (analysisQuery.data?.failureCode) {
      case "RETRIEVAL_UNAVAILABLE":
        return "검색 근거를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.";
      case "LAW_EVIDENCE_UNAVAILABLE":
        return "법령 근거를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.";
      case "FAP_UNAVAILABLE":
      case "PROCEDURE_UNAVAILABLE":
      case "NO_APPROVED_EVIDENCE":
        return "현재 확인된 정보와 검토된 근거만으로는 분석을 준비하지 못했어요. 내용을 확인해 주세요.";
      case "RETRIEVAL_GENERATION_MISMATCH":
      case "RETRIEVAL_MAPPING_MISSING":
        return "검색 근거를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.";
      case "SNAPSHOT_UNAVAILABLE":
      case "STALE_REVISION":
        return "상담 내용이 바뀌어 근거를 다시 확인해야 해요. 내용을 확인해 주세요.";
      case "AI_VALIDATION_FAILED":
        return "분석 결과를 안전하게 확인하지 못했어요. 잠시 후 다시 시도해 주세요.";
      default:
        return "입력하신 상담 내용은 그대로 저장되어 있어요. 다시 시도하면 같은 상담 정보로 분석을 시작합니다.";
    }
  })();

  if (isInitialLoading) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="결과 준비"
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
    const responseError =
      analysisQuery.error instanceof ApiResponseError
        ? analysisQuery.error
        : null;
    const consultationMissing =
      responseError?.code === "CONSULTATION_NOT_FOUND";
    const ownershipFailure =
      responseError?.status === 401 || responseError?.status === 403;
    const endpointMissing =
      responseError?.status === 404 && !consultationMissing;

    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="결과 준비"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {consultationMissing
              ? "현재 상담을 찾지 못했어요."
              : ownershipFailure
                ? "상담 접근 권한을 다시 확인해 주세요."
                : endpointMissing
                  ? "분석 기능을 사용할 수 없는 상태예요."
                  : "분석 상태를 확인하지 못했어요."}
          </h1>

          <p className="mt-3 leading-7 text-foreground-muted">
            {consultationMissing || ownershipFailure || endpointMissing ? (
              "저장된 상담 단계에서 다시 시작해 주세요."
            ) : (
              <>
                분석이 중단됐다는 뜻은 아니에요.
                <br />
                현재 진행 상태를 다시 확인해 주세요.
              </>
            )}
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            {consultationMissing || ownershipFailure || endpointMissing ? (
              <div className="space-y-3">
                <Link
                  href={ownershipFailure ? "/auth/login" : "/consultation/entry"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  상담 상태 확인하기
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-control border border-border bg-surface px-5 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  홈으로
                </Link>
              </div>
            ) : (
              <PrimaryButton
                type="button"
                className="w-full"
                onClick={() => {
                  void analysisQuery.refetch();
                }}
              >
                다시 확인하기
              </PrimaryButton>
            )}
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
    state.status === "NOT_STARTED" ||
    state.status === "UNSUPPORTED_SCOPE"
  ) {
    const unsupportedScope =
      state.status === "UNSUPPORTED_SCOPE" ||
      startMutation.error instanceof ApiResponseError &&
      startMutation.error.code ===
        "CONSULTATION_SCOPE_UNSUPPORTED";

    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="결과 준비"
        />

        <div className="py-16 text-center">
          <h1 className="break-keep text-3xl font-bold text-foreground">
            {unsupportedScope
              ? "현재 상담 범위를 확인했어요"
              : "분석을 시작할 준비가 됐어요."}
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            {unsupportedScope
              ? "현재 확인된 상황은 이 상담에서 구체적인 절차까지 안내하지 않아요."
              : "확인하신 상담 내용을 바탕으로 핵심 쟁점을 정리할게요."}
          </p>

          {unsupportedScope || startMutation.isError ? (
            <div className="mx-auto mt-6 max-w-md space-y-4">
              <div
                role="alert"
                className="rounded-control border border-danger bg-surface p-4"
              >
                {unsupportedScope
                  ? "상담 내용을 수정하거나 새 상담으로 다시 시작해 주세요."
                  : "분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요."}
              </div>

              {unsupportedScope ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/consultation/situation"
                    className="inline-flex min-h-12 items-center justify-center rounded-control border border-border bg-surface px-5 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  >
                    상담 내용 수정
                  </Link>
                  <Link
                    href="/consultation/entry"
                    className="inline-flex min-h-12 items-center justify-center rounded-control border border-border bg-surface px-5 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  >
                    새 상담 시작
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex min-h-12 items-center justify-center rounded-control border border-border bg-surface px-5 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  >
                    홈으로
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {!unsupportedScope ? (
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
          ) : null}
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
          label="결과 준비"
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

          <h1 className="mt-8 break-keep text-3xl font-bold text-foreground">
            확인한 내용을 정리하고 있어요
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            검토된 공식 자료와 현재 상황을 함께 확인하고 있습니다.
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
          label="결과 준비"
        />

        <div className="py-16 text-center">
          <h1 className="break-keep text-3xl font-bold text-foreground">
            분석을 완료하지 못했어요
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            {failedGuidance}
          </p>

          {retryMutation.isError ? (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-md rounded-control border border-danger bg-surface p-4"
            >
              {retryLimitReached ? (
                <>
                  <p className="font-semibold text-danger">
                    분석 재시도 횟수를 모두 사용했어요.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    같은 상담으로 분석을 계속 반복하지 않을게요.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-danger">
                    다시 분석을 시작하지 못했어요.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    잠시 후 다시 시도해 주세요.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <PrimaryButton
            type="button"
            className="mx-auto mt-8 w-full max-w-sm"
            disabled={
              retryMutation.isPending ||
              retryLimitReached ||
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

          <Link
            href="/consultation/summary?review=true"
            className={[
              "mx-auto mt-3 inline-flex min-h-12 w-full max-w-sm",
              "items-center justify-center rounded-control border border-border",
              "bg-surface px-5 py-3 font-bold text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            내용 확인하기
          </Link>

          <Link
            href="/"
            className={[
              "mx-auto mt-3 inline-flex min-h-12 w-full max-w-sm",
              "items-center justify-center rounded-control border border-border",
              "bg-surface px-5 py-3 font-bold text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            홈으로
          </Link>
        </div>
      </>
    );
  }

  if (
    state.status ===
      "INSUFFICIENT_INFORMATION"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="결과 준비"
        />

        <div className="py-16 text-center">
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-subtle text-2xl"
          >
            !
          </div>

          <h1 className="mt-6 break-keep text-3xl font-bold text-foreground">
            {state.safeActions.length > 0
              ? "확인된 정보로 지금 할 수 있는 일을 안내해 드릴게요"
              : "몇 가지 정보를 확인하면 더 정확한 안내를 받을 수 있어요"}
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            {state.safeActions.length > 0
              ? "확인되지 않은 내용에 의존하는 절차는 제외했어요."
              : "추가 정보를 한 번 보완했지만, 아직 중요한 정보가 충분하지 않아요. 확인되지 않은 내용을 추측해서 결과를 만들지 않을게요."}
          </p>

          {state.safeActions.length > 0 ? (
            <section className="mx-auto mt-8 max-w-xl rounded-card border border-primary/30 bg-primary-subtle p-5 text-left shadow-card sm:p-6">
              <h2 className="font-bold text-foreground">
                지금 할 수 있는 일
              </h2>

              <ol className="mt-4 space-y-3">
                {state.safeActions.map((action) => (
                  <li
                    key={action.actionId}
                    className="rounded-control bg-surface p-4"
                  >
                    <p className="font-bold text-foreground">
                      {action.title}
                    </p>
                    <p className="mt-1 leading-6 text-foreground-muted">
                      {action.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {state.additionalInformationNeeded.length > 0 ? (
            <section className="mx-auto mt-8 max-w-xl rounded-card border border-border bg-surface p-5 text-left shadow-card sm:p-6">
              <h2 className="font-bold text-foreground">
                아직 확인하기 어려운 정보
              </h2>

              <ul className="mt-4 space-y-3">
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
          ) : null}

          <Link
            href="/"
            className={[
              "mx-auto mt-8 inline-flex min-h-12 w-full max-w-sm",
              "items-center justify-center rounded-control",
              "bg-primary px-5 py-3 font-bold text-primary-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            홈으로
          </Link>
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
          label="결과 준비"
        />

        <div className="py-12">
          <header className="text-center">
            <h1 className="break-keep text-3xl font-bold text-foreground">
              {state.safeActions.length > 0
                ? "확인된 정보로 먼저 안내해 드릴게요"
                : "조금 더 확인할 정보가 있어요"}
            </h1>

            <p className="mt-4 leading-7 text-foreground-muted">
              {state.safeActions.length > 0
                ? "추가로 확인되지 않은 정보에 의존하는 내용은 제외했어요."
                : "현재 정보만으로 단정하지 않고, 필요한 내용을 먼저 보완할게요."}
            </p>
          </header>

          {state.safeActions.length > 0 ? (
            <section className="mx-auto mt-8 max-w-xl rounded-card border border-primary/30 bg-primary-subtle p-5 text-left shadow-card sm:p-6">
              <h2 className="font-bold text-foreground">
                지금 할 수 있는 일
              </h2>

              <ol className="mt-4 space-y-3">
                {state.safeActions.map((action) => (
                  <li
                    key={action.actionId}
                    className="rounded-control bg-surface p-4"
                  >
                    <p className="font-bold text-foreground">
                      {action.title}
                    </p>
                    <p className="mt-1 leading-6 text-foreground-muted">
                      {action.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

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

          <p className="mt-4 text-center text-sm font-medium text-foreground-muted">
            추가 정보 입력 기회는 한 번만 제공됩니다.
          </p>

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
              : "추가 정보 입력하기"}
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
        label="결과 준비"
      />

      <div
        className="py-16 text-center"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-xl font-bold text-primary"
        >
          ✓
        </div>

        <h1 className="mt-5 break-keep text-[2rem] font-bold leading-[1.28] tracking-[-0.025em] text-foreground">
          결과가 준비됐어요
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted">
          확인한 내용을 바탕으로 다음 행동을 정리했어요.
        </p>

        {prepareReportMutation.isError ? (
          <div
            role="alert"
            className="mx-auto mt-5 max-w-md rounded-control border border-danger bg-surface p-4"
          >
            <p className="font-semibold text-danger">
              결과 리포트를 준비하지 못했어요.
            </p>

            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              분석 결과는 저장되어 있어요.
              다시 결과 보기를 눌러 주세요.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href="/consultation/summary?review=true"
                className="inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                상담 내용 확인
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-control border border-border px-4 py-3 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                홈으로
              </Link>
            </div>
          </div>
        ) : null}

        <PrimaryButton
          type="button"
          className="mx-auto mt-8 w-full max-w-sm"
          disabled={
            prepareReportMutation.isPending
          }
          onClick={() => {
            if (!consultationId) {
              return;
            }

            prepareReportMutation.mutate(
              {
                consultationId,
              },
              {
                onSuccess: (
                  result,
                ) => {
                  if (
                    result.kind === "ready"
                  ) {
                    router.push(
                      `/consultation/report?consultationId=${encodeURIComponent(consultationId)}`,
                    );
                  }
                },
              },
            );
          }}
        >
          {prepareReportMutation.isPending
            ? "결과 준비 중..."
            : "결과 보기"}
        </PrimaryButton>
      </div>
    </>
  );
}
