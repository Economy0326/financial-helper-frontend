import Link from "next/link";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import ProblemCategoryForm from "@/components/consultation/ProblemCategoryForm";

export default function ProblemCategoryPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            aria-label="홈으로 돌아가기"
            className={[
              "inline-flex h-12 w-12 items-center justify-center rounded-control border border-border",
              "bg-surface text-2xl text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <span aria-hidden="true">←</span>
          </Link>
        </div>

        <ConsultationProgress
          currentStep={1}
          totalSteps={6}
          label="문제 선택"
        />

        <header className="mt-10 text-center sm:mt-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            무엇을 도와드릴까요?
          </h1>

          <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
            상황에 맞는 메뉴를 선택해 주세요.
          </p>
        </header>

        <ProblemCategoryForm />

        <p className="mt-8 text-center text-sm text-foreground-muted">
          <span aria-hidden="true">🔒 </span>
          모든 상담 내용은 안전하게 보호됩니다.
        </p>
      </div>
    </main>
  );
}