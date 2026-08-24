import Link from "next/link";

import SolutionReport from "@/components/consultation/SolutionReport";

// Load Error => 기존 Report 재조회 (refetch)
// Report Not Ready => Analysis 상태 확인 또는 기존 Report 재조회 (refetch)
export default function SolutionReportPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 print:hidden">
          <Link
            href="/consultation/analysis"
            aria-label="AI 분석으로 돌아가기"
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

        <SolutionReport />
      </div>
    </main>
  );
}