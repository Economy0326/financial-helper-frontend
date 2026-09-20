"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  useActiveConsultationQuery,
  useStartConsultationMutation,
} from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import { getConsultationStepHref } from "@/lib/consultation/navigation";
import { ApiResponseError } from "@/lib/api/errors";

function entryErrorMessage(error: unknown) {
  if (error instanceof ApiResponseError) {
    if (error.code === "ACCOUNT_NEW_CONSULTATION_QUOTA_EXHAUSTED") {
      return "최근 7일 새 상담 한도를 모두 사용했어요. 진행 중인 상담과 지난 결과는 상담 내역에서 계속 확인할 수 있어요.";
    }
    if (error.code === "CONSULTATION_NOT_FOUND") {
      return "저장된 상담 상태가 바뀌었어요. 상담 내역을 새로 확인해 주세요.";
    }
  }
  return "잠시 후 다시 확인해 주세요.";
}

export default function ConsultationEntry() {
  const router = useRouter();
  const automaticStartAttempted = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isRouting, setIsRouting] = useState(false);
  const sessionQuery = useSessionQuery();
  const authenticated = sessionQuery.data?.authenticated === true;
  const activeConsultationQuery = useActiveConsultationQuery(
    authenticated,
  );
  const startMutation = useStartConsultationMutation();
  const activeConsultation = activeConsultationQuery.data ?? null;

  useEffect(() => {
    if (sessionQuery.isSuccess && !authenticated) {
      router.replace("/auth/login");
    }
  }, [authenticated, router, sessionQuery.isSuccess]);

  useEffect(() => {
    if (
      !authenticated ||
      !activeConsultationQuery.isSuccess ||
      activeConsultationQuery.isFetching ||
      activeConsultationQuery.data !== null ||
      automaticStartAttempted.current
    ) {
      return;
    }

      automaticStartAttempted.current = true;
    startMutation.mutate(false, {
      onSuccess: (consultation) => {
        setIsRouting(true);
        router.replace(getConsultationStepHref(consultation.currentStep));
      },
    });
  }, [
    authenticated,
    router,
    activeConsultationQuery.data,
    activeConsultationQuery.isFetching,
    activeConsultationQuery.isSuccess,
    startMutation,
  ]);

  useEffect(() => {
    if (!activeConsultation) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/");
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [activeConsultation, router]);

  if (
    sessionQuery.isLoading ||
    (authenticated &&
      !activeConsultationQuery.isSuccess &&
      !activeConsultationQuery.isError) ||
    (authenticated && activeConsultationQuery.isFetching) ||
    startMutation.isPending ||
    isRouting ||
    (sessionQuery.isSuccess && !authenticated)
  ) {
    return (
      <div className="py-20 text-center" role="status" aria-live="polite">
        <p className="text-lg font-semibold text-foreground">
          상담 상태를 확인하고 있어요.
        </p>
      </div>
    );
  }

  if (
    sessionQuery.isError ||
    (activeConsultationQuery.isError) ||
    startMutation.isError
  ) {
    const error = startMutation.error ?? activeConsultationQuery.error ?? sessionQuery.error;
    const quotaExhausted = error instanceof ApiResponseError &&
      error.code === "ACCOUNT_NEW_CONSULTATION_QUOTA_EXHAUSTED";
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {quotaExhausted
            ? "최근 7일 새 상담 한도를 모두 사용했어요."
            : "상담 상태를 확인하지 못했어요."}
        </h1>
        <p className="mt-3 leading-7 text-foreground-muted">
          {entryErrorMessage(error)}
        </p>
        <Link
          href={quotaExhausted ? "/account" : "/"}
          className="mx-auto mt-8 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {quotaExhausted ? "상담 내역 보기" : "홈으로"}
        </Link>
      </div>
    );
  }

  if (!activeConsultation) {
    return (
      <div className="py-20 text-center" role="status" aria-live="polite">
        <p className="text-lg font-semibold text-foreground">
          새 상담을 준비하고 있어요.
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          router.push("/");
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-heading"
        aria-describedby="entry-description"
        className="entry-dialog-in relative w-full rounded-t-[1.5rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 shadow-[0_-12px_36px_rgb(23_37_43_/_0.16)] sm:max-w-md sm:rounded-card sm:p-7"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => router.push("/")}
          className="absolute right-3 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-xl text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none"
          aria-label="상담 선택 창 닫기"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="pr-10">
          <h1
            id="entry-heading"
            className="break-keep text-[1.625rem] font-bold leading-[1.3] tracking-[-0.025em] text-foreground"
          >
            진행 중인 상담이 있어요
          </h1>
          <p
            id="entry-description"
            className="mt-2.5 break-keep text-base font-medium leading-7 text-foreground-muted"
          >
            이어서 진행하거나 새 상담을 시작할 수 있어요.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href={getConsultationStepHref(activeConsultation.currentStep)}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-control bg-primary px-5 py-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            이어서 하기
          </Link>
          <SecondaryButton
            type="button"
            className="min-h-14 w-full border-border-strong text-base font-bold text-foreground"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate(true, {
              onSuccess: (consultation) => {
                setIsRouting(true);
                router.replace(getConsultationStepHref(consultation.currentStep));
              },
            })}
          >
            {startMutation.isPending ? "새 상담 준비 중..." : "새 상담 시작하기"}
          </SecondaryButton>
        </div>

        <p className="mt-3.5 break-keep text-[0.9375rem] leading-6 text-foreground-muted">
          새 상담을 시작하면 진행 중인 상담은 종료돼요.
        </p>
      </div>
    </div>
  );
}
