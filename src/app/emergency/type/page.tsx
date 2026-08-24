import Link from "next/link";

import EmergencyProgress from "@/components/emergency/EmergencyProgress";
import EmergencyTypeForm from "@/components/emergency/EmergencyTypeForm";

export default function EmergencyTypePage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            aria-label="홈으로 돌아가기"
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

        <EmergencyProgress
          currentStep={1}
          label="피해 유형 선택"
        />

        <header className="mt-10 text-center sm:mt-12">
          <div
            aria-hidden="true"
            className="text-4xl"
          >
            🚨
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            지금 어떤 일이 있었나요?
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
            가장 가까운 상황을 선택해 주세요.
            <br />
            잘 모르겠다면 마지막 항목을 선택하셔도
            됩니다.
          </p>
        </header>

        <EmergencyTypeForm />
      </div>
    </main>
  );
}