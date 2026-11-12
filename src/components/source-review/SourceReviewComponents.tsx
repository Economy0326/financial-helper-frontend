import type { ReactNode } from "react";

export type AuditEntry = { reviewId: string; question: number; decision: string; decidedAt: string;
  reviewerAccountId: string; rawSha256: string };

/** Audit API is already scoped to one document; question is its stable item identity. */
export function auditsForQuestion(rows: AuditEntry[], question: number): AuditEntry[] {
  return rows.filter((row) => row.question === question);
}

export function reviewStatusLabel(value: string): string {
  return ({ PENDING: "검토 대기", APPROVED: "승인 완료", REJECTED: "승인 거절",
    REVOKED: "승인 철회", READY: "서비스 사용 가능" } as Record<string, string>)[value] ?? value;
}

export function formatSeoulTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" })
    .format(new Date(value));
}

export function ReviewAuditList({ rows }: { rows: AuditEntry[] }) {
  if (!rows.length) return <p className="mt-2 text-sm">결정 기록이 없습니다.</p>;
  return <ul className="mt-2 space-y-2">{rows.map((row) =>
    <li key={`${row.reviewId}-${row.decidedAt}-${row.decision}`} className="border-t border-border pt-2 text-sm">
      <span>Q{row.question} · {reviewStatusLabel(row.decision)} · {formatSeoulTime(row.decidedAt)} (한국 시간)</span>
      <details className="mt-1"><summary className="cursor-pointer">감사 기술 상세</summary>
        <p className="break-all">Reviewer {row.reviewerAccountId} · SHA-256 {row.rawSha256}</p></details>
    </li>)}</ul>;
}

export type ReviewStage = { label: string; state: "done" | "current" | "waiting"; detail: string };

export function ReviewProgress({ stages }: { stages: ReviewStage[] }) {
  return <nav aria-label="공식자료 검토 단계" className="rounded-card border border-border bg-surface p-5">
    <ol className="grid gap-3 sm:grid-cols-5">{stages.map((stage, index) =>
      <li key={stage.label} aria-current={stage.state === "current" ? "step" : undefined}
        className="rounded-control border border-border p-3 text-sm">
        <span className="font-bold">{index + 1}. {stage.label}</span>
        <span className="mt-1 block">{stage.state === "done" ? "완료" : stage.state === "current" ? "진행 중" : "대기"}</span>
        <span className="mt-1 block text-foreground-muted">{stage.detail}</span>
      </li>)}</ol>
    <p className="mt-3 text-sm">수집·항목 추출·검토표 준비는 승인이 아닙니다. 승인된 근거도 별도 READY 검증 전에는 검색에 사용되지 않습니다.</p>
  </nav>;
}

export type ReviewWorkItem = { id: string; title: string; status: string };

/** The caller supplies persisted review states; no change-detection status is inferred here. */
export function ReviewWorkQueue({ items }: { items: ReviewWorkItem[] }) {
  const waiting = items.filter((item) => item.status === "PENDING" || item.status === "REJECTED" || item.status === "REVOKED");
  return <section aria-labelledby="review-work-heading" className="rounded-card border border-border bg-surface p-5">
    <h2 id="review-work-heading" className="text-xl font-bold">이 문서에서 처리할 항목</h2>
    {waiting.length === 0 ? <p className="mt-2">현재 검토 대기 또는 거절·철회된 항목이 없습니다.</p>
      : <ul className="mt-3 space-y-2">{waiting.map((item) => <li key={item.id}>
        <a href={`#${item.id}`} className="inline-flex min-h-11 items-center rounded-control border border-border px-3 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {item.title} · {reviewStatusLabel(item.status)} 항목으로 이동
        </a>
      </li>)}</ul>}
    <p className="mt-3 text-sm text-foreground-muted">표시된 상태는 저장된 검토 결정 기준입니다. 공식 원문 변경 감지는 아직 제공하지 않습니다.</p>
  </section>;
}

export function SourceLocation({ pageReference, locator }: { pageReference: string; locator: string }) {
  const match = /^p\.(\d+)(?:-(\d+))?$/.exec(pageReference);
  const readable = match ? `공식 PDF ${match[1]}${match[2] ? `~${match[2]}` : ""}페이지` : pageReference;
  return <div className="text-sm text-foreground-muted">
    <span>{readable}</span>
    <details className="mt-1"><summary className="cursor-pointer">기술 위치 정보</summary>
      <code className="break-all">{locator}</code></details>
  </div>;
}

/** Display-only formatting. The API body, offsets and hash are never rewritten. */
export function SourceText({ body, squareParagraphGlyph = false }: { body: string; squareParagraphGlyph?: boolean }) {
  return <div className="space-y-1 leading-7">{body.split(/\r?\n/).map((line, index) => {
    const page = /^\s*\[PAGE (\d+)\]\s*$/.exec(line);
    if (page) return <p key={index} className="mt-3 border-t border-border pt-2 text-sm text-foreground-muted">PDF {page[1]}페이지 시작</p>;
    const paragraph = /^(\s*)□\s?(.*)$/.exec(line);
    if (squareParagraphGlyph && paragraph) return <p key={index} className="break-words pl-5 [text-indent:-1.25rem]">• {paragraph[2]}</p>;
    return <p key={index} className="min-h-2 whitespace-pre-wrap break-words">{line}</p>;
  })}</div>;
}

export function ReviewItemCard({ id, title, status, location, body, context, audit, squareParagraphGlyph, children }: {
  id?: string; title: string; status: string; location: { pageReference: string; locator: string };
  body: string; context: string[]; audit: AuditEntry[]; squareParagraphGlyph?: boolean; children?: ReactNode;
}) {
  return <article id={id} className="scroll-mt-6 rounded-card border border-border bg-surface p-5">
    <h3 className="text-lg font-bold">{title} <span className="text-sm font-normal">· {reviewStatusLabel(status)}</span></h3>
    <SourceLocation {...location} />
    <details className="mt-3" open={status === "PENDING"}>
      <summary className="cursor-pointer font-semibold">공식 원문 전체 읽기</summary>
      <div className="mt-3"><SourceText body={body} squareParagraphGlyph={squareParagraphGlyph} /></div>
    </details>
    {context.length > 0 && <div className="mt-3"><p className="font-semibold">필수 조건·예외·주의 문맥</p>
      <ul className="list-disc pl-5">{context.map((text) => <li key={text}>{text}</li>)}</ul></div>}
    {children}
    <details className="mt-4"><summary className="cursor-pointer">이 항목의 결정 기록 {audit.length}건</summary>
      <ReviewAuditList rows={audit} /></details>
  </article>;
}

