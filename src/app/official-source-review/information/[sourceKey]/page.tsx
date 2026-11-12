"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ReviewProgress, ReviewWorkQueue, SourceText, formatSeoulTime, reviewStatusLabel, type ReviewStage } from "@/components/source-review/SourceReviewComponents";
import { ApiResponseError } from "@/lib/api/errors";
import { informationReviewApi, sourceReviewApi, type InformationReviewAudit,
  type InformationReviewCandidate, type InformationReviewDocument,
  type InformationReviewState, type ReviewableSource } from "@/lib/api/source-review";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";

const enabled = process.env.NEXT_PUBLIC_OFFICIAL_REVIEW_ENABLED === "true";
const button = "min-h-11 rounded-control border border-primary px-4 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

function messageFor(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (error.status === 401) return "로그인 후 다시 시도해 주세요.";
    if (error.status === 403) return "이 계정에는 공식자료 Reviewer 권한이 없습니다.";
    if (error.code === "SOURCE_REVIEW_DOCUMENT_MISSING") return "이 공식자료는 아직 수집되지 않았습니다.";
    return `요청을 완료하지 못했습니다. 상태 ${error.status}, 코드 ${error.code ?? "UNKNOWN"}`;
  }
  return "서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.";
}

export default function InformationSourceReviewPage() {
  const params = useParams<{ sourceKey: string }>();
  const sourceKey = params.sourceKey;
  const api = useMemo(() => informationReviewApi(sourceKey), [sourceKey]);
  const [source, setSource] = useState<ReviewableSource | null>(null);
  const [document, setDocument] = useState<InformationReviewDocument | null>(null);
  const [candidates, setCandidates] = useState<InformationReviewCandidate[]>([]);
  const [reviews, setReviews] = useState<InformationReviewState[]>([]);
  const [audits, setAudits] = useState<InformationReviewAudit[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scopeChecked, setScopeChecked] = useState(false);
  const [itemChecked, setItemChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await sourceReviewApi.sources();
      const chosen = list.find((row) => row.sourceKey === sourceKey && row.reviewWorkflowAvailable);
      if (!chosen) { setMessage("이 자료의 항목별 검토는 지원하지 않습니다."); return; }
      setSource(chosen);
      if (!chosen.documentId) { setDocument(null); setCandidates([]); setReviews([]); setAudits([]); return; }
      const current = await api.document();
      const [claimRows, reviewRows, auditRows] = await Promise.all([
        api.candidates(current.documentId), api.reviews(current.documentId), api.audit(current.documentId),
      ]);
      setDocument(current);
      setCandidates(claimRows);
      setReviews(reviewRows);
      setAudits(auditRows);
      if (reviewRows.length > 0) {
        setStartDate(reviewRows[0].start);
        setEndDate(reviewRows[0].end ?? "");
      }
    } catch (error) { setMessage(messageFor(error)); }
  }, [api, sourceKey]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await action(); await load(); setMessage(success); }
    catch (error) { setMessage(messageFor(error)); }
    finally { setBusy(false); }
  }

  if (!enabled) return <main className="p-8">공식자료 검토 화면은 허용된 시연 환경에서만 사용할 수 있습니다.</main>;

  const prepared = reviews.length > 0;
  const decided = prepared && reviews.every((row) => row.status !== "PENDING");
  const stages: ReviewStage[] = [
    { label: "원문 확인", state: prepared ? "done" : "current", detail: document ? "저장된 원본 확인 가능" : "수집 전" },
    { label: "근거 항목 확인", state: prepared ? "done" : document ? "current" : "waiting", detail: `${candidates.length}개 후보` },
    { label: "적용 범위 설정", state: prepared ? "done" : candidates.length ? "current" : "waiting", detail: prepared ? "서버에 기간 저장" : "검토자가 기간 확인" },
    { label: "검토 시작", state: prepared ? "done" : candidates.length ? "current" : "waiting", detail: prepared ? "검토표 준비 완료" : "승인 전 준비 단계" },
    { label: "항목별 승인·거절", state: decided ? "done" : prepared ? "current" : "waiting",
      detail: `결정 ${reviews.filter((row) => row.status !== "PENDING").length}/${reviews.length || candidates.length}` },
  ];
  const official = source ? safeOfficialLink(source.officialUrl) : null;
  const canPrepare = document && document.storedBytesMatchHash && candidates.length > 0 && !prepared
    && startDate && (!endDate || endDate >= startDate) && scopeChecked;
  const approved = prepared && reviews.length === candidates.length
    && reviews.every((row) => row.status === "APPROVED");

  return <div className="min-h-screen bg-background"><AppHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header><Link href="/official-source-review" className="text-primary underline">공식자료 목록으로 이동</Link>
        <h1 className="mt-3 text-3xl font-bold">공식자료 검토</h1>
        <p className="mt-2 break-words">{source?.title ?? `${source?.organization ?? "공식기관"} 자료 · 제목 확인 전`}</p>
        <p className="text-sm text-foreground-muted">이 화면의 원문 확인·검토표 준비는 승인 결정이 아닙니다. 승인 후에도 READY 검증 전에는 검색에 사용되지 않습니다.</p>
      </header>
      <ReviewProgress stages={stages} />
      {prepared && <ReviewWorkQueue items={reviews.map((row) => ({
        id: `item-${row.chunkId}`, title: candidates.find((item) => item.chunkId === row.chunkId)?.label ?? "근거 항목", status: row.status,
      }))} />}
      {message && <p role="status" className="rounded-control border border-border p-3">{message}</p>}
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">1. 공식 원문과 저장 판본</h2>
        <p className="mt-2">기관: {source?.organization ?? "확인 전"} · 게시일: {document?.publishedAt ?? "확인 전"}</p>
        <p>판본: {document?.version ?? "미수집"} · 원본 바이트 Hash: {document?.storedBytesMatchHash ? "DB 기록과 일치" : "확인 전 또는 불일치"}</p>
        <p className="text-sm">이 검사는 저장된 바이트와 DB 기록만 비교합니다. 공식 URL의 최신 변경 여부는 확인하지 않습니다.</p>
        {document && <details><summary className="cursor-pointer">Hash 기술 상세</summary><code className="break-all">{document.rawSha256}</code>
          <p>수집 시각: {formatSeoulTime(document.retrievedAt)} (한국 시간)</p></details>}
        {official && <a href={official} target="_blank" rel="noopener noreferrer" className={`${button} mt-3 inline-flex items-center`}>공식 원문 보기 ↗ (외부 사이트)</a>}
        <div className="mt-4 flex flex-wrap gap-2">
          {!document && <button type="button" className={button} disabled={busy || !source} onClick={() => void run(api.ingest, "공식자료 수집 결과를 확인했습니다.")}>공식자료 처음 수집하기</button>}
          {document && <button type="button" className={button} disabled={busy} onClick={() => void run(() => api.extract(document.documentId), "검토 후보 항목을 추출했습니다.")}>근거 후보 추출하기</button>}
          <button type="button" className={button} disabled={busy} onClick={() => void run(async () => {}, "저장된 상태를 다시 조회했습니다.")}>{busy ? "처리 중…" : "저장된 상태 새로고침"}</button>
        </div>
      </section>
      {document && <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">2. 적용 범위와 검토 시작</h2>
        <p className="mt-2 text-sm">적용 기간은 설명할 사실의 범위입니다. 게시일·승인 결정 시각과 다릅니다. 근거를 확인할 수 없는 시작일은 입력하지 마세요.</p>
        <div className="mt-3 flex flex-wrap gap-3"><label>근거 적용 시작일 <input type="date" value={startDate} disabled={prepared || busy}
          onChange={(event) => setStartDate(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label>
          <label>근거 적용 종료일 (선택) <input type="date" value={endDate} disabled={prepared || busy}
          onChange={(event) => setEndDate(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label></div>
        <label className="mt-3 flex gap-2"><input type="checkbox" checked={scopeChecked} disabled={prepared || busy}
          onChange={(event) => setScopeChecked(event.target.checked)} />원본 판본·적용 대상·시점·제외 범위를 직접 확인했습니다.</label>
        <button type="button" className={`${button} mt-3`} disabled={!canPrepare || busy}
          onClick={() => { if (window.confirm("현재 판본과 적용 기간으로 검토표를 준비하시겠습니까? 아직 승인은 아닙니다."))
            void run(() => api.prepare(document.documentId, document.rawSha256, startDate, endDate || null), "검토표를 준비했습니다. 항목별 승인은 별도 결정입니다."); }}>
          검토 시작하기</button>
        {!canPrepare && !prepared && <p className="mt-2 text-sm">원본 바이트 일치, 후보 추출, 적용 시작일과 확인 체크가 필요합니다.</p>}
      </section>}
      <section className="space-y-4" aria-label="공식 근거 항목"><h2 className="text-xl font-bold">3. 근거 항목</h2>
        {!candidates.length && <p>추출된 검토 후보가 없습니다.</p>}
        {candidates.map((item) => { const review = reviews.find((row) => row.chunkId === item.chunkId);
          const itemAudits = audits.filter((row) => row.reviewId === review?.reviewId);
          return <article id={`item-${item.chunkId}`} key={item.chunkId} className="scroll-mt-6 rounded-card border border-border bg-surface p-5">
            <h3 className="font-bold">{item.label} · {reviewStatusLabel(review?.status ?? item.status)}</h3>
            <p className="mt-1 text-sm">원문 위치: {item.article ?? item.page ?? "본문"}</p>
            <details className="mt-1"><summary className="cursor-pointer">UTF-16 위치 기술 상세</summary><code className="break-all">{item.locator}</code></details>
            <details open={review?.status === "PENDING"} className="mt-3"><summary className="cursor-pointer font-semibold">저장된 원문 전체 읽기</summary>
              <SourceText body={item.body} squareParagraphGlyph /></details>
            {review?.status === "PENDING" && <div className="mt-4 space-y-2">
              <label className="flex gap-2"><input type="checkbox" checked={!!itemChecked[item.chunkId]}
                onChange={(event) => setItemChecked((old) => ({ ...old, [item.chunkId]: event.target.checked }))} />원문과 조건·예외를 직접 확인했습니다.</label>
              <p className="text-sm">판본 {document?.version}, 적용 기간 {review.start} ~ {review.end ?? "종료일 미지정"}</p>
              <button type="button" className={button} disabled={busy || !itemChecked[item.chunkId]}
                onClick={() => { if (window.confirm(`${item.label} 항목을 승인하시겠습니까? READY는 별도입니다.`))
                  void run(() => api.decide(review.reviewId, review.rawSha256, "APPROVE", true, true), "승인 결정과 감사 기록을 다시 조회했습니다."); }}>승인</button>{" "}
              <button type="button" className={button} disabled={busy}
                onClick={() => { if (window.confirm(`${item.label} 항목을 거절하시겠습니까?`))
                  void run(() => api.decide(review.reviewId, review.rawSha256, "REJECT", false, false), "거절 결정과 감사 기록을 다시 조회했습니다."); }}>거절</button>
            </div>}
            <details className="mt-4"><summary className="cursor-pointer">이 항목의 결정 감사 {itemAudits.length}건</summary>
              <ul>{itemAudits.map((entry) => <li key={`${entry.reviewId}-${entry.decidedAt}`}>
                {reviewStatusLabel(entry.decision)} · {formatSeoulTime(entry.decidedAt)} (한국 시간)
                <details><summary className="cursor-pointer">감사 기술 상세</summary><code className="break-all">{entry.reviewerAccountId} · {entry.rawSha256}</code></details>
              </li>)}</ul></details>
          </article>;
        })}
      </section>
      <section className="rounded-card border border-border bg-surface p-5"><h2 className="text-xl font-bold">4. READY 기술 검증</h2>
        <p className="mt-2">검색 상태: {source?.searchAvailable ? "검토된 검색 범위 사용 가능" : "READY 검증 전 또는 검색 범위 미확인"}</p>
        <p className="text-sm">승인은 검색 활성화와 다릅니다. 승인된 현재 판본만 기존 READY 근거와 함께 인덱싱합니다.</p>
        <button type="button" className={`${button} mt-3`} disabled={busy || !approved || !document || source?.searchAvailable}
          onClick={() => { if (document && window.confirm("현재 승인된 근거를 READY 검증하고 활성화하시겠습니까? 기존 READY 범위도 보존해야 합니다."))
            void run(() => api.ready(document.documentId), "READY 결과와 자료 상태를 다시 조회했습니다."); }}>
          READY 검증 및 활성화 시작</button>
        {!approved && <p className="mt-2 text-sm">모든 항목의 사람 승인과 현재 판본 확인이 필요합니다.</p>}
      </section>
    </main></div>;
}
