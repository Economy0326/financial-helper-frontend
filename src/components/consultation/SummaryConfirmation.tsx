"use client";

import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

import {
  confirmSummaryFixture,
  getSummaryFixture,
} from "@/lib/fixtures/consultation";

const summaryQueryKey = [
  "consultation",
  "summary",
] as const;

// Summary 조회
export default function SummaryConfirmation() {
  const router = useRouter();

  const summaryQuery = useQuery({
    queryKey: summaryQueryKey,
    queryFn: getSummaryFixture,
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmSummaryFixture,

    onSuccess: () => {
      router.push("/consultation/analysis");
    },
  });

  function handleEdit() {
    if (confirmMutation.isPending) {
      return;
    }

    router.push("/consultation/situation");
  }

  if (summaryQuery.isLoading) {
    return (
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
    );
  }

  if (summaryQuery.isError) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          상담 내용을 불러오지 못했어요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          잠시 후 다시 시도해 주세요.
        </p>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => summaryQuery.refetch()}
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
            입력 내용으로 돌아가기
          </SecondaryButton>
        </div>
      </div>
    );
  }

  if (
    !summaryQuery.data ||
    summaryQuery.data.kind === "generation-failed"
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          상담 내용을 정리하지 못했어요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          입력하신 내용은 유지되어 있어요.
          <br />
          다시 시도하거나 내용을 수정해 주세요.
        </p>

        <div className="mx-auto mt-8 max-w-sm space-y-3">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() => summaryQuery.refetch()}
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
            내용 수정하기
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const { summary } = summaryQuery.data;

  return (
    <>
      <ConsultationProgress
        currentStep={4}
        totalSteps={6}
        label="내용 확인"
      />

      <header className="mt-10 text-center sm:mt-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          제가 이해한 내용이
          <br className="sm:hidden" /> 맞나요?
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          분석을 시작하기 전에
          <br className="sm:hidden" />
          내용을 한 번 확인해 주세요.
        </p>
      </header>

      <div className="mt-8">
        <SurfaceCard className="p-5 sm:p-7">
          <section aria-labelledby="summary-category-heading">
            <h2
              id="summary-category-heading"
              className="text-sm font-semibold text-foreground-muted"
            >
              문제 유형
            </h2>

            <p className="mt-2 text-lg font-bold text-foreground">
              {summary.category}
            </p>
          </section>

          <div className="my-6 border-t border-border" />

          <section aria-labelledby="summary-situation-heading">
            <h2
              id="summary-situation-heading"
              className="text-sm font-semibold text-foreground-muted"
            >
              현재 상황
            </h2>

            <p className="mt-2 leading-7 text-foreground">
              {summary.situation}
            </p>
          </section>

          <div className="my-6 border-t border-border" />

          <section aria-labelledby="summary-key-points-heading">
            <h2
              id="summary-key-points-heading"
              className="text-sm font-semibold text-foreground-muted"
            >
              제가 이해한 핵심 내용
            </h2>

            <ul className="mt-3 space-y-3">
              {summary.keyPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 leading-7 text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary"
                  >
                    ✓
                  </span>

                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        </SurfaceCard>
      </div>

      {/* 틀린 내용은 원본 입력을 수정 */}
      <aside className="mt-5 rounded-card bg-surface-subtle p-5 text-sm leading-6 text-foreground-muted">
        요약 내용은 직접 수정하지 않아요. 내용이 다르다면
        원래 입력으로 돌아가 수정할 수 있어요.
      </aside>

      {confirmMutation.isError ? (
        <div
          role="alert"
          className="mt-5 rounded-control border border-danger bg-surface p-4"
        >
          <p className="font-semibold text-danger">
            확인 내용을 저장하지 못했어요.
          </p>

          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            요약 내용은 그대로 유지됩니다. 다시 시도해
            주세요.
          </p>
        </div>
      ) : null}

      {/* 맞아요, 수정할래요 모두 Navigation이므로 Mutation 만들 필요 없음 */}
      <div className="mt-8 space-y-3">
        <PrimaryButton
          type="button"
          className="w-full"
          disabled={confirmMutation.isPending}
          onClick={() => confirmMutation.mutate()}
        >
          {confirmMutation.isPending
            ? "확인 중..."
            : "맞아요"}
        </PrimaryButton>

        <SecondaryButton
          type="button"
          className="w-full"
          disabled={confirmMutation.isPending}
          onClick={handleEdit}
        >
          수정할래요
        </SecondaryButton>
      </div>
    </>
  );
}