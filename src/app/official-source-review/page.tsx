"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { sourceReviewApi, type ReviewableSource } from "@/lib/api/source-review";
import { SourceReviewCard } from "@/components/source-review/SourceReviewCard";

const enabled = process.env.NEXT_PUBLIC_OFFICIAL_REVIEW_ENABLED === "true";

export default function OfficialSourceReviewPage() {
  const [sources, setSources] = useState<ReviewableSource[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    sourceReviewApi.sources().then((rows) => { if (active) setSources(rows); })
      .catch(() => { if (active) setError("공식자료 목록을 확인할 수 없습니다. 로그인 및 Reviewer 권한을 확인해 주세요."); });
    return () => { active = false; };
  }, []);
  if (!enabled) return <main className="p-8">공식자료 검토 화면은 허용된 시연 환경에서만 사용할 수 있습니다.</main>;
  const awaiting = sources.filter((source) => source.reviewWorkflowAvailable && source.documentId && source.reviewItemCount === 0);
  const inProgress = sources.filter((source) => source.pendingItemCount > 0);
  const decided = sources.filter((source) => source.reviewItemCount > 0 && source.pendingItemCount === 0);
  const unavailable = sources.filter((source) => !source.documentId || !source.reviewWorkflowAvailable);
  return <div className="min-h-screen bg-background"><AppHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header><h1 className="text-3xl font-bold">공식자료 검토</h1>
        <p className="mt-3 text-foreground-muted">공식자료의 내용과 적용 범위를 확인하고 승인 여부를 결정합니다.</p></header>
      <section className="rounded-card border border-border bg-surface p-5" aria-label="검토 현황">
        <h2 className="text-xl font-bold">검토 현황</h2>
        <p className="mt-2 text-sm">원문 확인 → 근거 항목 확인 → 적용 범위 설정 → 검토 시작 → 항목별 승인·거절</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p>결정 대기 문서 <strong>{awaiting.length}건</strong></p>
          <p>검토 진행 중 <strong>{inProgress.length}건</strong></p>
          <p>결정 완료 문서 <strong>{decided.length}건</strong></p>
          <p>미수집·검토 미지원 <strong>{unavailable.length}건</strong></p>
        </div>
        <p className="mt-3 text-sm">결정 완료와 READY는 별개입니다. 원문 변경 감지는 아직 지원하지 않아 재검토 필요 문서 수를 확정하지 않습니다.</p>
      </section>
      {error && <p role="alert" className="rounded-control border border-border bg-surface p-4">{error}</p>}
      <section aria-label="등록된 공식자료" className="space-y-4">
        <h2 className="text-xl font-bold">등록된 공식자료</h2>
        {sources.length === 0 && !error && <p>등록된 자료를 확인하는 중이거나 자료가 없습니다.</p>}
        {sources.map((source) => <SourceReviewCard key={source.sourceKey} source={source} />)}
      </section>
      <p className="text-sm text-foreground-muted">자료 등록은 승인이나 READY 활성화가 아닙니다. 현재 항목별 결정 API는 예금자보호 PDF에 한정됩니다.</p>
    </main></div>;
}
