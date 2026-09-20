"use client";

import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import Link from "next/link";

import type {
  ConsultationCategory,
} from "@/lib/api/types";

import {
  useActiveConsultationQuery,
  useStartConsultationMutation,
  useUpdateCategoryMutation,
} from "@/lib/query/consultation";

import { useSessionQuery } from "@/lib/query/session";

import {
  ApiContractError,
  ApiNetworkError,
  ApiResponseError,
} from "@/lib/api/errors";

import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import {
  getCategoryPageAccess,
} from "@/lib/consultation/access";
import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

const categories = [
  {
    value: "CARD",
    title: "카드",
    description: "분실·도난 · 모르는 결제",
  },
  {
    value: "FINANCIAL_FRAUD",
    title: "송금·사기·개인정보",
    description: "보이스피싱·의심 송금 · 무단이체·모르는 출금 · 스미싱·악성 앱",
  },
  {
    value: "UNKNOWN",
    title: "잘 모르겠어요",
    description: "어떤 유형인지 모르겠다면 여기서 시작하세요",
  },
] as const;

type ProblemCategory =
  ConsultationCategory;

function getCategorySubmitErrorMessage(
  error: Error,
) {
  if (error instanceof ApiNetworkError) {
    return "연결 상태를 확인하지 못했어요. 선택은 유지되어 있으니 잠시 후 다시 시도해 주세요.";
  }

  if (error instanceof ApiContractError) {
    return "요청 결과를 확인하지 못했어요. 선택은 유지되어 있으니 다시 시도해 주세요.";
  }

  if (error instanceof ApiResponseError) {
    switch (error.code) {
      case "INVALID_CONSULTATION_STATE":
        return "이미 다음 단계까지 진행한 상담이에요. 현재 상담 단계에서 계속 진행해 주세요.";

      case "GUEST_SESSION_EXPIRED":
        return "상담 세션을 확인하지 못했어요. 다시 시도해 주세요.";

      case "CONSULTATION_NOT_FOUND":
        return "진행 중 상담을 확인하지 못했어요.";

      case "VALIDATION_ERROR":
        return "선택 내용을 확인해 주세요.";

      case "ACCOUNT_NEW_CONSULTATION_QUOTA_EXHAUSTED": {
        const nextAvailableAt = error.response?.error.nextAvailableAt;
        if (nextAvailableAt) {
          const date = new Date(nextAvailableAt);
          if (!Number.isNaN(date.getTime())) {
            return `최근 7일 새 상담 한도에 도달했어요. ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date)}부터 새 상담을 시작할 수 있어요. 기존 상담은 계속 이용할 수 있어요.`;
          }
        }
        return "최근 7일 새 상담 한도에 도달했어요. 기존 상담은 계속 이용할 수 있어요.";
      }

      default:
        if (error.status >= 500) {
          return "요청을 처리하지 못했어요. 선택은 유지되어 있으니 잠시 후 다시 시도해 주세요.";
        }
    }
  }

  return "선택 내용을 저장하지 못했어요. 다시 시도해 주세요.";
}

// 카드를 클릭 후 바로 Navigation이 아니라 다음 버튼을 눌러야 이동 => UX 원칙
export default function ProblemCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startNew = searchParams.get("new") === "true";

  // 사용자가 현재 화면에서 직접 선택한 Category
  const [
    selectedCategoryOverride,
    setSelectedCategoryOverride,
  ] = useState<ProblemCategory | null>(null);

  const sessionQuery = useSessionQuery();

  const activeConsultationQuery =
    useActiveConsultationQuery(
      sessionQuery.data
        ?.hasActiveConsultation === true,
    );
  
  const currentStep =
    activeConsultationQuery.data
      ?.currentStep ?? null;

  const pageAccess =
    getCategoryPageAccess(currentStep);

  const savedCategory =
    activeConsultationQuery.data?.category ?? null;

  // 사용자가 직접 선택한 값이 있으면 그 값을 우선하고,
  // 아직 선택하지 않았다면 서버에 저장된 값을 사용
  const selectedCategory =
    selectedCategoryOverride ??
    savedCategory;

  const startConsultationMutation =
    useStartConsultationMutation();

  const updateCategoryMutation =
    useUpdateCategoryMutation();

  const isSubmitting =
    startConsultationMutation.isPending ||
    updateCategoryMutation.isPending;

  const submitError =
    updateCategoryMutation.error ??
    startConsultationMutation.error;

  const isCategoryLocked =
    pageAccess.status === "wrong-step";

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedCategory ||
      isSubmitting ||
      isCategoryLocked
    ) {
      return;
    }

    startConsultationMutation.reset();
    updateCategoryMutation.reset();

    try {
      const consultation =
        await startConsultationMutation
          .mutateAsync(startNew);

      await updateCategoryMutation.mutateAsync({
        consultationId:
          consultation.consultationId,

        category:
          selectedCategory,
      });

      router.push(
        "/consultation/situation",
      );
    } catch (error) {
      if (
        error instanceof ApiResponseError &&
        error.code === "GENERAL_CONSULTATION_LOGIN_REQUIRED"
      ) {
        router.push("/auth/login");
        return;
      }
      if (
        error instanceof ApiResponseError &&
        error.code ===
          "INVALID_CONSULTATION_STATE"
      ) {
        void activeConsultationQuery.refetch();
      }
    }
  }

  return (
    <>
      {startNew && activeConsultationQuery.data ? (
        <aside
          role="note"
          className="mt-6 rounded-control border border-primary bg-primary-subtle p-4 sm:mt-8 sm:p-5"
        >
          <p className="break-keep font-semibold text-foreground">
            새 상담을 시작하면 현재 진행 중인 상담은 종료돼요.
          </p>
          <p className="mt-1 break-keep text-sm leading-6 text-foreground-muted">
            아래에서 새 상담의 문제 유형을 선택해 주세요.
          </p>
        </aside>
      ) : null}
      {pageAccess.status === "wrong-step" ? (
        <div
          role="alert"
          className="mt-6 mb-6 rounded-card border border-primary bg-primary-subtle p-5 sm:mt-8 sm:p-6"
        >
          <p className="break-keep text-lg font-bold text-foreground">
            이미 다음 단계까지 진행한 상담이에요.
          </p>

          <p className="mt-2 break-keep leading-6 text-foreground-muted">
            현재 상담 단계로 돌아가서 계속 진행해 주세요.
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
      <form onSubmit={handleSubmit} className="mt-8">
        <fieldset>
          <legend className="sr-only">
            금융 문제 유형 하나를 선택해 주세요.
          </legend>

          <div className="space-y-3 sm:space-y-4">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;

              return (
                <div key={category.value}>
                  {/* 하나만 선택하므로 Radio 사용 */}
                  <input
                    id={`problem-category-${category.value}`}
                    type="radio"
                    disabled={
                      isSubmitting ||
                      isCategoryLocked
                    }
                    name="problem-category"
                    value={category.value}
                    checked={isSelected}
                    onChange={() => {
                      // 사용자가 현재 화면에서 선택한 값을 임시 UI State로 저장
                      setSelectedCategoryOverride(
                        category.value,
                      );

                      // 새 선택 시 이전 저장 실패 상태 초기화
                      startConsultationMutation.reset();
                      updateCategoryMutation.reset();
                    }}
                    // peer: radio의 상태를 뒤쪽 카드 UI 스타일에 연결하기 위해 필요
                    // sr-only: 실제 radio는 화면에서만 숨기고 접근성/키보드 기능은 유지
                    className="peer sr-only"
                  />

                  <label
                    htmlFor={`problem-category-${category.value}`}
                    className={[
                      "flex min-h-24 cursor-pointer items-center gap-4 rounded-control border bg-surface px-5 py-4",
                      "transition-colors",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2",
                      "sm:min-h-28 sm:px-6 sm:py-5",
                      isSelected
                        ? "border-primary bg-primary-subtle"
                        : "border-border hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span className="min-w-0 flex-1 break-keep">
                      <span className="block text-xl font-bold leading-7 text-foreground">
                        {category.title}
                      </span>

                      <span className="mt-1 block text-base font-medium leading-6 text-foreground-muted">
                        {category.description}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg font-bold",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-transparent bg-transparent text-foreground-muted",
                      ].join(" ")}
                    >
                      {isSelected ? "✓" : "›"}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        {submitError ? (
          <div
            role="alert"
            className="mt-4 rounded-control border border-danger bg-surface p-4"
          >
            <p className="font-medium text-danger">
              {getCategorySubmitErrorMessage(
                submitError,
              )}
            </p>

            <p className="mt-1 text-sm text-foreground-muted">
              선택한 항목은 그대로 유지됩니다.
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          <PrimaryButton
            type="submit"
            disabled={
              !selectedCategory ||
              isSubmitting ||
              isCategoryLocked
            }
            className="w-full"
          >
            {isSubmitting ? "저장 중..." : "다음"}
          </PrimaryButton>

          <SecondaryButton
            type="button"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => router.push("/")}
          >
            이전으로
          </SecondaryButton>
        </div>
      </form>
    </>
  );
}
