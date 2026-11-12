"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ReviewAuditList, ReviewItemCard, ReviewProgress, ReviewWorkQueue, auditsForQuestion, formatSeoulTime,
  type ReviewStage } from "@/components/source-review/SourceReviewComponents";
import { ApiResponseError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/client";
import { sourceReviewApi, type ReviewAudit, type ReviewCandidate, type ReviewDocument, type ReviewState } from "@/lib/api/source-review";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";

const enabled = process.env.NEXT_PUBLIC_OFFICIAL_REVIEW_ENABLED === "true";
const expectedHash = "1b9df7cae3c3563f08e26194abb1c9735cd81dbe08dd79c9d7198066bcd4e989";
const expectedQuestions = [1, 2, 3, 5, 6, 7, 8, 9, 10];
const scopeNotes: Record<number, string> = {
  2: "ISA·DC·IRP는 보호상품으로 운용되는 부분만 확인합니다.",
  6: "원금과 소정의 이자, 기관별 이자 기준 각주를 확인합니다.",
  10: "별도 한도, 사고보험금 각주와 세 가지 예시를 함께 확인합니다.",
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (error.status === 401) return "먼저 본인 계정으로 로그인해 주세요.";
    if (error.status === 403) return "이 계정에는 Reviewer 권한이 없습니다. 전용 DB의 권한 부여 절차를 확인해 주세요.";
    if (error.code === "SOURCE_REVIEW_DOCUMENT_MISSING") return "공식 PDF가 아직 수집되지 않았습니다.";
    return `요청이 거부됐습니다. 상태 ${error.status}, 코드 ${error.code ?? "UNKNOWN"}`;
  }
  return "요청을 완료하지 못했습니다. 서버와 시연 DB 상태를 확인해 주세요.";
}

export default function DepositReviewPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [document, setDocument] = useState<ReviewDocument | null>(null);
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [reviews, setReviews] = useState<ReviewState[]>([]);
  const [audit, setAudit] = useState<ReviewAudit[]>([]);
  const [searchAvailable, setSearchAvailable] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const account = await apiFetch<{ authenticated: boolean; accountId: string | null }>("/auth/me");
      setAccountId(account.authenticated ? account.accountId : null);
      const current = await sourceReviewApi.document();
      setDocument(current);
      const [reviewRows, auditRows, sources] = await Promise.all([
        sourceReviewApi.reviews(current.documentId), sourceReviewApi.audit(current.documentId), sourceReviewApi.sources(),
      ]);
      setReviews(reviewRows);
      setAudit(auditRows);
      setSearchAvailable(sources.some((source) => source.documentId === current.documentId && source.searchAvailable));
      if (reviewRows.length) {
        setStartDate(reviewRows[0].applicabilityStartDate);
        setEndDate(reviewRows[0].applicabilityEndDate ?? "");
      }
      try {
        setCandidates(await sourceReviewApi.candidates(current.documentId));
        setCandidateError("");
      } catch (error) {
        setCandidates([]);
        setCandidateError(errorMessage(error));
      }
      setMessage("");
      return true;
    } catch (error) {
      setDocument(null);
      setCandidates([]);
      setReviews([]);
      setAudit([]);
      setSearchAvailable(false);
      setMessage(errorMessage(error));
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      if (await load()) setMessage(success);
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }

  if (!enabled) return <main className="p-8">공식자료 검토 화면은 허용된 시연 환경에서만 사용할 수 있습니다.</main>;

  const exactDocument = document?.rawSha256 === expectedHash;
  const exactCandidates = candidates.length === expectedQuestions.length
    && candidates.every((candidate, index) => candidate.question === expectedQuestions[index]);
  const prepared = reviews.length > 0;
  const allDecided = prepared && reviews.length === expectedQuestions.length
    && reviews.every((review) => review.status !== "PENDING");
  const approvedCount = reviews.filter((row) => row.status === "APPROVED").length;
  const readyEligible = allDecided && approvedCount === expectedQuestions.length && exactDocument;
  const stages: ReviewStage[] = [
    { label: "원문 확인", state: prepared ? "done" : "current", detail: prepared ? "판본 확인 후 검토표 기록" : document ? "수집됨 · 사람 확인 전" : "수집 전" },
    { label: "근거 항목 확인", state: prepared ? "done" : document ? "current" : "waiting", detail: prepared ? "항목 확인 기록" : exactCandidates ? "항목 추출 완료 · 확인 대기" : "추출 대기" },
    { label: "적용 범위 설정", state: prepared ? "done" : exactCandidates ? "current" : "waiting", detail: prepared ? "서버에 기간 기록" : "검토표 준비 시 기록" },
    { label: "검토 시작", state: prepared ? "done" : exactCandidates ? "current" : "waiting", detail: prepared ? "검토표 준비 완료" : "승인 전 준비 단계" },
    { label: "항목별 승인·거절", state: allDecided ? "done" : prepared ? "current" : "waiting", detail: `${allDecided ? "결정 완료 " : "결정 "}${reviews.filter((row) => row.status !== "PENDING").length}/${expectedQuestions.length} · 승인 ${approvedCount}/${expectedQuestions.length}` },
  ];
  const prepareBlock = !document ? "먼저 공식 PDF를 수집하세요."
    : !exactDocument ? "검토된 PDF Hash와 다릅니다."
      : !exactCandidates ? "먼저 9개 근거 항목을 추출·확인하세요."
        : !startDate ? "근거 적용 시작일을 입력하세요."
          : startDate < "2025-09-01" ? "이 자료의 상향 한도 적용 시작일은 2025-09-01보다 빠를 수 없습니다."
            : endDate && endDate < startDate ? "종료일이 시작일보다 빠릅니다."
              : !scopeConfirmed ? "판본·제외 범위·시점을 확인하는 체크가 필요합니다."
                : prepared ? "검토표가 이미 준비됐습니다." : "";

  return <div className="min-h-screen bg-background"><AppHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <Link href="/official-source-review" className="inline-flex min-h-11 items-center rounded-control border border-border px-4 text-primary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">공식자료 목록으로 이동</Link>
        <h1 className="mt-2 text-3xl font-bold">공식자료 검토</h1>
        <p className="mt-3 leading-7 text-foreground-muted">공식자료의 내용과 적용 범위를 확인하고 승인 여부를 결정합니다.</p>
        <p className="mt-1">현재 문서: {document?.title ?? "금융위원회 예금보호한도 상향 관련 주요 QA"}</p>
      </header>
      <ReviewProgress stages={stages} />
      {prepared && <ReviewWorkQueue items={reviews.map((review) => ({
        id: `review-item-${review.question}`, title: `Q${review.question}`, status: review.status,
      }))} />}
      <section className="rounded-card border border-border bg-surface p-5 shadow-card" aria-label="원문과 문서 상태">
        <h2 className="text-xl font-bold">1. 원문과 문서 판본</h2>
        <p className="mt-2">로그인 계정 ID: <span className="break-all font-mono text-sm">{accountId ?? "로그인 필요"}</span></p>
        {!accountId && <Link className="mt-2 inline-block font-semibold text-primary underline" href="/auth/login">로그인 화면 열기</Link>}
        <p className="mt-3">문서: {document?.title ?? "아직 확인되지 않음"}</p>
        {document && <><p className="mt-1 text-sm">판본 {document.documentVersion} · 게시일 {document.publishedAt}</p>
          <p className="text-sm">게시일은 문서 메타데이터이며 근거 적용 시작일이나 승인 결정일이 아닙니다.</p>
          <div className="mt-3 rounded-control border border-border p-3 text-sm">
            <p className="font-semibold">저장된 원본 무결성: {document.storedBytesMatchHash === true && document.matchesReviewedHash === true ? "일치" : "확인 필요"}</p>
            <p>저장된 원본 바이트 SHA-256과 DB 기록: {document.storedBytesMatchHash === undefined ? "서버 재시작 후 확인 가능" : document.storedBytesMatchHash ? "일치" : "불일치"}</p>
            <p>저장된 판본과 이번 검토 기준 Hash: {document.matchesReviewedHash === undefined ? "서버 재시작 후 확인 가능" : document.matchesReviewedHash ? "일치" : "불일치"}</p>
            <p>원본 수집 시각: {document.retrievedAt ? `${formatSeoulTime(document.retrievedAt)} (한국 시간)` : "서버 재시작 후 확인 가능"}</p>
            <p>저장 바이트 해시 재계산: {document.verifiedAt ? `${formatSeoulTime(document.verifiedAt)} (한국 시간)` : "서버 재시작 후 확인 가능"}</p>
            <p>현재 공식 URL을 다시 수집해 비교한 결과는 아닙니다.</p>
            <details><summary className="cursor-pointer">원본 Hash 기술 상세</summary><code className="break-all">{document.rawSha256}</code></details>
          </div>
          {safeOfficialLink(document.metadataSourceUrl) && <a className="mt-2 inline-flex min-h-11 items-center break-all rounded-control border border-border px-4 text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={safeOfficialLink(document.metadataSourceUrl)!} target="_blank" rel="noopener noreferrer">공식 게시글 보기 ↗</a>}
          {safeOfficialLink(document.pdfUrl) && <a className="mt-2 inline-flex min-h-11 items-center break-all rounded-control border border-border px-4 text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={safeOfficialLink(document.pdfUrl)!} target="_blank" rel="noopener noreferrer">공식 PDF 원문 보기 ↗</a>}</>}
        {document && !exactDocument && <p role="alert" className="mt-3 font-bold text-red-700">검토된 PDF Hash와 다릅니다. 검토를 진행할 수 없습니다.</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {!document && <button type="button" disabled={busy} onClick={() => void run(sourceReviewApi.ingest, "공식 PDF 수집 결과를 확인했습니다.")} className="min-h-12 rounded-control border border-primary px-4 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "처리 중…" : "공식 PDF 처음 수집하기"}</button>}
          {document && <span className="self-center font-semibold">수집 완료 · 기존 문서 조회 중</span>}
          <button type="button" disabled={busy} onClick={() => void run(async () => {}, "저장된 상태를 다시 조회했습니다.")} className="min-h-12 rounded-control border border-border px-4 font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "조회 중…" : "저장된 상태 새로고침"}</button>
        </div>
      </section>
      {message && <p role="status" className="rounded-control border border-border bg-surface p-4">{message}</p>}
      <section className="rounded-card border border-border bg-surface p-5" aria-labelledby="items-heading">
        <h2 id="items-heading" className="text-xl font-bold">2. 근거 항목</h2>
        <p className="mt-2">승인 후보: Q1·2·3·5·6·7·8·9·10. Q4·머리말·미승인 법령은 제외됩니다.</p>
        {candidateError && <p role="status" className="mt-2">항목 조회 결과: {candidateError}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {exactCandidates ? <span className="font-semibold">항목 추출 완료 · 9개 저장됨</span>
            : document && exactDocument && <button type="button" disabled={busy} onClick={() => void run(() => sourceReviewApi.chunk(document.documentId), "근거 후보를 추출했습니다. 아직 승인되지 않았습니다.")} className="min-h-12 rounded-control border border-primary px-4 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "추출 중…" : "근거 후보 추출하기"}</button>}
          <span>기존 항목 조회는 상태 새로고침으로 수행합니다.</span>
        </div>
      </section>
      <section className="rounded-card border border-border bg-surface p-5" aria-labelledby="scope-heading">
        <h2 id="scope-heading" className="text-xl font-bold">3. 근거 적용 범위와 검토 시작</h2>
        <p className="mt-2 leading-7">이 기간은 <strong>근거 주장의 적용 기간</strong>입니다. 문서 게시일·사람의 승인 효력일과 다릅니다. 2025-09-01은 문서에 명시된 상향 한도 시행일이며, 과거 사고의 개인별 결과를 확정하지 않습니다.</p>
        <p className="mt-1 text-sm">승인 결정 시각과 결정자는 입력하지 않습니다. 서버의 감사 기록에 남습니다.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="font-semibold">근거 적용 시작일 <input className="ml-2 min-h-12 rounded-control border border-border p-2" type="date" value={startDate} disabled={prepared} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="font-semibold">근거 적용 종료일(선택) <input className="ml-2 min-h-12 rounded-control border border-border p-2" type="date" value={endDate} disabled={prepared} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
        {prepared ? <p className="mt-4 font-semibold">검토표 준비 완료 · 미결정 항목은 검토 대기 상태입니다.</p> : <>
          <label className="mt-4 flex items-start gap-2"><input className="mt-1.5 size-5" type="checkbox" checked={scopeConfirmed} onChange={(event) => setScopeConfirmed(event.target.checked)} />문서 판본, 항목별 제외 범위, 근거 적용 기간을 직접 확인했습니다.</label>
          <button type="button" disabled={busy || Boolean(prepareBlock)} onClick={() => document && void run(() => sourceReviewApi.prepare(document.documentId, startDate, endDate || null), "9개 항목의 검토표가 준비됐습니다. 아직 승인되지 않았습니다.")} className="mt-4 min-h-12 rounded-control bg-primary px-5 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "준비 중…" : "검토 시작하기"}</button>
          {prepareBlock && <p className="mt-2 text-sm" role="status">진행 조건: {prepareBlock}</p>}
        </>}
      </section>
      <section aria-labelledby="decisions-heading" className="space-y-4">
        <h2 id="decisions-heading" className="text-xl font-bold">4. 항목별 승인·거절</h2>
        {!prepared && <p>검토표를 준비한 뒤 각 항목의 원문·조건·예외를 확인하고 결정할 수 있습니다.</p>}
        {candidates.map((candidate) => {
          const review = reviews.find((item) => item.question === candidate.question);
          const itemAudit = auditsForQuestion(audit, candidate.question);
          return <ReviewItemCard key={candidate.supportChunkId} id={`review-item-${candidate.question}`} title={`Q${candidate.question}`} status={review?.status ?? "검토 준비 전"} squareParagraphGlyph
            location={{ pageReference: candidate.pageReference, locator: candidate.locator }} body={candidate.body}
            context={[...(scopeNotes[candidate.question] ? [scopeNotes[candidate.question]] : []), ...candidate.mandatoryContextPassages]}
            audit={itemAudit}>
            {document && safeOfficialLink(document.pdfUrl) && <a className="mt-3 inline-flex min-h-11 items-center rounded-control border border-border px-4 text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={safeOfficialLink(document.pdfUrl)!} target="_blank" rel="noopener noreferrer">이 항목의 공식 PDF 원문 보기 ↗</a>}
            {review?.status === "PENDING" && exactDocument && <div className="mt-5 space-y-3">
              <p className="text-sm">결정 대상: Q{candidate.question} · 판본 {document?.documentVersion} · 근거 적용 기간 {review.applicabilityStartDate} ~ {review.applicabilityEndDate ?? "종료일 미지정"}</p>
              <label className="flex items-start gap-2"><input className="mt-1 size-5" type="checkbox" checked={checked[candidate.question] ?? false} onChange={(event) => setChecked((value) => ({ ...value, [candidate.question]: event.target.checked }))} />원문 전체와 필수 조건·예외·적용 범위를 확인했습니다.</label>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={busy || !checked[candidate.question]} onClick={() => {
                  if (window.confirm(`Q${candidate.question}을 승인하시겠습니까? 문서 판본 ${document?.documentVersion}, 적용 시작일 ${review.applicabilityStartDate}을 확인하세요.`))
                    void run(() => sourceReviewApi.decide(review.reviewId, document!.rawSha256, "APPROVE"), `Q${candidate.question} 승인 결정이 기록됐습니다.`);
                }} className="min-h-12 rounded-control bg-primary px-4 font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">Q{candidate.question} 승인</button>
                <button type="button" disabled={busy} onClick={() => {
                  if (window.confirm(`Q${candidate.question}을 거절하시겠습니까? 이 항목은 승인 근거로 사용할 수 없습니다.`))
                    void run(() => sourceReviewApi.decide(review.reviewId, document!.rawSha256, "REJECT"), `Q${candidate.question} 거절 결정이 기록됐습니다.`);
                }} className="min-h-12 rounded-control border border-border px-4 font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">Q{candidate.question} 거절</button>
              </div>
            </div>}
          </ReviewItemCard>;
        })}
      </section>
      <section className="rounded-card border border-border bg-surface p-5" aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="text-xl font-bold">결정 감사 기록</h2>
        <ReviewAuditList rows={audit} />
        <p className="mt-4 text-sm text-foreground-muted">APPROVED 기록만으로 검색이 시작되지 않습니다. READY 전환은 별도 검증 단계입니다.</p>
      </section>
      {readyEligible && <section className="rounded-card border border-border bg-surface p-5" aria-label="READY 검증">
        <h2 className="text-xl font-bold">별도 READY 검증</h2>
        <p className="mt-2">9개 항목의 사람 결정은 완료됐습니다. READY는 원문 판본·검토 범위·KURE 인덱스를 다시 검증하는 별도 작업입니다.</p>
        <p className="mt-1 font-semibold">현재 검색 상태: {searchAvailable ? "검토된 검색 범위 사용 가능" : "READY 검증 전 또는 검색 범위 미확인"}</p>
        {!searchAvailable && <button type="button" disabled={busy} onClick={() => {
          if (window.confirm(`판본 ${document?.documentVersion}의 승인 항목 9건으로 READY 인덱스 검증을 시작하시겠습니까?`))
            void run(() => sourceReviewApi.ready(document!.documentId), "READY 검증 요청을 완료했습니다. 검색 상태를 다시 확인하세요.");
        }} className="mt-3 min-h-12 rounded-control border border-primary px-4 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{busy ? "검증 중…" : "READY 검증 및 활성화 시작"}</button>}
      </section>}
    </main>
  </div>;
}
