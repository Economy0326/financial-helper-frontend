"use client";

import {
  useEffect,
  useState,
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
  useFollowUpStateQuery,
  usePrepareFollowUpMutation,
  useUpdateFollowUpAnswerMutation,
} from "@/lib/query/consultation";

import {
  useSessionQuery,
} from "@/lib/query/session";

import {
  getFollowUpPageAccess,
} from "@/lib/consultation/access";

import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

export default function FollowUpFlow() {
  const router =
    useRouter();

  const [
    selection,
    setSelection,
  ] = useState<{
    questionId: string;
    optionValue: string;
  } | null>(null);


  // 현재 화면에서 조회할 질문 번호
  // null이면 Backend가 현재 미응답 질문을 결정하고,
  // number면 사용자가 해당 이전 질문을 조회
  const [
    viewQuestionNumber,
    setViewQuestionNumber,
  ] = useState<number | null>(
    null,
  );

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
    getFollowUpPageAccess(
      currentStep,
    );

  const canLoadFollowUp =
    pageAccess.status === "allowed" &&
    Boolean(consultationId);

  const followUpQuery =
    useFollowUpStateQuery(
      consultationId,
      viewQuestionNumber,
      canLoadFollowUp,
    );

  const prepareMutation =
    usePrepareFollowUpMutation();

  const answerMutation =
    useUpdateFollowUpAnswerMutation();

  useEffect(() => {
    if (
      currentStep === "SUMMARY"
    ) {
      router.replace(
        "/consultation/summary",
      );
    }
  }, [
    currentStep,
    router,
  ]);

  useEffect(() => {
    if (
      followUpQuery.data?.kind ===
        "complete"
    ) {
      router.replace(
        "/consultation/summary",
      );
    }
  }, [
    followUpQuery.data,
    router,
  ]);

  const isLoading =
    sessionQuery.isLoading ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isLoading
    ) ||
    (
      canLoadFollowUp &&
      followUpQuery.isLoading
    );

  if (isLoading) {
    return (
      <>
        <ConsultationProgress
          currentStep={3}
          totalSteps={6}
          label="AI 추가 질문"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            추가 질문을 확인하고 있어요.
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
          먼저 문제 유형을 선택하고
          상담 내용을 입력해 주세요.
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
    currentStep !== "SUMMARY"
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          현재 상담 단계와 맞지 않는 화면이에요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          저장된 상담 단계에서
          계속 진행해 주세요.
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
    followUpQuery.isError
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={3}
          totalSteps={6}
          label="AI 추가 질문"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            질문을 불러오지 못했어요.
          </h1>

          <p className="mt-3 leading-7 text-foreground-muted">
            입력하신 내용은 서버에 저장되어 있어요.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                void sessionQuery.refetch();

                void activeConsultationQuery
                  .refetch();

                void followUpQuery.refetch();
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
              이전으로
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state =
    followUpQuery.data;

  // Situation 저장은 됐지만
  // Follow-up prepare가 실패했거나,
  // FOLLOW_UP URL로 직접 들어온 Recovery State
  if (
    state?.kind ===
    "not-prepared"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={3}
          totalSteps={6}
          label="AI 추가 질문"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            추가 질문을 준비할게요.
          </h1>

          <p className="mt-3 leading-7 text-foreground-muted">
            입력하신 내용을 바탕으로
            꼭 필요한 정보만 확인할게요.
          </p>

          {prepareMutation.isError ? (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-md rounded-control border border-danger bg-surface p-4"
            >
              <p className="font-semibold text-danger">
                질문을 준비하지 못했어요.
              </p>

              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                입력 내용은 그대로 저장되어 있습니다.
              </p>
            </div>
          ) : null}

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              disabled={
                prepareMutation.isPending ||
                !consultationId
              }
              onClick={() => {
                if (!consultationId) {
                  return;
                }

                prepareMutation.mutate(
                  {
                    consultationId,
                  },
                  {
                    onSuccess: (
                      nextState,
                    ) => {
                      if (
                        nextState.kind ===
                        "complete"
                      ) {
                        router.push(
                          "/consultation/summary",
                        );
                      }
                    },
                  },
                );
              }}
            >
              {prepareMutation.isPending
                ? "질문 준비 중..."
                : "질문 준비하기"}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              disabled={
                prepareMutation.isPending
              }
              onClick={() =>
                router.push(
                  "/consultation/situation",
                )
              }
            >
              이전으로
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  // question 상태에서 화면을 그리기 위해 필요한 값이
  // 실제로 모두 존재하는지 먼저 확인한다.  
  if (
    !state ||
    state.kind !== "question" ||
    !state.question ||
    state.currentQuestionNumber == null ||
    state.totalQuestions == null
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={3}
          totalSteps={6}
          label="AI 추가 질문"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
        >
          <p className="font-semibold text-foreground">
            다음 단계로 이동하고 있어요.
          </p>
        </div>
      </>
    );
  }

  // null에서 검증이 끝난 값을 Local 변수로 고정
  const question =
    state.question;

  const currentQuestionNumber =
    state.currentQuestionNumber;

  const totalQuestions =
    state.totalQuestions;

  // 현재 선택값 우선, 없으면 저장된 답변 사용
  const selectedOption =
    selection?.questionId ===
    question.id
      ? selection.optionValue
      : state.savedAnswer;

  const isLastQuestion =
    currentQuestionNumber ===
    totalQuestions;

  const isPending =
    answerMutation.isPending ||
    prepareMutation.isPending;

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !consultationId ||
      !selectedOption ||
      answerMutation.isPending
    ) {
      return;
    }

    answerMutation.mutate(
      {
        consultationId,

        questionId:
          question.id,

        answer:
          selectedOption,
      },
      {
        onSuccess: (
          nextState,
        ) => {
          setSelection(null);

          setViewQuestionNumber(
            null,
          );

          if (
            nextState.kind ===
            "complete"
          ) {
            router.push(
              "/consultation/summary",
            );
          }
        },
      },
    );
  }

  function handlePrevious() {
    if (isPending) {
      return;
    }

    setSelection(null);

    if (
      currentQuestionNumber <= 1
    ) {
      router.push(
        "/consultation/situation",
      );

      return;
    }

    setViewQuestionNumber(
      currentQuestionNumber - 1,
    );
  }

  return (
    <>
      <ConsultationProgress
        currentStep={3}
        totalSteps={6}
        label="AI 추가 질문"
      />

      <header className="mt-10 text-center sm:mt-12">
        <p className="text-sm font-semibold text-primary">
          추가 질문{" "}
          {currentQuestionNumber}/
          {totalQuestions}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {question.question}
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          {question.description}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-8"
        aria-busy={
          answerMutation.isPending
        }
      >
        <fieldset>
          <legend className="sr-only">
            {question.question}
          </legend>

          <div className="space-y-3 sm:space-y-4">
            {question.options.map(
              (option, index) => {
                const isSelected =
                  selectedOption ===
                  option.value;

                const inputId =
                  `follow-up-${question.id}-${option.value}`;

                return (
                  <div
                    key={
                      option.value
                    }
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={
                        question.id
                      }
                      value={
                        option.value
                      }
                      checked={
                        isSelected
                      }
                      disabled={
                        isPending
                      }
                      onChange={() =>
                        setSelection({
                          questionId:
                            question.id,

                          optionValue:
                            option.value,
                        })
                      }
                      className="peer sr-only"
                    />

                    <label
                      htmlFor={inputId}
                      className={[
                        "flex min-h-28 cursor-pointer items-center gap-4 rounded-card",
                        "border bg-surface p-4 shadow-card transition",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
                        "peer-focus-visible:ring-offset-2",
                        "sm:min-h-32 sm:p-5",
                        isSelected
                          ? "border-primary bg-primary-subtle"
                          : "border-border hover:border-border-strong",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "flex h-14 w-14 shrink-0 items-center justify-center",
                          "rounded-full text-xl font-bold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-subtle text-primary",
                        ].join(
                          " ",
                        )}
                      >
                        {isSelected
                          ? "✓"
                          : index +
                            1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-bold text-foreground sm:text-xl">
                          {
                            option.label
                          }
                        </span>

                        <span className="mt-1 block leading-6 text-foreground-muted">
                          {
                            option.description
                          }
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          "border-2 font-bold",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-strong bg-surface",
                        ].join(
                          " ",
                        )}
                      >
                        {isSelected
                          ? "✓"
                          : ""}
                      </span>
                    </label>
                  </div>
                );
              },
            )}
          </div>
        </fieldset>

        {answerMutation.isError ? (
          <div
            role="alert"
            className="mt-4 rounded-control border border-danger bg-surface p-4"
          >
            <p className="font-semibold text-danger">
              답변을 저장하지 못했어요.
            </p>

            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              선택한 답변은 유지됩니다.
              다시 시도해 주세요.
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          <PrimaryButton
            type="submit"
            className="w-full"
            disabled={
              !selectedOption ||
              isPending
            }
          >
            {answerMutation.isPending
              ? "저장 중..."
              : isLastQuestion
                ? "내용 확인하기"
                : "다음"}
          </PrimaryButton>

          <SecondaryButton
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={
              handlePrevious
            }
          >
            이전으로
          </SecondaryButton>
        </div>
      </form>
    </>
  );
}