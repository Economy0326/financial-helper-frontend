import Link from "next/link";

import EmergencyNextHelp from "@/components/emergency/EmergencyNextHelp";

export default function EmergencyNextHelpPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <Link
            href="/emergency/contact-evidence"
            aria-label="연락 및 증거 보존 단계로 돌아가기"
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

        <EmergencyNextHelp />
      </div>
    </main>
  );
}