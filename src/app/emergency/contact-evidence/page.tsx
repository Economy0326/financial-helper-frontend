import Link from "next/link";

import EmergencyContactEvidence from "@/components/emergency/EmergencyContactEvidence";

export default function EmergencyContactEvidencePage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href="/emergency/action"
            aria-label="즉시 대응 단계로 돌아가기"
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

        <EmergencyContactEvidence />
      </div>
    </main>
  );
}