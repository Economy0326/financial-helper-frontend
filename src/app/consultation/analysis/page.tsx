import Link from "next/link";

import AnalysisFlow from "@/components/consultation/AnalysisFlow";

// Analysis Failed => 분석 재실행 (retry)
// Network Error => 기존 작업 상태 재조회 (refetch)
export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/consultation/summary"
            aria-label="내용 확인으로 돌아가기"
            className={[
              "inline-flex h-12 w-12 items-center justify-center",
              "rounded-control border border-border bg-surface",
              "text-2xl text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <span aria-hidden="true">←</span>
          </Link>
        </div>

        <AnalysisFlow />
      </div>
    </main>
  );
}