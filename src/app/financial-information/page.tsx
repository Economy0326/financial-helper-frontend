"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSessionQuery } from "@/lib/query/session";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createEvidenceReport, getEvidenceReport, getEvidenceSnapshot, searchDocumentEvidence,
  type DocumentEvidence, type EvidenceReport, type EvidenceSnapshot,
} from "@/lib/api/document-evidence";
import { officialHttpsUrl, visibleReport, visibleSnapshot } from "@/lib/consultation/document-evidence-state.mjs";

function EvidenceList({ evidence }: { evidence: DocumentEvidence[] }) {
  return <div className="space-y-4">{evidence.map((item) => {
    const url = officialHttpsUrl(item.officialUrl);
    return <article key={item.claimId} className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-primary">{item.organizationName} · {item.title}</p>
      <p className="mt-3 whitespace-pre-wrap leading-7">{item.excerpt}</p>
      {item.related?.length > 0 && <dl className="mt-4 space-y-2">{item.related.map((part, index) => <div key={`${part.role}-${part.start}-${part.end}-${index}`}>
        <dt className="font-bold">{part.role === "EXCEPTION" ? "예외" : part.role === "CONDITION" ? "조건" : "관련 원문"}</dt>
        <dd className="whitespace-pre-wrap leading-7">{part.text}</dd>
      </div>)}</dl>}
      <p className="mt-4 text-sm leading-6 text-foreground-muted">게시일: {item.publishedAt ?? "미확인"} · 원문 위치: {item.locator}</p>
      <p className="text-sm font-semibold text-foreground-muted">{item.currentApplicability === "NOT_VERIFIED" ? "현재 적용 여부 미확인" : `현재 적용 상태: ${item.currentApplicability}`}</p>
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-primary underline">공식 원문 보기</a>}
    </article>;
  })}</div>;
}

function QuestionFlow() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<EvidenceSnapshot | null>(null);
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); }
    catch (cause) {
      setSnapshot(null); setReport(null);
      setError(cause instanceof ApiResponseError && (cause.status === 401 || cause.status === 403)
        ? "로그인 상태와 접근 권한을 확인해 주세요." : "정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    const input = question;
    setSnapshot(null); setReport(null); setSnapshotId(null); setReportId(null); setSubmitted("");
    void run(async () => {
      const result = await searchDocumentEvidence(input);
      setSnapshot(result); setSnapshotId(result.snapshotId); setSubmitted(input);
    });
  }
  const reportContent = visibleReport(report);
  const evidence = visibleSnapshot(snapshot);
  return <>
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label htmlFor="question" className="block font-bold">금융 정보에 관해 질문해 주세요</label>
      <p className="text-sm text-foreground-muted">이름, 연락처, 계좌번호 등 개인정보는 입력하지 마세요.</p>
      <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4}
        className="w-full rounded-control border border-border bg-surface p-3" placeholder="궁금한 내용을 자유롭게 입력하세요" required />
      <button type="submit" disabled={busy || !question.trim()} className="rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">공식 근거 찾기</button>
    </form>
    {busy && <p role="status" className="mt-4">최신 근거를 확인하고 있어요.</p>}
    {error && <p role="alert" className="mt-4">{error}</p>}
    {snapshot?.status === "NO_MATCH" && <p role="status" className="mt-6">관련된 승인 근거를 찾지 못했어요. 질문을 바꾸어 다시 확인해 주세요.</p>}
    {snapshot && snapshot.status !== "READY_CANDIDATES" && snapshot.status !== "NO_MATCH" && <p role="status" className="mt-6">{snapshot.status === "STALE" ? "근거를 다시 확인해야 해요. 새로 검색해 주세요." : "현재 확인할 수 있는 근거가 없어요."}</p>}
    {evidence.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xl font-bold">확인된 문서 내용</h2>
      <p className="text-sm text-foreground-muted">문서의 내용을 보여드려요. 현재 적용 여부는 별도 확인이 필요해요.</p><EvidenceList evidence={evidence} />
    </section>}
    {snapshotId && <div className="mt-6 flex flex-wrap gap-3">
      <button disabled={busy} className="rounded-control border border-border px-4 py-3 font-semibold" onClick={() => { setSnapshot(null); setReport(null); void run(async () => setSnapshot(await getEvidenceSnapshot(snapshotId))); }}>저장된 근거 다시 확인</button>
      {snapshot?.status === "READY_CANDIDATES" && <button disabled={busy} className="rounded-control bg-primary px-4 py-3 font-bold text-primary-foreground" onClick={() => { setReport(null); void run(async () => { const value = await createEvidenceReport(snapshotId, submitted); setReport(value); setReportId(value.reportId); }); }}>결과 저장하기</button>}
    </div>}
    {reportId && <button disabled={busy} className="mt-4 rounded-control border border-border px-4 py-3 font-semibold" onClick={() => { setSnapshot(null); setReport(null); void run(async () => setReport(await getEvidenceReport(reportId))); }}>저장된 결과 다시 확인</button>}
    {report?.status === "STALE" && <p role="status" className="mt-6">저장된 결과의 근거가 변경되어 내용을 표시할 수 없어요. 다시 검색해 주세요.</p>}
    {reportContent && <section className="mt-8 space-y-4"><h2 className="text-xl font-bold">저장된 결과</h2>
      <p><strong>질문:</strong> {reportContent.question}</p><p className="whitespace-pre-wrap leading-7">{reportContent.explanation}</p>
      <p className="text-sm text-foreground-muted">생성 시각: {reportContent.createdAt ?? "미확인"}</p><EvidenceList evidence={reportContent.evidence} />
    </section>}
  </>;
}

export default function FinancialInformationPage() {
  const session = useSessionQuery();
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-bold">금융 정보 질문하기</h1>
    {session.isPending ? <p role="status" className="mt-6">로그인 상태를 확인하고 있어요.</p>
      : session.isError ? <p role="alert" className="mt-6">로그인 상태를 확인하지 못했어요. 다시 접속해 주세요.</p>
      : session.data?.authenticated && session.data.accountId ? <QuestionFlow key={session.data.accountId} />
      : <p className="mt-6">질문과 결과를 확인하려면 <Link className="font-bold text-primary underline" href="/auth/login">로그인</Link>해 주세요.</p>}
  </main></div>;
}
