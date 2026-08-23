"use client";

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
  getAnalysisStatusFixture,
  retryAnalysisFixture,
} from "@/lib/fixtures/consultation";

const analysisQueryKey = [
  "consultation",
  "analysis",
] as const;

const analysisSteps = [
  {
    title: "상황 정리",
    description:
      "입력하신 내용을 정리하고 핵심 내용을 파악해요.",
  },
  {
    title: "관련 규정 확인",
    description:
      "해당 문제와 관련된 공식 자료와 기준을 확인해요.",
  },
  {
    title: "유사 사례 비교",
    description:
      "비슷한 상황의 사례와 해결 과정을 비교해요.",
  },
  {
    title: "해결 방법 정리",
    description:
      "확인한 내용을 바탕으로 필요한 행동을 정리해요.",
  },
] as const;

function AnalysisProcess() {
  return (
    <section
      aria-labelledby="analysis-process-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-7"
    >
      <h2
        id="analysis-process-heading"
        className="text-lg font-bold text-foreground"
      >
        분석 과정
      </h2>

      <ol className="mt-6 space-y-6">
        {analysisSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4"
          >
            <span
              aria-hidden="true"
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center",
                "rounded-full bg-primary-subtle font-bold text-primary",
              ].join(" ")}
            >
              {index + 1}
            </span>

            <div>
              <h3 className="font-bold text-foreground sm:text-lg">
                {index + 1}. {step.title}
              </h3>

              <p className="mt-1 leading-7 text-foreground-muted">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AnalysisHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mt-10 text-center sm:mt-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h1>

      <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
        {description}
      </p>
    </header>
  );
}

export default function AnalysisFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const analysisQuery = useQuery({
    queryKey: analysisQueryKey,
    queryFn: getAnalysisStatusFixture,
    retry: false,

    // 분석 중에는 1.5초마다 Server State를 자동으로 polling하고,
    // 분석완료시 polling을 중단
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (
        status === "STARTING" ||
        status === "ANALYZING"
      ) {
        return 1500;
      }

      return false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryAnalysisFixture,

    onSuccess: (nextState) => {
      queryClient.setQueryData(
        analysisQueryKey,
        nextState,
      );
    },
  });

  const isRetrying = retryMutation.isPending;

  if (analysisQuery.isLoading) {
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

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

   // Network Error
  // 네트워크 오류에서는 분석을 새로 시작하지 않고,
  // 이미 실행 중인 분석의 현재 상태만 서버에 다시 조회한다.  
  if (analysisQuery.isError) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-14 text-center sm:py-20">
          <div
            aria-hidden="true"
            className={[
              "mx-auto flex h-28 w-28 items-center justify-center",
              "rounded-full bg-primary-subtle text-5xl",
            ].join(" ")}
          >
            ◌
          </div>

          <AnalysisHeader
            title="인터넷 연결을 확인해 주세요"
            description="연결이 불안정해 분석 상태를 확인하지 못했어요."
          />

          <aside className="mt-8 rounded-card border border-primary bg-primary-subtle p-5 text-left sm:p-6">
            <p className="font-bold text-primary">
              안심하세요
            </p>

            <p className="mt-2 leading-7 text-foreground">
              입력하신 내용은 사라지지 않았어요.
            </p>
          </aside>

          <div className="mt-8 space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => analysisQuery.refetch()}
            >
              다시 시도하기
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push("/consultation/summary")
              }
            >
              이전으로
            </SecondaryButton>
          </div>

          <p className="mt-6 rounded-card border border-border bg-surface p-5 leading-7 text-foreground-muted">
            인터넷 연결을 확인한 뒤 다시 시도해 주세요.
          </p>
        </div>
      </>
    );
  }

  const analysisState = analysisQuery.data;

  if (!analysisState) {
    return null;
  }

   // 직접 URL로 진입했거나 Start Mutation이 아직 수행되지 않은 경우.
   // Page Mount에서 Start하지 않고 Summary로 돌려보낸다.
  if (analysisState.status === "NOT_STARTED") {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-16 text-center">
          <AnalysisHeader
            title="분석을 시작할 준비가 필요해요"
            description="상담 내용을 먼저 확인한 뒤 분석을 시작해 주세요."
          />

          <div className="mx-auto mt-8 max-w-sm">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.replace(
                  "/consultation/summary",
                )
              }
            >
              내용 확인하기
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  if (
    analysisState.status === "STARTING" ||
    analysisState.status === "ANALYZING"
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <AnalysisHeader
          title="AI가 분석하고 있어요"
          description="공식 자료와 관련 정보를 바탕으로 꼼꼼하게 확인하고 있습니다."
        />

        <aside
          className={[
            "mt-8 rounded-card border border-primary",
            "bg-primary-subtle p-5 sm:p-6",
          ].join(" ")}
          aria-live="polite"
        >
          <p className="text-lg font-bold text-primary">
            안심하고 기다려주세요
          </p>

          <p className="mt-2 leading-7 text-foreground">
            분석이 완료되면 결과를 확인할 수 있어요.
          </p>
        </aside>

        <div className="mt-5">
          <AnalysisProcess />
        </div>

        <aside className="mt-5 rounded-card border border-primary bg-primary-subtle p-5 sm:p-6">
          <p className="font-bold text-primary">
            잠시만 기다려주세요
          </p>

          <p className="mt-2 leading-7 text-foreground">
            현재 분석이 진행 중이에요. 정확한 완료 시간을
            알 수 없어 임의의 진행률은 표시하지 않습니다.
          </p>
        </aside>
      </>
    );
  }

  if (analysisState.status === "FAILED") {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-12 text-center">
          <div
            aria-hidden="true"
            className={[
              "mx-auto flex h-28 w-28 items-center justify-center",
              "rounded-full bg-surface-subtle text-5xl text-danger",
            ].join(" ")}
          >
            !
          </div>

          <AnalysisHeader
            title="분석을 완료하지 못했어요"
            description="입력하신 내용은 그대로 보관되어 있어요. 잠시 후 다시 분석해 주세요."
          />

          <aside className="mt-8 rounded-card border border-danger bg-surface p-5 text-left sm:p-6">
            <p className="font-bold text-danger">
              안심하세요
            </p>

            <p className="mt-2 leading-7 text-foreground">
              처음부터 다시 입력하지 않아도 돼요.
            </p>
          </aside>

          {retryMutation.isError ? (
            <div
              role="alert"
              className="mt-5 rounded-control border border-danger bg-surface p-4 text-left"
            >
              <p className="font-semibold text-danger">
                다시 분석 요청을 완료하지 못했어요.
              </p>

              <p className="mt-1 text-sm text-foreground-muted">
                잠시 후 다시 시도해 주세요.
              </p>
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              disabled={isRetrying}
              onClick={() =>
                retryMutation.mutate()
              }
            >
              {isRetrying
                ? "다시 분석하고 있어요..."
                : "다시 분석하기"}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              disabled={isRetrying}
              onClick={() =>
                router.push("/consultation/summary")
              }
            >
              내용 확인하기
            </SecondaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              disabled={isRetrying}
              onClick={() => router.push("/")}
            >
              나중에 이어하기
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  if (analysisState.status === "NEEDS_MORE_INFO") {
    return (
      <>
        <ConsultationProgress
          currentStep={5}
          totalSteps={6}
          label="AI 분석"
        />

        <div className="py-16 text-center">
          <AnalysisHeader
            title="추가 정보가 필요해요"
            description={
              analysisState.message ??
              "분석을 계속하기 위해 몇 가지 내용을 더 확인해야 해요."
            }
          />

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  analysisState.nextPath ??
                    "/consultation/follow-up",
                )
              }
            >
              추가 질문 확인하기
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push("/consultation/summary")
              }
            >
              이전으로
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  // 분석 완료
  return (
    <>
      <ConsultationProgress
        currentStep={5}
        totalSteps={6}
        label="AI 분석"
      />

      <div className="py-12 text-center">
        <div
          aria-hidden="true"
          className={[
            "mx-auto flex h-24 w-24 items-center justify-center",
            "rounded-full bg-primary-subtle text-4xl font-bold text-primary",
          ].join(" ")}
        >
          ✓
        </div>

        <AnalysisHeader
          title="분석이 완료되었어요"
          description="확인한 내용을 바탕으로 해결 방법을 정리했어요."
        />

        <div className="mt-8">
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={() =>
              router.push(
                "/consultation/report",
              )
            }
          >
            결과 보기
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}