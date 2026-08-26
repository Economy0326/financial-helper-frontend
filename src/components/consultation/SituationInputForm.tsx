"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, } from "react-hook-form";
import { z } from "zod";

import {
  useActiveConsultationQuery,
  useConsultationDetailQuery,
  useUpdateSituationMutation,
} from "@/lib/query/consultation";

import { useSessionQuery } from "@/lib/query/session";

import {
  ApiResponseError,
} from "@/lib/api/errors";

import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

const MAX_SITUATION_LENGTH = 1000;

// RHF와 Zod를 사용하여 폼의 유효성 검사
const situationSchema = z.object({
  content: z
    .string()
    .max(
      MAX_SITUATION_LENGTH,
      `상황은 ${MAX_SITUATION_LENGTH}자 이하로 입력해 주세요.`,
    )
    .refine(
      (value) => value.trim().length > 0,
      "내용을 입력해 주세요.",
    ),
});

type SituationFormValues = z.infer<typeof situationSchema>;

export default function SituationInputForm() {
  const router = useRouter();

  // useForm이 반환하는 Form 제어 함수와 상태 중 현재 화면에 필요한 값만 구조분해
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: {
      errors,
      isValid,
      isDirty,
    },
  } = useForm<SituationFormValues>({
    resolver: zodResolver(situationSchema),
    mode: "onChange",
    defaultValues: {
      content: "",
    },
  });

  const sessionQuery =
    useSessionQuery();

  const hasActiveConsultation =
    sessionQuery.data
      ?.hasActiveConsultation === true;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      hasActiveConsultation,
    );

  const consultationId =
    activeConsultationQuery.data
      ?.consultationId ?? null;

  const consultationDetailQuery =
    useConsultationDetailQuery(
      consultationId,
    );

  const situationMutation =
    useUpdateSituationMutation();

  // DB에서 조회한 기존 situationText를 RHF 폼에 복원시킴
  useEffect(() => {
    if (
      !consultationDetailQuery.data ||
      // isDirty => 사용자가 이미 폼을 수정했으면 덮어쓰지 않음
      isDirty
    ) {
      return;
    }

    // 서버에 저장된 기존 내용을 폼의 기준값으로 복원
    // is_Dirty 판별을 위해서 남겨둠
    reset({
      content:
        consultationDetailQuery.data
          .situationText ?? "",
    });
  }, [
    consultationDetailQuery.data,
    isDirty,
    reset,
  ]);

  // textarea의 현재 Form 값을 구독
  const content =
    useWatch({
      control,
      name: "content",
    }) ?? "";
  // 입력값에서 바로 계산할 수 있으므로 별도 State로 저장하지 않는 Derived State
  const characterCount = content.length;

  const errorMessage = errors.content?.message;

  async function onSubmit(
    values: SituationFormValues,
  ) {
    if (!consultationId) {
      return;
    }

    situationMutation.reset();

    try {
      await situationMutation.mutateAsync({
        consultationId,
        situationText:
          values.content.trim(),
      });

      router.push(
        "/consultation/follow-up",
      );
      // 실패해도 RHF의 현재 Form값은 그대로 남음
    } catch (error) {
      if (
        error instanceof ApiResponseError &&
        error.fieldErrors.some(
          (fieldError) =>
            fieldError.field ===
            "situationText",
        )
      ) {
        setError("content", {
          type: "server",
          message:
            "입력 내용을 확인해 주세요.",
        });
      }
    }
  }

  const descriptionIds = [
    "situation-help",
    "situation-count",
    errorMessage ? "situation-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const activeConsultation =
    activeConsultationQuery.data;

  const canEditSituation =
    Boolean(
      activeConsultation &&
        activeConsultation.category &&
        (
          activeConsultation.currentStep ===
            "SITUATION" ||
          activeConsultation.currentStep ===
            "FOLLOW_UP"
        ),
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8"
      noValidate
    >
      {sessionQuery.isSuccess &&
      !hasActiveConsultation ? (
        <div
          role="alert"
          className="mb-6 rounded-control border border-border bg-surface p-4"
        >
          <p className="font-medium text-foreground">
            먼저 문제 유형을 선택해 주세요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            상담을 시작한 뒤 상황을 입력할 수 있어요.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="situation-content"
          className="sr-only"
        >
          금융 문제 상황 설명
        </label>

        <div className="relative">
          <textarea
            id="situation-content"
            maxLength={MAX_SITUATION_LENGTH}
            placeholder={
              "예) 보험금이 지급되지 않았어요.\n대출 금리가 갑자기 올랐어요."
            }
            aria-invalid={errorMessage ? "true" : "false"}
            aria-describedby={descriptionIds}
            className={[
              "min-h-72 w-full resize-y rounded-card border bg-surface",
              "px-5 pb-14 pt-5 text-base leading-7 text-foreground",
              "placeholder:text-foreground-muted",
              "focus:outline-none focus:ring-2 focus:ring-focus",
              "sm:min-h-80 sm:px-6 sm:pt-6 sm:text-lg",
              errorMessage
                ? "border-danger"
                : "border-border-strong",
            ].join(" ")}
            {...register("content")}
          />

          <span
            id="situation-count"
            className="absolute bottom-4 right-5 text-sm text-foreground-muted"
          >
            {characterCount}/{MAX_SITUATION_LENGTH}
          </span>
        </div>

        <p
          id="situation-help"
          className="sr-only"
        >
          금융 문제 상황을 자유롭게 설명해 주세요.
          계좌번호, 비밀번호, 주민등록번호, 카드번호 등
          민감정보는 입력하지 마세요.
        </p>

        {errorMessage ? (
          <p
            id="situation-error"
            role="alert"
            className="mt-3 flex items-center gap-2 font-medium text-danger"
          >
            <span aria-hidden="true">!</span>
            {errorMessage}
          </p>
        ) : null}
      </div>

      <aside
        aria-labelledby="sensitive-information-title"
        className="mt-6 rounded-card border border-primary bg-primary-subtle p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-xl font-bold text-primary"
          >
            !
          </span>

          <div>
            <h2
              id="sensitive-information-title"
              className="font-bold text-primary sm:text-lg"
            >
              민감정보는 입력하지 마세요
            </h2>

            <p className="mt-2 leading-7 text-foreground">
              계좌번호, 비밀번호, 주민등록번호,
              카드번호 등은 입력하지 말아주세요.
            </p>
          </div>
        </div>
      </aside>

      {consultationDetailQuery.isError ? (
        <div
          role="status"
          className="mt-4 rounded-control border border-border bg-surface p-4"
        >
          <p className="font-medium text-foreground">
            이전에 저장한 내용을 불러오지 못했어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            새로 작성한 내용은 계속 입력할 수 있어요.
          </p>
        </div>
      ) : null}

      {situationMutation.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            내용을 저장하지 못했어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            작성한 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={
            !isValid ||
            !canEditSituation ||
            situationMutation.isPending ||
            sessionQuery.isLoading ||
            activeConsultationQuery.isLoading ||
            consultationDetailQuery.isLoading
          }
        >
          {situationMutation.isPending
            ? "저장 중..."
            : "다음"}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          className="w-full"
          disabled={situationMutation.isPending}
          onClick={() =>
            router.push(
              "/consultation/problem-category",
            )
          }
        >
          이전으로
        </SecondaryButton>
      </div>
    </form>
  );
}