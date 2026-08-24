"use client";

import { useState } from "react";
import Link from "next/link";

import EmergencyProgress from "@/components/emergency/EmergencyProgress";

const nextHelpActions = [
  {
    href: "/consultation/problem-category",
    title: "금융 문제 상담 계속하기",
    description:
      "긴급 대응을 확인했다면 금융 문제를 더 자세히 상담할 수 있어요.",
    icon: "💬",
  },
  {
    href: "/emergency/contact-evidence",
    title: "긴급 대응 다시 보기",
    description:
      "연락할 곳과 보존해야 할 증거를 다시 확인할 수 있어요.",
    icon: "🛡",
  },
  {
    href: "/",
    title: "홈으로 돌아가기",
    description:
      "지금은 여기까지 확인하고 홈으로 돌아갈 수 있어요.",
    icon: "⌂",
  },
] as const;

// 모든 Action은 Navigation Action으로 클릭 즉시 이동
export default function EmergencyNextHelp() {
  const [pendingHref, setPendingHref] =
    useState<string | null>(null);

  const isNavigationPending =
    pendingHref !== null;

  return (
    <>
      <EmergencyProgress
        currentStep={4}
        label="다음 도움"
      />

      <header className="mt-10 text-center sm:mt-12">
        <div
          aria-hidden="true"
          className={[
            "mx-auto flex h-20 w-20 items-center justify-center",
            "rounded-full bg-primary-subtle",
            "text-4xl font-bold text-primary",
          ].join(" ")}
        >
          ✓
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          긴급 대응을 확인했어요
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          지금 필요한 다음 도움을
          <br className="sm:hidden" />
          선택해 주세요.
        </p>
      </header>

      <nav
        aria-label="긴급 대응 이후 이동"
        aria-busy={isNavigationPending}
        className="mt-8"
      >
        <ul className="space-y-4">
          {nextHelpActions.map((action) => {
            const isCurrentPending =
              pendingHref === action.href;

            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  aria-disabled={
                    isNavigationPending
                      ? "true"
                      : undefined
                  }
                  onClick={(event) => {
                    if (isNavigationPending) {
                      event.preventDefault();
                      return;
                    }

                    setPendingHref(action.href);
                  }}
                  className={[
                    "flex min-h-28 items-center gap-4 rounded-card",
                    "border bg-surface p-5 shadow-card",
                    "transition hover:border-primary",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-focus focus-visible:ring-offset-2",
                    "motion-reduce:transition-none",
                    isCurrentPending
                      ? "border-primary bg-primary-subtle"
                      : "border-border",
                    isNavigationPending &&
                    !isCurrentPending
                      ? "pointer-events-none opacity-60"
                      : "",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "flex h-14 w-14 shrink-0 items-center justify-center",
                      "rounded-full bg-primary-subtle",
                      "text-2xl text-primary",
                    ].join(" ")}
                  >
                    {action.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-foreground sm:text-xl">
                      {action.title}
                    </span>

                    <span className="mt-1 block leading-6 text-foreground-muted">
                      {action.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="shrink-0 font-bold text-primary"
                  >
                    {isCurrentPending
                      ? "…"
                      : "→"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p
        aria-live="polite"
        className="sr-only"
      >
        {pendingHref
          ? "선택한 화면으로 이동하고 있습니다."
          : ""}
      </p>

      <aside className="mt-6 rounded-card border border-border bg-surface-subtle p-5 sm:p-6">
        <p className="font-bold text-foreground">
          필요하면 언제든 다시 확인할 수 있어요
        </p>

        <p className="mt-2 leading-7 text-foreground-muted">
          긴급 대응을 다시 확인하거나 일반 금융
          상담으로 이어서 진행할 수 있어요.
        </p>
      </aside>
    </>
  );
}