"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  useForm,
  useWatch,
} from "react-hook-form";

import { z } from "zod";

import {
  useActiveConsultationQuery,
  useConsultationDetailQuery,
  usePrepareFollowUpMutation,
  useUpdateSituationMutation,
} from "@/lib/query/consultation";

import { useSessionQuery } from "@/lib/query/session";

import {
  ApiResponseError,
  ApiContractError,
  ApiNetworkError,
} from "@/lib/api/errors";

import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import {
  getSituationPageAccess,
} from "@/lib/consultation/access";

import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

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

function getSituationSubmitErrorMessage(
  error: Error,
) {
  if (error instanceof ApiNetworkError) {
    return "서버에 연결할 수 없어요. 작성한 내용은 유지되어 있으니 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  if (error instanceof ApiContractError) {
    return "서버 응답을 확인하지 못했어요. 작성한 내용은 그대로 유지됩니다.";
  }

  if (error instanceof ApiResponseError) {
    switch (error.code) {
      case "GUEST_SESSION_EXPIRED":
        return "상담 세션이 만료되어 현재 상담에 저장할 수 없어요.";

      case "CONSULTATION_NOT_FOUND":
        return "현재 상담을 확인하지 못해 내용을 저장할 수 없어요.";

      case "INVALID_CONSULTATION_STATE":
        return "현재 상담 단계에서는 이 내용을 저장할 수 없어요.";

      case "VALIDATION_ERROR":
        return "입력 내용을 확인해 주세요.";

      default:
        if (error.status >= 500) {
          return "서버에서 내용을 저장하지 못했어요. 작성한 내용은 유지됩니다.";
        }
    }
  }

  return "내용을 저장하지 못했어요. 작성한 내용은 유지됩니다.";
}

function isUnavailableConsultation(
  error: Error | null,
) {
  return (
    error instanceof ApiResponseError &&
    (
      error.code ===
        "GUEST_SESSION_EXPIRED" ||
      error.code ===
        "CONSULTATION_NOT_FOUND"
    )
  );
}

type SituationFormValues =
  z.infer<typeof situationSchema>;

export default function SituationInputForm() {
  const router = useRouter();

  // useForm이 반환하는 Form 제어 함수와 상태 중 현재 화면에 필요한 값만 구조분해
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    formState: {
      errors,
      isValid,
      isDirty,
    },
  } = useForm<SituationFormValues>({
    resolver: zodResolver(
      situationSchema,
    ),
    mode: "onChange",
    defaultValues: {
      content: "",
    },
  });

  const sessionQuery =
    useSessionQuery();

  const hasSessionError =
    sessionQuery.isError;

  const hasActiveConsultation =
    sessionQuery.isSuccess &&
    sessionQuery.data.hasActiveConsultation == true;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      hasActiveConsultation,
    );

  const hasActiveConsultationError =
    !hasSessionError &&
    hasActiveConsultation &&
    activeConsultationQuery.isError;

  const currentStep =
    activeConsultationQuery.data
      ?.currentStep ?? null;

  const pageAccess =
    getSituationPageAccess(
      currentStep,
    );

  const consultationId =
    activeConsultationQuery.data
      ?.consultationId ?? null;

  // activeQuery는 현재 상담의 존재 여부/ID/진행 상태
  // detailQuery는 실제 서버의 상담 상세 입력 데이터 조회용
  const consultationDetailQuery =
    useConsultationDetailQuery(
      consultationId,
    );

  const followUpPreparationMutation =
    usePrepareFollowUpMutation();

  const situationMutation =
    useUpdateSituationMutation();

  const isSubmitPending =
    situationMutation.isPending ||
    followUpPreparationMutation.isPending;

  // 치명적 조회 실패 종류 -> 404, 401
  const hasFatalDetailError =
    isUnavailableConsultation(
      consultationDetailQuery.error,
    );

  const canEditSituation =
    pageAccess.status === "allowed" &&
    Boolean(
      activeConsultationQuery.data
        ?.category,
    ) &&
    !hasFatalDetailError;

  const isConsultationStateLoading =
    sessionQuery.isLoading ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isLoading
    );

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
  const characterCount =
    content.length;

  const errorMessage =
    errors.content?.message;

  function getSituationFieldErrorMessage(
    error: ApiResponseError,
  ) {
    const fieldError =
      error.fieldErrors.find(
        (item) =>
          item.field ===
          "situationText",
      );

    if (!fieldError) {
      return null;
    }

    if (fieldError.reason === "REQUIRED") {
      return "내용을 입력해 주세요.";
    }

    return "입력 내용을 확인해 주세요.";
  }

  async function onSubmit(
    values: SituationFormValues,
  ) {
    if (
      !consultationId ||
      situationMutation.isPending ||
      !canEditSituation
    ) {
      return;
    }

    clearErrors("content");
    situationMutation.reset();

    try {
      await situationMutation.mutateAsync({
        consultationId,
        situationText:
          values.content.trim(),
      });

      const followUpState =
        await followUpPreparationMutation
          .mutateAsync({
            consultationId,
          });

      if (
        followUpState.kind === "complete"
      ) {
        router.push(
          "/consultation/summary",
        );

        return;
      }

router.push(
  "/consultation/follow-up",
);

      // 실패해도 form 값은 그대로 남김
    } catch (error) {
      if (error instanceof ApiResponseError) {
        const fieldMessage =
          getSituationFieldErrorMessage(
            error,
          );

        if (fieldMessage) {
          setError("content", {
            type: "server",
            message: fieldMessage,
          });
        }

        if (
          error.code ===
          "INVALID_CONSULTATION_STATE"
        ) {
          void activeConsultationQuery.refetch();
        }

        if (
          error.code ===
            "INVALID_CONSULTATION_STATE"
        ) {
          void activeConsultationQuery.refetch();
        }

        if (
          error.code ===
            "CONSULTATION_NOT_FOUND"
        ) {
          void sessionQuery.refetch();
          void activeConsultationQuery.refetch();
        }
      }
    }
  }

  const descriptionIds = [
    "situation-help",
    "situation-count",
    errorMessage
      ? "situation-error"
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8"
      noValidate
      aria-busy={isSubmitPending}
    >
      {isConsultationStateLoading ? (
        <p
          role="status"
          className="mb-6 text-sm text-foreground-muted"
        >
          상담 내용을 확인하고 있어요.
        </p>
      ) : null}

      {hasSessionError ? (
        <div
          role="alert"
          className="mb-6 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            상담 상태를 확인하지 못했어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            인터넷 연결을 확인한 뒤 다시 시도해 주세요.
          </p>

          <button
            type="button"
            onClick={() => {
              void sessionQuery.refetch();
            }}
            className="mt-4 min-h-11 font-semibold text-primary underline"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {hasActiveConsultationError ? (
        <div
          role="alert"
          className="mb-6 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            진행 중 상담을 불러오지 못했어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            잠시 후 다시 시도해 주세요.
          </p>

          <button
            type="button"
            onClick={() => {
              void activeConsultationQuery.refetch();
            }}
            className="mt-4 min-h-11 font-semibold text-primary underline"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {sessionQuery.isSuccess &&
      !hasActiveConsultation ? (
        <div
          role="alert"
          className="mt-6 mb-6 rounded-card border border-primary bg-primary-subtle p-5 sm:mt-8 sm:p-6"
        >
          <p className="break-keep text-lg font-bold text-foreground">
            먼저 문제 유형을 선택해 주세요.
          </p>

          <p className="mt-2 break-keep leading-6 text-foreground-muted">
            상담을 시작한 뒤 상황을 입력할 수 있어요.
          </p>

          <Link
            href="/consultation/problem-category"
            className={[
              "mt-5 inline-flex min-h-12 items-center justify-center",
              "rounded-control bg-primary px-5 py-3",
              "font-bold text-primary-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            문제 유형 선택하기
          </Link>
        </div>
      ) : null}

      {hasActiveConsultation &&
      pageAccess.status ===
        "wrong-step" ? (
        <div
          role="alert"
          className="mt-6 mb-6 rounded-card border border-border bg-surface p-5 sm:mt-8 sm:p-6"
        >
          <p className="break-keep font-medium text-foreground">
            현재 상담 단계와 맞지 않는 화면이에요.
          </p>

          <p className="mt-1 break-keep text-sm text-foreground-muted">
            저장된 상담 단계로 돌아가서 계속 진행해 주세요.
          </p>

          <Link
            href={getConsultationStepHref(
              pageAccess.currentStep,
            )}
            className={[
              "mt-5 inline-flex min-h-12 items-center justify-center",
              "rounded-control bg-primary px-5 py-3",
              "font-bold text-primary-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            현재 단계로 이동
          </Link>
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
            maxLength={
              MAX_SITUATION_LENGTH
            }
            placeholder={
              "예) 보험금이 지급되지 않았어요.\n대출 금리가 갑자기 올랐어요."
            }
            disabled={isSubmitPending}
            aria-invalid={
              errorMessage
                ? "true"
                : "false"
            }
            aria-describedby={
              descriptionIds
            }
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
            {...register("content", {
              onChange: () => {
                if (
                  errors.content?.type ===
                    "server"
                ) {
                  clearErrors("content");
                }

                if (
                  situationMutation.isError
                ) {
                  situationMutation.reset();
                }

                if (
                  followUpPreparationMutation.isError
                ) {
                  followUpPreparationMutation.reset();
                }
              },
            })}
          />

          <span
            id="situation-count"
            className="absolute bottom-4 right-5 text-sm text-foreground-muted"
          >
            {characterCount}/
            {MAX_SITUATION_LENGTH}
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
            <span aria-hidden="true">
              !
            </span>

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

      {hasFatalDetailError ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            현재 상담을 불러올 수 없어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            상담 세션이 만료되었거나 진행 중 상담을 찾을 수 없어요.
          </p>
        </div>
      ) : null}

      {consultationDetailQuery.isError &&
      !hasFatalDetailError ? (
        <div
          role="status"
          className="mt-4 rounded-control border border-border bg-surface p-4"
        >
          <p className="font-medium text-foreground">
            이전에 저장한 내용을 불러오지 못했어요.
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            현재 작성 중인 내용은 유지됩니다.
          </p>

          <button
            type="button"
            disabled={
              consultationDetailQuery.isFetching
            }
            onClick={() => {
              // isDirty로 인해서 사용자 입력을 덮어쓰지 않게 함
              void consultationDetailQuery.refetch();
            }}
            className="mt-4 min-h-11 font-semibold text-primary underline disabled:opacity-60"
          >
            {consultationDetailQuery.isFetching
              ? "다시 불러오는 중..."
              : "다시 시도"}
          </button>
        </div>
      ) : null}

      {situationMutation.error ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            {getSituationSubmitErrorMessage(
              situationMutation.error,
            )}
          </p>

          <p className="mt-1 text-sm text-foreground-muted">
            작성한 내용은 이 화면에 그대로 유지됩니다.
          </p>
        </div>
      ) : null}

      {followUpPreparationMutation.error ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-medium text-danger">
            추가 질문을 준비하지 못했어요.
          </p>

          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            입력하신 상황은 이미 저장되어 있어요.
            잠시 후 다시 다음을 눌러 주세요.
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
            isSubmitPending ||
            isConsultationStateLoading ||
            sessionQuery.isError ||
            activeConsultationQuery.isError ||
            consultationDetailQuery.isLoading
          }
        >
          {followUpPreparationMutation.isPending
            ? "질문 준비 중..."
            : situationMutation.isPending
              ? "저장 중..."
              : "다음"}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          className="w-full"
          disabled={
            isSubmitPending
          }
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