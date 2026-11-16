"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { sourceReviewApi, type ReviewableSource } from "@/lib/api/source-review";
import { SourceReviewCard } from "@/components/source-review/SourceReviewCard";
import Link from "next/link";

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
  const collected = sources.filter((source) => source.documentId && source.reviewWorkflowAvailable);
  const awaiting = collected.filter((source) => source.candidateItemCount > source.approvedItemCount + source.rejectedItemCount);
  const decided = collected.filter((source) => source.candidateItemCount > 0 && source.candidateItemCount <= source.approvedItemCount + source.rejectedItemCount);
  const ready = collected.filter((source) => source.searchAvailable);
  const approvedBeforeReady = collected.filter((source) => source.approvedItemCount > 0 && !source.searchAvailable);
  const unavailable = sources.filter((source) => !source.documentId || !source.reviewWorkflowAvailable);
  return <div className="min-h-screen bg-background"><AppHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header><h1 className="text-3xl font-bold">공식자료 검토</h1>
        <p className="mt-3 text-foreground-muted">공식자료의 내용과 적용 범위를 확인하고 승인 여부를 결정합니다.</p>
        <Link href="/official-source-review/documents" className="mt-3 inline-block font-bold text-primary underline">공통 문서·Claim 검토</Link></header>
      <section className="rounded-card border border-border bg-surface p-5" aria-label="검토 현황">
        <h2 className="text-xl font-bold">검토 현황</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p>검토 필요 <strong>{awaiting.length}건</strong></p>
          <p>결정 완료 문서 <strong>{decided.length}건</strong></p>
          <p>승인 후 활성화 전 <strong>{approvedBeforeReady.length}건</strong></p>
          <p>검색 가능 범위가 있는 분야의 문서 <strong>{ready.length}건</strong></p>
          <p>미수집·검토 미지원 <strong>{unavailable.length}건</strong></p>
        </div>
        <p className="mt-3 text-sm">검색 가능 표시는 분야 단위입니다. 개별 근거의 사용 여부는 질문 시 Backend가 다시 확인합니다. 원문 변경 감지는 아직 지원하지 않습니다.</p>
      </section>
      {error && <p role="alert" className="rounded-control border border-border bg-surface p-4">{error}</p>}
      <section aria-label="검토 가능한 공식자료" className="space-y-3">
        <h2 className="text-xl font-bold">수집된 공식자료</h2>
        {sources.length === 0 && !error && <p>등록된 자료를 확인하는 중이거나 자료가 없습니다.</p>}
        {collected.map((source) => <SourceReviewCard key={source.sourceKey} source={source} />)}
      </section>
      {unavailable.length > 0 && <section aria-label="미수집 또는 검토 미지원" className="space-y-2">
        <h2 className="text-xl font-bold">미수집·검토 미지원</h2>
        {unavailable.map((source) => <SourceReviewCard key={source.sourceKey} source={source} />)}
      </section>}
      <p className="text-sm text-foreground-muted">자료 등록은 승인이나 READY 활성화가 아닙니다. 검토 화면이 표시된 자료만 항목별 결정을 지원합니다.</p>
    </main></div>;
}
