"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { logout } from "@/lib/api/auth";
import { useAccountConsultationHistoryQuery, useAccountEmergencyHistoryQuery, useAccountOverviewQuery } from "@/lib/query/account";
import { useSessionQuery } from "@/lib/query/session";

const categoryLabels: Record<string, string> = { INSURANCE: "보험", LOAN: "대출", CARD: "카드", UNKNOWN: "금융 문제" };
const emergencyLabels: Record<string, string> = { TRANSFER: "송금 피해", UNKNOWN_PAYMENT: "모르는 결제", SUSPICIOUS_APP: "의심스러운 앱", PERSONAL_INFO: "개인정보 노출", UNKNOWN: "긴급 금융 피해" };
function formatDate(value: string | null | undefined) {
  if (!value) return "확인 불가";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "확인 불가" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

export default function AccountPage() {
  const router = useRouter();
  const session = useSessionQuery();
  const authenticated = session.data?.authenticated === true;
  const overview = useAccountOverviewQuery(authenticated);
  const [historyPage, setHistoryPage] = useState(0);
  const history = useAccountConsultationHistoryQuery(historyPage, authenticated);
  const emergencyHistory = useAccountEmergencyHistoryQuery(0, authenticated);
  const [logoutPending, setLogoutPending] = useState(false);

  if (session.isLoading || (authenticated && overview.isLoading)) return <main className="min-h-screen bg-background p-8 text-center">내 상담을 불러오고 있어요.</main>;
  if (!authenticated || session.isError || overview.isError) return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto max-w-lg rounded-card border border-border bg-surface p-6 text-center shadow-card"><h1 className="text-2xl font-bold">로그인이 필요해요</h1><p className="mt-3 text-foreground-muted">상담 기록과 이용 한도는 로그인 후 확인할 수 있어요.</p><Link href="/auth/login" className="mt-7 inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-primary-foreground">로그인하기</Link></div></main>;
  const data = overview.data;
  if (!data) return null;
  async function handleLogout() { setLogoutPending(true); try { await logout(); router.replace("/"); } catch { setLogoutPending(false); } }

  return <div className="min-h-screen bg-background"><AppHeader /><main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6"><header><p className="text-sm font-semibold text-primary">내 상담</p><h1 className="mt-2 text-3xl font-bold">안녕하세요{data.displayName ? `, ${data.displayName}` : ""}</h1><p className="mt-2 text-foreground-muted">{data.provider} 계정으로 로그인되어 있어요.</p></header>
    <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card"><h2 className="text-lg font-bold">이용 한도</h2><p className="mt-2 text-2xl font-bold text-primary">최근 7일 상담 {data.quota.used} / {data.quota.limit}</p><p className="mt-1 text-sm text-foreground-muted">다음 상담 가능 시점: {formatDate(data.quota.nextAvailableAt)}</p></section>
    {data.activeConsultation ? <section className="mt-5 rounded-card border border-primary bg-primary-subtle p-5"><h2 className="text-lg font-bold">진행 중인 상담</h2><p className="mt-2">{categoryLabels[data.activeConsultation.category ?? "UNKNOWN"]} 상담 · {data.activeConsultation.currentStep}</p><Link href="/consultation/problem-category" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-primary-foreground">이어서 하기</Link><Link href="/consultation/problem-category?new=true" className="ml-2 inline-flex min-h-11 items-center rounded-control border border-primary px-5 font-semibold text-primary">새 상담 시작</Link></section> : <section className="mt-5 rounded-card border border-border bg-surface p-5 shadow-card"><h2 className="text-lg font-bold">새 상담</h2><p className="mt-2 text-foreground-muted">새로운 금융 상담을 시작해 보세요.</p><Link href="/consultation/problem-category" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-primary-foreground">새 상담 시작</Link></section>}
    <section className="mt-5 rounded-card border border-border bg-surface p-5 shadow-card"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">완료된 상담</h2><span className="text-sm text-foreground-muted">{history.data?.totalElements ?? 0}건</span></div>{history.isLoading ? <p className="mt-4 text-foreground-muted">기록을 불러오고 있어요.</p> : null}<ul className="mt-4 divide-y divide-border">{history.data?.content.map((item) => <li key={item.consultationId} className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="font-semibold">{categoryLabels[item.category ?? "UNKNOWN"]} 상담</p><p className="mt-1 text-sm text-foreground-muted">{formatDate(item.reportGeneratedAt ?? item.updatedAt)}</p></div>{item.reportId ? <Link href={`/consultation/report?consultationId=${encodeURIComponent(item.consultationId)}`} className="shrink-0 text-sm font-semibold text-primary underline">결과 보기</Link> : null}</li>)}</ul>{history.data && history.data.totalPages > 1 ? <div className="mt-5 flex items-center justify-between"><SecondaryButton type="button" disabled={historyPage === 0} onClick={() => setHistoryPage((page) => Math.max(0, page - 1))}>이전</SecondaryButton><span className="text-sm text-foreground-muted">{historyPage + 1} / {history.data.totalPages}</span><SecondaryButton type="button" disabled={history.data.last} onClick={() => setHistoryPage((page) => page + 1)}>다음</SecondaryButton></div> : null}</section>
    <section className="mt-5 rounded-card border border-border bg-surface p-5 shadow-card"><h2 className="text-lg font-bold">긴급 대응 기록</h2><ul className="mt-3 divide-y divide-border">{emergencyHistory.data?.content.map((item) => <li key={item.id} className="flex justify-between py-3 text-sm"><span>{emergencyLabels[item.emergencyType] ?? "긴급 금융 피해"}</span><span className="text-foreground-muted">{formatDate(item.viewedAt)}</span></li>)}</ul></section>
    <PrimaryButton type="button" className="mt-6 w-full" disabled={logoutPending} onClick={handleLogout}>{logoutPending ? "로그아웃 중..." : "로그아웃"}</PrimaryButton></main></div>;
}
