"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AppHeader } from "@/components/layout/AppHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { logout } from "@/lib/api/auth";
import { resetClientAuthState } from "@/lib/api/client";
import {
  useAccountConsultationHistoryQuery,
  useAccountEmergencyHistoryQuery,
  useAccountOverviewQuery,
} from "@/lib/query/account";
import { useSessionQuery } from "@/lib/query/session";
import { queryKeys } from "@/lib/query/keys";

const categoryLabels: Record<string, string> = {
  INSURANCE: "보험",
  LOAN: "대출",
  CARD: "카드",
  FINANCIAL_FRAUD: "송금·사기·개인정보",
  UNKNOWN: "금융 문제",
};

const providerLabels: Record<string, string> = {
  KAKAO: "카카오",
  NAVER: "네이버",
};

const emergencyLabels: Record<string, string> = {
  TRANSFER: "송금 피해",
  UNKNOWN_PAYMENT: "모르는 결제",
  SUSPICIOUS_APP: "의심스러운 앱",
  PERSONAL_INFO: "개인정보 노출",
  UNKNOWN: "긴급 금융 피해",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "확인 불가";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "확인 불가"
    : new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
      }).format(date);
}

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const authenticated = session.data?.authenticated === true;
  const overview = useAccountOverviewQuery(authenticated);
  const [historyPage, setHistoryPage] = useState(0);
  const history = useAccountConsultationHistoryQuery(
    historyPage,
    authenticated,
  );
  const emergencyHistory = useAccountEmergencyHistoryQuery(
    0,
    authenticated,
  );
  const [logoutPending, setLogoutPending] = useState(false);

  if (
    session.isLoading ||
    (authenticated && overview.isLoading)
  ) {
    return (
      <main
        className="min-h-screen bg-background px-4 py-16 text-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
          상담 내역을 불러오고 있어요.
      </main>
    );
  }

  if (
    !authenticated ||
    session.isError ||
    overview.isError
  ) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-lg rounded-card border border-border bg-surface p-6 text-center shadow-card sm:p-8">
            <h1 className="break-keep text-2xl font-bold">
              로그인이 필요해요
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] break-keep leading-7 text-foreground-muted">
              로그인하면 상담 기록과
              <br />
              저장된 기록을 확인할 수 있어요.
            </p>
            <Link
              href="/auth/login"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-6 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              로그인하기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const data = overview.data;
  if (!data) return null;

  async function handleLogout() {
    setLogoutPending(true);

    try {
      await logout();
      resetClientAuthState();
      // 브라우저가 공개 Home으로 이동하는 동안 공용 client에 인증된
      // session/account 데이터를 남기지 않는다. 다음 observer가 새로운
      // 비인증 bootstrap을 한 번 수행한다.
      queryClient.removeQueries({
        queryKey: queryKeys.session.all,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.account.all,
      });
      router.replace("/");
    } catch {
      setLogoutPending(false);
    }
  }

  const completedHistory = history.data?.content;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
        <header className="pt-2">
          <p className="text-base font-bold text-primary">상담 관리</p>
          <h1 className="mt-2 break-keep text-[2rem] font-bold leading-[1.28] tracking-[-0.025em]">
            내 금융상담
          </h1>
          <p className="mt-2 break-keep leading-7 text-foreground-muted">
            지난 상담과 긴급 대응 기록을 확인하세요.
          </p>
          <p className="mt-2 text-foreground-muted">
            {providerLabels[data.provider] ?? "소셜"} 계정으로 로그인되어 있어요.
          </p>
        </header>

        <section className="mt-7 rounded-card border border-border p-5">
          <h2 className="text-lg font-bold">지난 상담 기록</h2>
          <p className="mt-2 break-keep leading-7 text-foreground-muted">
            기존 상담 시작 기능은 종료되었으며 아래에서 저장된 기록을 확인할 수 있어요.
            새 질문은 금융정보 질문하기에서 시작해 주세요.
          </p>
          {data.activeConsultation ? (
            <p className="mt-2 text-sm text-foreground-muted">완료하지 않은 이전 상담도 보존되어 있어요. 상세 조회는 아직 지원되지 않아요.</p>
          ) : null}
          <Link href="/financial-information" className="mt-4 inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-semibold text-primary-foreground">
            금융정보 질문하기
          </Link>
        </section>

        <section
          aria-labelledby="completed-consultations-heading"
          className="mt-7 border-b border-border pb-7"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="completed-consultations-heading" className="text-lg font-bold">
              완료된 상담
            </h2>
            <span className="shrink-0 text-sm text-foreground-muted">
              {history.data?.totalElements ?? 0}건
            </span>
          </div>

          {history.isLoading ? (
            <p className="mt-4" role="status" aria-live="polite">
              기록을 불러오고 있어요.
            </p>
          ) : history.isError ? (
            <div role="alert" className="mt-4 rounded-control border border-danger bg-surface-subtle p-4">
              <p className="font-semibold text-danger">
                완료된 상담을 불러오지 못했어요.
              </p>
              <button
                type="button"
                className="mt-3 min-h-11 font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                onClick={() => void history.refetch()}
              >
                다시 시도
              </button>
            </div>
          ) : completedHistory && completedHistory.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {completedHistory.map((item) => {
                return <li key={item.consultationId} className="py-1 first:pt-0 last:pb-0">
                  <div className="flex min-h-18 items-center justify-between gap-4 px-1 py-3">
                    <span className="min-w-0">
                      <strong className="block text-[1.0625rem] font-bold text-foreground">
                        {categoryLabels[item.category ?? "UNKNOWN"] ?? "금융 문제"} 상담
                      </strong>
                      <span className="mt-1 block text-[0.9375rem] text-foreground-muted">
                        {formatDate(item.reportGeneratedAt ?? item.informationReportGeneratedAt ?? item.updatedAt)}
                      </span>
                    </span>
                  </div>
                  <p className="pb-3 text-sm text-foreground-muted">
                    이전 상담의 상세 내용은 현재 확인할 수 없어요.
                  </p>
                </li>;
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-control bg-surface-subtle p-4 leading-7 text-foreground-muted">
              완료된 상담이 아직 없어요.
            </p>
          )}

          {history.data && history.data.totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <SecondaryButton
                type="button"
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((page) => Math.max(0, page - 1))}
              >
                이전
              </SecondaryButton>
              <span className="text-sm text-foreground-muted">
                {historyPage + 1} / {history.data.totalPages}
              </span>
              <SecondaryButton
                type="button"
                disabled={history.data.last}
                onClick={() => setHistoryPage((page) => page + 1)}
              >
                다음
              </SecondaryButton>
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="emergency-history-heading"
          className="mt-7 border-b border-border pb-7"
        >
          <h2 id="emergency-history-heading" className="text-lg font-bold">
            긴급 대응 기록
          </h2>
          {emergencyHistory.isLoading ? (
            <p className="mt-3 text-foreground-muted" role="status" aria-live="polite">
              기록을 불러오고 있어요.
            </p>
          ) : emergencyHistory.isError ? (
            <div role="alert" className="mt-3 rounded-control border border-danger bg-surface-subtle p-4">
              <p className="font-semibold text-danger">
                긴급 대응 기록을 불러오지 못했어요.
              </p>
              <button
                type="button"
                className="mt-3 min-h-11 font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                onClick={() => void emergencyHistory.refetch()}
              >
                다시 시도
              </button>
            </div>
          ) : emergencyHistory.data?.content.length ? (
            <ul className="mt-3 divide-y divide-border">
              {emergencyHistory.data.content.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="break-keep">
                    {emergencyLabels[item.emergencyType] ?? "긴급 금융 피해"}
                  </span>
                  <span className="shrink-0 text-foreground-muted">
                    {formatDate(item.viewedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-control bg-surface-subtle p-4 leading-7 text-foreground-muted">
              저장된 긴급 대응 기록이 아직 없어요.
            </p>
          )}
        </section>

        <PrimaryButton
          type="button"
          className="mt-6 w-full"
          disabled={logoutPending}
          onClick={handleLogout}
        >
          {logoutPending ? "로그아웃 중..." : "로그아웃"}
        </PrimaryButton>
      </main>
    </div>
  );
}
