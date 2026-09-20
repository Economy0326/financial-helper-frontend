import Link from "next/link";
import { Suspense } from "react";

import SolutionReport from "@/components/consultation/SolutionReport";

// Load Error => 기존 Report 재조회 (refetch)
// Report Not Ready => Analysis 상태 확인 또는 기존 Report 재조회 (refetch)
export default function SolutionReportPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <nav aria-label="결과 화면 이동" className="sticky top-0 z-10 -mx-4 mb-6 grid min-h-16 grid-cols-[48px_minmax(0,1fr)_48px] items-center border-b border-border bg-background px-4 print:hidden sm:mx-0 sm:px-3">
          <Link
            href="/account"
            aria-label="상담 내역으로"
            className={[
              "inline-flex h-12 w-12 items-center justify-center rounded-control",
              "text-xl font-bold text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <span aria-hidden="true">←</span>
          </Link>
          <p className="text-center text-lg font-bold text-foreground">결과</p>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-control px-1 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            홈
          </Link>
        </nav>

        <Suspense fallback={<div className="py-20 text-center">리포트를 불러오고 있어요.</div>}>
          <SolutionReport />
        </Suspense>
      </div>
    </main>
  );
}
