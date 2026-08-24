"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import {
  emergencyTypesFixture,
  selectEmergencyTypeFixture,
  type EmergencyType,
  type EmergencyTypeFixture,
} from "@/lib/fixtures/emergency";

// Emergency Type도 Navigation이 아님
// 따라서 link가 아닌 button을 사용해야 함
function EmergencyTypeIcon({
  type,
}: {
  type: EmergencyTypeFixture["icon"];
}) {
  if (type === "transfer") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        fill="none"
      >
        <path
          d="M8 20h24M12 16l10-8 10 8M11 20v14M18 20v14M25 20v14M8 34h24"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M31 30h10M37 26l4 4-4 4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "payment") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        fill="none"
      >
        <rect
          x="5"
          y="10"
          width="34"
          height="26"
          rx="4"
          stroke="currentColor"
          strokeWidth="3"
        />

        <path
          d="M5 18h34M11 27h9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="38"
          cy="34"
          r="7"
          fill="currentColor"
        />

        <path
          d="M38 31v4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <circle
          cx="38"
          cy="37"
          r="1"
          fill="white"
        />
      </svg>
    );
  }

  if (type === "app") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        fill="none"
      >
        <rect
          x="12"
          y="5"
          width="24"
          height="38"
          rx="5"
          stroke="currentColor"
          strokeWidth="3"
        />

        <path
          d="M20 9h8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M33 25 43 41H23l10-16Z"
          fill="currentColor"
        />

        <path
          d="M33 31v4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <circle
          cx="33"
          cy="38"
          r="1"
          fill="white"
        />
      </svg>
    );
  }

  if (type === "personal-info") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        fill="none"
      >
        <path
          d="M24 5 38 11v9c0 9.5-5.8 15.8-14 20-8.2-4.2-14-10.5-14-20v-9L24 5Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <rect
          x="18"
          y="20"
          width="12"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M21 20v-3a3 3 0 0 1 6 0v3"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-10 w-10"
      fill="none"
    >
      <path
        d="M9 8h30v23H25l-9 8v-8H9V8Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M18 17a6 6 0 1 1 10 4.5C26 23.3 24 24.5 24 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle
        cx="24"
        cy="33"
        r="2"
        fill="currentColor"
      />
    </svg>
  );
}

export default function EmergencyTypeForm() {
  const router = useRouter();

  const queryClient = useQueryClient();

  // 서버에 저장하기 전, 사용자가 현재 선택 중인 피해 유형  
  const [
    selectedEmergencyType,
    setSelectedEmergencyType,
  ] = useState<EmergencyType | null>(null);

  // 현재 선택값을 저장하는 요청의 pending/error/success 상태를 관리
  const selectMutation = useMutation({
    mutationFn: selectEmergencyTypeFixture,

    onSuccess: () => {
      // 피해 유형이 바뀌면 이전 유형 기준의 즉시 대응 캐시는 더 이상 유효하지 않으므로 제거
      queryClient.removeQueries({
        queryKey: [
          "emergency",
          "immediate-action",
        ],
      });
      // 피해 유형이 바뀌면 이전 유형 기준의 연락처/증거 캐시도 함께 무효화
      queryClient.removeQueries({
        queryKey: [
          "emergency",
          "contact-evidence",
        ],
      });

      router.push("/emergency/action");
    },
  });

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedEmergencyType ||
      selectMutation.isPending
    ) {
      return;
    }

    selectMutation.mutate(selectedEmergencyType);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8"
    >
      <fieldset>
        <legend className="sr-only">
          현재 상황과 가장 가까운 피해 유형 하나를
          선택해 주세요.
        </legend>

        <div className="space-y-3 sm:space-y-4">
          {emergencyTypesFixture.map(
            (emergencyType) => {
              const isSelected =
                selectedEmergencyType ===
                emergencyType.value;

              const inputId =
                `emergency-type-${emergencyType.value}`;

              return (
                <div key={emergencyType.value}>
                  <input
                    id={inputId}
                    type="radio"
                    name="emergency-type"
                    value={emergencyType.value}
                    checked={isSelected}
                    disabled={
                      selectMutation.isPending
                    }
                    onChange={() => {
                      setSelectedEmergencyType(
                        emergencyType.value,
                      );
                    }}
                    // peer => 해당 radio 상태를 뒤에서 참고 가능
                    // sr-only => 화면에는 보이지 않지만 스크린리더에서 읽을 수 있음
                    className="peer sr-only"
                  />

                  <label
                    htmlFor={inputId}
                    className={[
                      "flex min-h-28 cursor-pointer items-center gap-4",
                      "rounded-card border bg-surface p-4 shadow-card transition",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
                      "peer-focus-visible:ring-offset-2",
                      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      "sm:min-h-32 sm:gap-5 sm:p-5",
                      isSelected
                        ? "border-primary bg-primary-subtle"
                        : "border-border hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-16 w-16 shrink-0 items-center justify-center",
                        "rounded-full bg-surface-subtle text-primary",
                        "sm:h-20 sm:w-20",
                      ].join(" ")}
                    >
                      <EmergencyTypeIcon
                        type={emergencyType.icon}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold leading-7 text-foreground sm:text-xl">
                        {emergencyType.title}
                      </span>

                      <span className="mt-1 block leading-6 text-foreground-muted">
                        {
                          emergencyType.description
                        }
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center",
                        "rounded-full border-2 font-bold",
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

      {selectMutation.isError ? (
        <div
          role="alert"
          className={[
            "mt-5 rounded-control border border-danger",
            "bg-surface p-4",
          ].join(" ")}
        >
          <p className="font-semibold text-danger">
            피해 유형을 확인하지 못했어요.
          </p>

          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            선택한 내용은 유지됩니다. 잠시 후 다시
            시도해 주세요.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={
            !selectedEmergencyType ||
            selectMutation.isPending
          }
        >
          {selectMutation.isPending
            ? "확인 중..."
            : "다음"}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          className="w-full"
          disabled={selectMutation.isPending}
          onClick={() => router.push("/")}
        >
          이전으로
        </SecondaryButton>
      </div>
    </form>
  );
}