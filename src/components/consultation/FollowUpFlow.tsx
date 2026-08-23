"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

import {
  getFollowUpStateFixture,
  moveToPreviousFollowUpQuestionFixture,
  saveFollowUpAnswerFixture,
  type FollowUpStateFixture,
} from "@/lib/fixtures/consultation";

const followUpQueryKey = [
  "consultation",
  "follow-up",
] as const;

// AI 추가 질문 flow
export default function FollowUpFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 아직 저장하지 않은 현재 선택 값만 Local State로 관리
  const [selectedOption, setSelectedOption] =
    useState<string | null>(null);

  // Question과 기존 저장 Answer만 TanStack Query의 Server State가 소유
  const followUpQuery = useQuery({
    queryKey: followUpQueryKey,
    queryFn: getFollowUpStateFixture,
    retry: false,
  });

  const answerMutation = useMutation({
    mutationFn: saveFollowUpAnswerFixture,

    onSuccess: (nextState) => {
      queryClient.setQueryData(
        followUpQueryKey,
        nextState,
      );

      if (
        nextState.kind === "complete" ||
        nextState.kind === "none"
      ) {
        router.push("/consultation/summary");
      }
    },
  });

  const previousMutation = useMutation({
    mutationFn: moveToPreviousFollowUpQuestionFixture,

    onSuccess: (previousState) => {
      if (previousState.kind === "previous-step") {
        router.push("/consultation/situation");
        return;
      }

      queryClient.setQueryData(
        followUpQueryKey,
        previousState,
      );
    },
  });

  useEffect(() => {
    if (followUpQuery.data?.kind !== "question") {
      setSelectedOption(null);
      return;
    }

    setSelectedOption(
      followUpQuery.data.savedAnswer,
    );
  }, [followUpQuery.data]);

  useEffect(() => {
    if (
      followUpQuery.data?.kind === "complete" ||
      followUpQuery.data?.kind === "none"
    ) {
      router.replace("/consultation/summary");
    }
  }, [followUpQuery.data, router]);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      followUpQuery.data?.kind !== "question" ||
      !selectedOption ||
      answerMutation.isPending
    ) {
      return;
    }

    answerMutation.mutate({
      questionId: followUpQuery.data.question.id,
      answer: selectedOption,
    });
  }

  function handlePrevious() {
    if (
      answerMutation.isPending ||
      previousMutation.isPending
    ) {
      return;
    }

    previousMutation.mutate();
  }

  if (followUpQuery.isLoading) {
    return (
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
    );
  }

  if (followUpQuery.isError) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          질문을 불러오지 못했어요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          입력하신 내용은 그대로 유지되어 있어요.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => followUpQuery.refetch()}
          >
            다시 시도
          </PrimaryButton>

          <SecondaryButton
            type="button"
            className="w-full"
            onClick={() =>
              router.push("/consultation/situation")
            }
          >
            이전으로
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const state: FollowUpStateFixture | undefined =
    followUpQuery.data;

  if (!state || state.kind !== "question") {
    return (
      <div
        className="py-20 text-center"
        aria-live="polite"
      >
        <p className="font-semibold text-foreground">
          다음 단계로 이동하고 있어요.
        </p>
      </div>
    );
  }

  const isLastQuestion =
    state.currentQuestionNumber ===
    state.totalQuestions;

  const isPending =
    answerMutation.isPending ||
    previousMutation.isPending;

  return (
    <>
      <ConsultationProgress
        currentStep={3}
        totalSteps={6}
        label="AI 추가 질문"
      />

      <header className="mt-10 text-center sm:mt-12">
        <p className="text-sm font-semibold text-primary">
          추가 질문 {state.currentQuestionNumber}/
          {state.totalQuestions}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {state.question.question}
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          {state.question.description}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-8"
      >
        <fieldset>
          <legend className="sr-only">
            {state.question.question}
          </legend>

          <div className="space-y-3 sm:space-y-4">
            {state.question.options.map(
              (option, index) => {
                const isSelected =
                  selectedOption === option.value;

                const inputId = `follow-up-${state.question.id}-${option.value}`;

                return (
                  <div key={option.value}>
                    <input
                      id={inputId}
                      type="radio"
                      name={state.question.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={() =>
                        setSelectedOption(
                          option.value,
                        )
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
                        ].join(" ")}
                      >
                        {isSelected
                          ? "✓"
                          : index + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-bold text-foreground sm:text-xl">
                          {option.label}
                        </span>

                        <span className="mt-1 block leading-6 text-foreground-muted">
                          {option.description}
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
                        ].join(" ")}
                      >
                        {isSelected ? "✓" : ""}
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
              선택한 답변은 유지됩니다. 다시
              시도해 주세요.
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          <PrimaryButton
            type="submit"
            className="w-full"
            disabled={
              !selectedOption || isPending
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
            onClick={handlePrevious}
          >
            {previousMutation.isPending
              ? "이동 중..."
              : "이전으로"}
          </SecondaryButton>
        </div>
      </form>
    </>
  );
}