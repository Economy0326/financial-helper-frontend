import Link from "next/link";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import SituationInputForm from "@/components/consultation/SituationInputForm";

export default function SituationPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/consultation/problem-category"
            aria-label="문제 유형 선택으로 돌아가기"
            className={[
              "inline-flex h-12 w-12 items-center justify-center rounded-control",
              "border border-border bg-surface text-2xl text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <span aria-hidden="true">←</span>
          </Link>
        </div>

        <ConsultationProgress
          currentStep={2}
          totalSteps={6}
          label="상황 입력"
        />

        <header className="mt-10 text-center sm:mt-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            어떤 일이
            <br className="sm:hidden" /> 있으셨나요?
          </h1>

          <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
            자유롭게 상황을 입력해 주세요.
            <br />
            AI가 이해하기 쉬워집니다.
          </p>
        </header>

        <SituationInputForm />
      </div>
    </main>
  );
}