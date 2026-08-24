"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

const categories = [
  {
    value: "INSURANCE",
    title: "보험",
    description: "보험금 · 계약 · 해지 문제",
    icon: "shield",
  },
  {
    value: "LOAN",
    title: "대출",
    description: "금리 · 연체 · 상환 문제",
    icon: "loan",
  },
  {
    value: "CARD",
    title: "카드",
    description: "결제 · 취소 · 수수료 문제",
    icon: "card",
  },
  {
    value: "UNKNOWN",
    title: "잘 모르겠어요",
    description: "어떤 유형인지 모르겠다면 여기서 시작하세요",
    icon: "unknown",
  },
] as const;

type ProblemCategory = (typeof categories)[number]["value"];

const MOCK_SUBMIT_ERROR = false;

async function saveProblemCategoryFixture(category: ProblemCategory) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 300);
  });

  if (MOCK_SUBMIT_ERROR) {
    throw new Error("Mock submit error");
  }

  return category;
}

function CategoryIcon({
  type,
}: {
  type: (typeof categories)[number]["icon"];
}) {
  if (type === "shield") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-9 w-9"
        fill="none"
      >
        <path
          d="M20 4 32 9v8c0 8.3-4.9 13.6-12 17.5C12.9 30.6 8 25.3 8 17V9l12-5Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M15 14h10M15 20h10M15 26h7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "loan") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-9 w-9"
        fill="none"
      >
        <rect
          x="5"
          y="10"
          width="30"
          height="20"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle
          cx="20"
          cy="20"
          r="5"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M9 15h3M28 25h3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "card") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-9 w-9"
        fill="none"
      >
        <rect
          x="4"
          y="8"
          width="32"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M4 15h32"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M10 24h8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="h-9 w-9"
      fill="none"
    >
      <path
        d="M8 8h24v18H20l-7 6v-6H8V8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 15.5a4 4 0 1 1 6.8 2.8C21.2 19.8 20 20.5 20 23"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="27" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 카드를 클릭 후 바로 Navigation이 아니라 다음 버튼을 눌러야 이동 => UX 원칙
export default function ProblemCategoryForm() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] =
    useState<ProblemCategory | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCategory || isSubmitting) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await saveProblemCategoryFixture(selectedCategory);

      router.push("/consultation/situation");
    } catch {
      setSubmitError(
        "선택 내용을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );

      setIsSubmitting(false);
    }
  }

  return (
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
                  name="problem-category"
                  value={category.value}
                  checked={isSelected}
                  onChange={() => {
                    setSelectedCategory(category.value);
                    setSubmitError(null);
                  }}
                  // peer: radio의 상태를 뒤쪽 카드 UI 스타일에 연결하기 위해 필요
                  // sr-only: 실제 radio는 화면에서만 숨기고 접근성/키보드 기능은 유지
                  className="peer sr-only"
                />

                <label
                  htmlFor={`problem-category-${category.value}`}
                  className={[
                    "flex min-h-28 cursor-pointer items-center gap-4 rounded-card border bg-surface p-4 shadow-card",
                    "transition",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2",
                    "sm:min-h-32 sm:gap-5 sm:p-5",
                    isSelected
                      ? "border-primary bg-primary-subtle"
                      : "border-border hover:border-border-strong",
                  ].join(" ")}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary sm:h-16 sm:w-16">
                    <CategoryIcon type={category.icon} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-foreground sm:text-xl">
                      {category.title}
                    </span>

                    <span className="mt-1 block leading-6 text-foreground-muted">
                      {category.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold",
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
          })}
        </div>
      </fieldset>

      {submitError ? (
        <p
          role="alert"
          className="mt-4 rounded-control border border-danger p-4 text-danger"
        >
          {submitError}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="submit"
          disabled={!selectedCategory || isSubmitting}
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
  );
}