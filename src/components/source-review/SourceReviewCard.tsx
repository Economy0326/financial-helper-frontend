import Link from "next/link";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";
import type { ReviewableSource } from "@/lib/api/source-review";

export function SourceReviewCard({ source }: { source: ReviewableSource }) {
  const officialUrl = safeOfficialLink(source.officialUrl);
  return <article className="rounded-card border border-border bg-surface p-5">
    <h3 className="break-words text-lg font-bold">{source.title ?? `${source.organization} 공식자료 · 제목 확인 전`}</h3>
    <p className="mt-2 text-sm">{source.organization} · {source.format} · 게시일 {source.publishedAt ?? "확인 전"}</p>
    <p className="mt-1 text-sm">{source.documentId ? `판본 ${source.documentVersion} · 검토 항목 ${source.reviewItemCount}건 중 승인 ${source.approvedItemCount}건` : "아직 수집되지 않음"}</p>
    <p className="mt-1 text-sm">{source.searchAvailable ? "검토된 검색 범위 사용 가능" : "READY 검증 전 또는 검색 범위 미확인"}</p>
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-sm font-semibold">공식기관 원문</p>
      {officialUrl ? <a href={officialUrl} target="_blank" rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-11 items-center rounded-control border border-border px-4 text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">공식 원문 보기 ↗ (외부 사이트)</a>
        : <p className="mt-2 text-sm">안전한 원문 링크를 확인할 수 없습니다.</p>}
    </div>
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-sm font-semibold">금융도우미 검토 화면</p>
      {source.reviewWorkflowAvailable ? <Link href="/official-source-review/deposit"
        className="mt-2 inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">검토 화면으로 이동 →</Link>
        : <p className="mt-2 text-sm">이 자료의 항목별 검토 UI는 아직 지원하지 않습니다.</p>}
    </div>
    <details className="mt-4 text-sm"><summary className="cursor-pointer">자료 기술 상세</summary>
      <p className="break-all">Source ID: {source.sourceKey}</p>
      {source.rawSha256 && <p className="break-all">저장된 SHA-256: {source.rawSha256}</p>}</details>
  </article>;
}
