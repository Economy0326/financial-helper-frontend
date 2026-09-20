import { Suspense } from "react";

import SummaryConfirmation from "@/components/consultation/SummaryConfirmation";

export default function SummaryPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <Suspense fallback={<div className="min-h-72" aria-label="상담 내용을 불러오는 중" />}>
          <SummaryConfirmation />
        </Suspense>
      </div>
    </main>
  );
}
