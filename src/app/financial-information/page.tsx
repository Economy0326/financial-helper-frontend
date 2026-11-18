"use client";

import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSessionQuery } from "@/lib/query/session";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createEvidenceReport, explainDocumentEvidence, getEvidenceReport, getEvidenceSnapshot, searchDocumentEvidence,
  type DocumentEvidence, type EvidenceExplanation, type EvidenceReport, type EvidenceSnapshot,
} from "@/lib/api/document-evidence";
import { clarificationCondition, followUpQuery, officialHttpsUrl, visibleReport, visibleSnapshot } from "@/lib/consultation/document-evidence-state.mjs";

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

function QuestionFlow({ authenticated }: { authenticated: boolean }) {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<EvidenceSnapshot | null>(null);
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [explanation, setExplanation] = useState<EvidenceExplanation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [condition, setCondition] = useState<string | null>(null);
  const [clarification, setClarification] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [applicabilityUncertain, setApplicabilityUncertain] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setExplanation(null);
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
    setSnapshot(null); setReport(null); setSnapshotId(null); setReportId(null); setSubmitted(""); setCondition(null); setClarification(""); setApplicabilityUncertain(false);
    void run(async () => {
      const result = await searchDocumentEvidence(input);
      const missing = clarificationCondition(input, visibleSnapshot(result));
      if (missing && (result.snapshotId || !authenticated)) {
        setSnapshotId(result.snapshotId); setPendingQuestion(input); setCondition(missing); return;
      }
      setSnapshot(result); setSnapshotId(result.snapshotId); setSubmitted(input);
    });
  }
  function clarify(event: FormEvent) {
    event.preventDefault();
    if (!clarification.trim() || (authenticated && !snapshotId)) return;
    const previousId = snapshotId;
    const combined = `${pendingQuestion} ${clarification.trim()}`;
    setCondition(null); setSnapshot(null); setReport(null); setReportId(null); setApplicabilityUncertain(true);
    void run(async () => {
      const previous = authenticated && previousId ? await getEvidenceSnapshot(previousId) : await searchDocumentEvidence(pendingQuestion);
      if (previous.status !== "READY_CANDIDATES") { setSnapshot(previous); setSnapshotId(null); return; }
      const result = await searchDocumentEvidence(combined);
      setSnapshot(result); setSnapshotId(result.snapshotId); setSubmitted(combined);
    });
  }
  function submitFollowUp(event: FormEvent) {
    event.preventDefault();
    if (!followUp.trim() || (authenticated && !snapshotId) || !submitted) return;
    const priorId = snapshotId;
    const followUpInput = followUp;
    setSnapshot(null); setReport(null); setReportId(null); setCondition(null); setApplicabilityUncertain(false);
    void run(async () => {
      const previous = authenticated && priorId ? await getEvidenceSnapshot(priorId) : await searchDocumentEvidence(submitted);
      if (previous.status !== "READY_CANDIDATES") { setSnapshot(previous); setSnapshotId(null); return; }
      const next = followUpQuery(submitted, followUpInput, visibleSnapshot(previous));
      const result = await searchDocumentEvidence(next);
      const missing = clarificationCondition(next, visibleSnapshot(result));
      setSnapshotId(result.snapshotId);
      if (missing && (result.snapshotId || !authenticated)) { setPendingQuestion(next); setClarification(""); setCondition(missing); return; }
      setSnapshot(result); setSubmitted(next); setFollowUp("");
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
    {condition && <form onSubmit={clarify} className="mt-6 space-y-3 rounded-card border border-border p-4">
      <h2 className="font-bold">답변 전 확인할 내용</h2>
      <p>문서에 다음 조건이 있어요: {condition}</p>
      <p>질문에 필요한 범위에서 알려 주세요. 개인정보는 입력하지 마세요. 확인해도 개인별 자격을 확정하지 않습니다.</p>
      <label htmlFor="clarification">확인 답변</label><textarea id="clarification" value={clarification} onChange={(e) => setClarification(e.target.value)} className="block w-full border p-2" />
      <button disabled={busy || !clarification.trim()} className="rounded-control bg-primary px-4 py-2 text-primary-foreground">확인 후 다시 검색</button>
      <button type="button" disabled={busy || (authenticated && !snapshotId)} className="ml-3 rounded-control border px-4 py-2" onClick={() => {
        if (authenticated && !snapshotId) return;
        const id = snapshotId; setCondition(null); setApplicabilityUncertain(true);
        void run(async () => { const current = authenticated && id ? await getEvidenceSnapshot(id) : await searchDocumentEvidence(pendingQuestion); setSnapshot(current); setSubmitted(pendingQuestion); });
      }}>확인하기 어려워요</button>
    </form>}
    {snapshot?.status === "NO_MATCH" && <p role="status" className="mt-6">관련된 승인 근거를 찾지 못했어요. 질문을 바꾸어 다시 확인해 주세요.</p>}
    {snapshot && snapshot.status !== "READY_CANDIDATES" && snapshot.status !== "NO_MATCH" && <p role="status" className="mt-6">{snapshot.status === "STALE" ? "근거를 다시 확인해야 해요. 새로 검색해 주세요." : snapshot.status === "NEEDS_CLARIFICATION" ? "어떤 상품이나 내용이 궁금한지 조금 더 알려 주세요." : snapshot.status === "TEMPORARILY_UNAVAILABLE" ? "검색을 일시적으로 사용할 수 없어요. 잠시 후 다시 시도해 주세요." : "현재 확인할 수 있는 근거가 없어요."}</p>}
    {applicabilityUncertain && <p role="status" className="mt-4">입력한 내용만으로 개인별 적용 여부를 확인할 수 없어요. 아래 문서의 조건과 예외를 확인해 주세요.</p>}
    {evidence.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xl font-bold">확인된 문서 내용</h2>
      <p className="text-sm text-foreground-muted">문서의 내용을 보여드려요. 현재 적용 여부는 별도 확인이 필요해요.</p>
      {(snapshot?.missingPurposes?.length ?? 0) > 0 && <p role="status">질문 중 {snapshot?.missingPurposes?.join(", ")}에 대해서는 확인된 근거를 찾지 못했어요.</p>}
      <EvidenceList evidence={evidence} />
    </section>}
    {evidence.length > 0 && snapshotId && <button disabled={busy} className="mt-4 rounded-control border px-4 py-2" onClick={() => {
      void run(async () => { const result = await explainDocumentEvidence(snapshotId); if (result.status === "STALE") { setSnapshot(null); setSnapshotId(null); } setExplanation(result); });
    }}>근거 설명 확인하기</button>}
    {explanation?.status === "STALE" && <p role="status" className="mt-4">근거가 변경되어 설명을 표시할 수 없어요.</p>}
    {explanation?.explanation && <section className="mt-4 rounded-card border p-4"><h2 className="font-bold">{explanation.status === "AI_SOURCE_BOUND" ? "AI가 선택한 원문 기반 안내" : "원문 기반 안내"}</h2><p className="whitespace-pre-wrap">{explanation.explanation}</p><p className="text-sm">현재 적용 여부와 개인별 자격은 확인되지 않았습니다.</p></section>}
    {evidence.length > 0 && <form onSubmit={submitFollowUp} className="mt-6 space-y-2">
      <label htmlFor="follow-up" className="block font-bold">답변 후 추가 질문</label>
      <textarea id="follow-up" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="block w-full rounded-control border p-3" />
      <p className="text-sm">추가 질문마다 최신 근거를 다시 검색해요. 개인정보는 입력하지 마세요.</p>
      <button disabled={busy || !followUp.trim()} className="rounded-control border px-4 py-2">추가 질문하기</button>
    </form>}
    {snapshotId && !condition && <div className="mt-6 flex flex-wrap gap-3">
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
      : <QuestionFlow key={session.data?.accountId ?? "guest"} authenticated={Boolean(session.data?.authenticated && session.data.accountId)} />}
  </main></div>;
}
