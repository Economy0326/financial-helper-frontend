import Link from "next/link";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";
import type { ReviewableSource } from "@/lib/api/source-review";

export function SourceReviewCard({ source }: { source: ReviewableSource }) {
  const officialUrl = safeOfficialLink(source.officialUrl);
  const detail = source.sourceKey === "fsc-deposit-protection-qa-pdf"
        ? "/official-source-review/deposit"
        : `/official-source-review/information/${encodeURIComponent(source.sourceKey)}`;
  const remaining = Math.max(0, source.candidateItemCount - source.approvedItemCount - source.rejectedItemCount);
  const state = !source.documentId ? "미수집" : source.candidateItemCount === 0 ? "근거 후보 추출 전"
    : source.searchAvailable && remaining > 0 ? "분야 검색 범위 있음 · 이 문서 검토 필요"
      : source.searchAvailable ? "분야 검색 범위 있음 · 항목별 사용 조건 확인 필요" : remaining > 0 ? "검토 필요"
        : source.approvedItemCount > 0 ? "승인 완료 · 활성화 전" : "사용하지 않음";
  return <article className="rounded-card border border-border bg-surface p-4">
    <h3 className="break-words text-lg font-bold">{source.documentId && source.reviewWorkflowAvailable
      ? <Link href={detail} className="hover:underline focus-visible:outline-2 focus-visible:outline-primary">{source.title ?? `${source.organization} 공식자료 · 제목 확인 전`}</Link>
      : source.title ?? `${source.organization} 공식자료 · 제목 확인 전`}</h3>
    <p className="mt-1 text-sm">{source.organization} · 게시일 {source.publishedAt ?? "미확인"}</p>
    <p className="mt-1 text-sm">승인 {source.approvedItemCount}/{source.candidateItemCount}건 · 검토 필요 {remaining}건 · {state}</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {source.documentId && source.reviewWorkflowAvailable && <Link href={detail}
        className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">상세 검토</Link>}
      {officialUrl && <a href={officialUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center rounded-control border border-border px-3 text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">공식 원문 ↗</a>}
    </div>
    <details className="mt-2 text-sm"><summary className="cursor-pointer">기술 상세</summary>
      <p>검토표 기록 {source.reviewItemCount}건 (PENDING 포함, 결정 감사와 별개) · 판본 {source.documentVersion ?? "없음"} · Source ID {source.sourceKey}</p>
      {source.rawSha256 && <p className="break-all">SHA-256: {source.rawSha256}</p>}</details>
  </article>;
}
