import Link from "next/link";

import EmergencyImmediateAction from "@/components/emergency/EmergencyImmediateAction";

export default function EmergencyActionPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <Link
            href="/emergency/type"
            aria-label="피해 유형 선택으로 돌아가기"
            className={[
              "inline-flex h-12 w-12 items-center justify-center",
              "rounded-control border border-border bg-surface",
              "text-2xl text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-focus focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <span aria-hidden="true">
              ←
            </span>
          </Link>
        </div>

        <EmergencyImmediateAction />
      </div>
    </main>
  );
}