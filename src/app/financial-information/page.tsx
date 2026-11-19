"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSessionQuery } from "@/lib/query/session";
import {
  createEvidenceReport, explainDocumentEvidence, getEvidenceReport, getEvidenceSnapshot, getExplanationQuota, getInformationTopics, searchDocumentEvidence,
  type EvidenceReport, type ExplanationQuota, type ClarificationOption, type ClarificationSelection,
} from "@/lib/api/document-evidence";
import { clarificationCondition, visibleReport, visibleSnapshot } from "@/lib/financial-information/document-evidence-state.mjs";

import { useInformationFlow } from "@/lib/financial-information/information-flow";


function QuestionFlow({ authenticated }: { authenticated: boolean }) {
  const flow = useInformationFlow();
  const { question, submitted, snapshot, busy, error, condition, explanation, setExplanation } = flow;
  const setQuestion = flow.setQuestion;
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const quotaKey = `${authenticated}:${snapshotId ?? ""}`;
  const [quotaState, setQuotaState] = useState<{ key: string; value: ExplanationQuota | null }>({ key: "", value: null });
  const quota = quotaState.key === quotaKey ? quotaState.value : null;
  const quotaLoading = authenticated && quotaState.key !== quotaKey;
  const [explanationError, setExplanationError] = useState("");
  const explaining = useRef(false);
  useEffect(() => {
    let live = true;
    if (authenticated) void getExplanationQuota(snapshotId ?? undefined).then((value) => { if (live) setQuotaState({ key: quotaKey, value }); }).catch(() => { if (live) setQuotaState({ key: quotaKey, value: null }); });
    return () => { live = false; };
  }, [authenticated, snapshotId, quotaKey]);
  const [clarification, setClarification] = useState("");
  const [retryQuestion, setRetryQuestion] = useState("");
  const [retrySelection, setRetrySelection] = useState<ClarificationSelection | undefined>();
  const [topics, setTopics] = useState<string[]>([]);
  const [example, setExample] = useState("");
  useEffect(() => { let live = true; void getInformationTopics().then(value => { if (live) setTopics(value); }).catch(() => { if (live) setTopics([]); }); return () => { live = false; }; }, []);
  const [applicabilityUncertain, setApplicabilityUncertain] = useState(false);

  useEffect(() => { useInformationFlow.getState().reset(); return () => useInformationFlow.getState().reset(); }, []);
  async function search(input: string, selection?: ClarificationSelection) {
    const id = useInformationFlow.getState().begin();
    useInformationFlow.setState({ snapshot: null });
    setRetryQuestion(input);
    setRetrySelection(selection);
    setReport(null); setReportId(null); setExplanation(null);
    try {
      const result = await searchDocumentEvidence(input, selection);
      if (useInformationFlow.getState().requestId !== id) return;
      const missing = result.status === "READY_CANDIDATES" ? clarificationCondition(input, visibleSnapshot(result))
        : result.status === "NEEDS_CLARIFICATION" ? "어떤 금융정보와 내용이 궁금한지 더 알려 주세요." : null;
      setSnapshotId(result.snapshotId); setApplicabilityUncertain(false);
      useInformationFlow.getState().finish(id, result, input, missing);
    } catch { useInformationFlow.getState().fail(id); }
  }
  async function run(action: (id: number) => Promise<void>) {
    const id = useInformationFlow.getState().begin();
    try { await action(id); }
    catch { useInformationFlow.getState().fail(id); return; }
    if (useInformationFlow.getState().requestId === id) useInformationFlow.setState({ busy: false });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || busy) return;
    setSnapshotId(null); setClarification(""); void search(question.trim());
  }
  function clarify(event: FormEvent) {
    event.preventDefault();
    if (!clarification.trim() || busy) return;
    const current = useInformationFlow.getState();
    const context = current.steps.filter(step => (step.snapshot?.options?.length ?? 0) > 0).map(step => step.answer).join(" ");
    const combined = current.answer(clarification);
    const query = context ? `${current.submitted} ${context} ${clarification.trim()}` : combined;
    setClarification(""); void search(query);
  }
  function chooseOption(option: ClarificationOption) {
    if (busy) return;
    const question = useInformationFlow.getState().submitted;
    useInformationFlow.getState().answer(option.label);
    setClarification(""); void search(question, { title: option.title, purpose: option.purpose });
  }
  function recheckCurrent() {
    const current = useInformationFlow.getState();
    const title = current.snapshot?.options?.find(option => option.purpose)?.title;
    void search(current.submitted, title ? { title } : undefined);
  }
  function goPrevious() { setClarification(""); flow.previous(); recheckCurrent(); }
  function finishFlow() {
    useInformationFlow.getState().reset(); setSnapshotId(null); setReportId(null); setReport(null);
    setExplanation(null); setExplanationError(""); setClarification(""); setRetryQuestion(""); setRetrySelection(undefined); setExample(""); setApplicabilityUncertain(false);
  }
  const reportContent = flow.stage === "result" ? visibleReport(report) : null;
  const evidence = flow.stage === "result" ? visibleSnapshot(snapshot) : [];
  return <>
    {flow.stage === "input" && <form onSubmit={submit} className="mt-6 space-y-3">
      <label htmlFor="question" className="block font-bold">금융 정보에 관해 질문해 주세요</label>
      <p className="text-sm text-foreground-muted">이름, 연락처, 계좌번호 등 개인정보는 입력하지 마세요.</p>
      <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4}
        className="w-full rounded-control border border-border bg-surface p-3" placeholder={example || "궁금한 내용을 자유롭게 입력하세요"} required />
      {topics.length > 0 && <div><p className="text-sm font-semibold">현재 답변 가능한 문서 주제</p><div className="mt-2 flex gap-2 overflow-x-auto">{topics.map(topic => <button key={topic} type="button" className="shrink-0 rounded-full border px-4 py-2" onClick={() => setExample(`${topic}에 대해 알려 주세요`)}>{topic}</button>)}</div></div>}
      <button type="submit" disabled={busy || !question.trim()} className="rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">금융정보 확인하기</button>
      <button type="button" className="ml-3 rounded-control border px-4 py-3" onClick={finishFlow}>종료하기</button>
    </form>}
    {busy && <p role="status" className="mt-4">최신 근거를 확인하고 있어요.</p>}
    {error && <p role="alert" className="mt-4">{error}</p>}
    {error && retryQuestion && <button type="button" disabled={busy} className="mt-3 rounded-control border px-4 py-2" onClick={() => void search(retryQuestion, retrySelection)}>다시 시도</button>}
    {flow.stage === "clarification" && condition && !busy && !error && <form onSubmit={clarify} className="mt-6 space-y-3 rounded-card border border-border p-4">
      <h2 className="font-bold">답변 전 확인할 내용</h2>
      <p>처음 질문: {question}</p>
      {flow.steps.map((step, index) => <p key={index} className="text-sm">이전 선택: {step.answer}</p>)}
      <p>{snapshot?.status === "NEEDS_CLARIFICATION" ? (snapshot.options?.some(option => option.purpose) ? "어떤 내용이 궁금하세요?" : "어떤 금융정보가 궁금하세요?") : `문서에 다음 조건이 있어요: ${condition}`}</p>
      <p>질문에 필요한 범위에서 알려 주세요. 개인정보는 입력하지 마세요. 확인해도 개인별 자격을 확정하지 않습니다.</p>
      {(snapshot?.options?.length ?? 0) > 0 && <div className="space-y-2"><p className="font-semibold">궁금한 내용과 가까운 것을 선택해 주세요.</p>{snapshot?.options?.map((option, index) => <button key={`${option.title}-${option.purpose}-${index}`} type="button" disabled={busy} className="block w-full rounded-control border p-3 text-left" onClick={() => chooseOption(option)}>{option.label}</button>)}</div>}
      <label htmlFor="clarification">확인 답변</label><textarea id="clarification" value={clarification} onChange={(e) => setClarification(e.target.value)} className="block w-full border p-2" />
      <button disabled={busy || !clarification.trim()} className="rounded-control bg-primary px-4 py-2 text-primary-foreground">확인 후 다시 검색</button>
      <button type="button" disabled={busy} className="ml-3 rounded-control border px-4 py-2" onClick={() => flow.stop()}>해당하는 항목 없음</button>
      {flow.steps.length > 0 && <button type="button" disabled={busy} className="rounded-control border px-4 py-2" onClick={goPrevious}>이전 질문</button>}
    </form>}
    {flow.stage === "stop" && snapshot?.status === "NO_MATCH" && <p role="status" className="mt-6">관련된 승인 근거를 찾지 못했어요. 종료 후 새로운 질문을 시작할 수 있어요.</p>}
    {flow.stage === "stop" && snapshot?.status === "READY_CANDIDATES" && <p role="status" className="mt-6">해당하는 내용을 확인하지 못했어요. 이전 선택을 바꾸거나 종료할 수 있어요.</p>}
    {flow.stage === "stop" && snapshot && snapshot.status !== "READY_CANDIDATES" && snapshot.status !== "NO_MATCH" && <p role="status" className="mt-6">{snapshot.status === "STALE" ? "근거를 다시 확인해야 해요. 새로 검색해 주세요." : snapshot.status === "NEEDS_CLARIFICATION" ? "어떤 상품이나 내용이 궁금한지 조금 더 알려 주세요." : snapshot.status === "TEMPORARILY_UNAVAILABLE" ? "검색을 일시적으로 사용할 수 없어요. 잠시 후 다시 시도해 주세요." : "현재 확인할 수 있는 근거가 없어요."}</p>}
    {flow.stage === "result" && (snapshot?.status === "STALE" || explanation?.status === "STALE") && <p role="status" className="mt-6">근거가 변경되어 내용을 표시할 수 없어요. 종료하고 다시 검색해 주세요.</p>}
    {applicabilityUncertain && <p role="status" className="mt-4">입력한 내용만으로 개인별 적용 여부를 확인할 수 없어요. 아래 문서의 조건과 예외를 확인해 주세요.</p>}
    {evidence.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-xl font-bold">질문과 확인된 공식 정보</h2>
      <div className="rounded-card bg-surface p-4"><h3 className="font-bold">확인한 질문</h3><p className="mt-1 whitespace-pre-wrap">{submitted || question}</p>
        {flow.steps.length > 0 && <ul className="mt-2 space-y-1 text-sm text-foreground-muted">{flow.steps.map((step, index) => <li key={index}>선택한 내용: {step.answer}</li>)}</ul>}
      </div>
      <p className="text-sm text-foreground-muted">문서의 내용을 보여드려요. 여러 상품을 함께 안내하는 일반 절차일 수 있으므로 질문한 상품의 적용 여부와 현재 효력은 별도 확인이 필요해요.</p>
      {/(비교|차이|다른\s*점)/.test(submitted) && <p role="status">각 문서에서 확인된 내용을 구분해 보여드려요. 문서에서 직접 확인되지 않은 차이는 확정할 수 없어요.</p>}
      {(snapshot?.missingPurposes?.length ?? 0) > 0 && <p role="status">질문 중 {snapshot?.missingPurposes?.join(", ")}에 대해서는 확인된 근거를 찾지 못했어요.</p>}
      <EvidenceList evidence={evidence} />
    </section>}
    {evidence.length > 0 && <section className="mt-6 space-y-3 rounded-card border border-border bg-surface p-5"><h2 className="text-xl font-bold">AI 쉬운 설명</h2>
    {!authenticated && <p>AI 쉬운 설명은 제공 시 로그인한 사용자만 요청할 수 있어요. 위 공식 근거는 로그인 없이 확인할 수 있어요. <a href="/auth/login" className="font-semibold text-primary underline">로그인하기</a></p>}
    {authenticated && !quota && <p role="status">{quotaLoading ? "AI 이용 상태를 확인하고 있어요." : "AI 이용 상태를 확인하지 못했어요. 위 공식 근거는 계속 확인할 수 있어요."}</p>}
    {authenticated && quota && <p className="text-sm">남은 횟수: {quota.remaining}/{quota.limit}회 (한국 시간 자정 초기화)</p>}
    {authenticated && quota && !quota.available && <p role="status">{quota.reason === "RIGHTS_UNAVAILABLE" ? "이 근거의 외부 AI 전송 권한 또는 자격을 확인할 수 없어요." : quota.reason === "PROVIDER_UNAVAILABLE" ? "AI 서비스를 현재 사용할 수 없어요." : quota.reason === "EVIDENCE_STALE" ? "근거가 변경되어 AI 설명을 요청할 수 없어요." : "AI 쉬운 설명은 현재 비활성 상태예요."} 위 공식 근거를 확인해 주세요.</p>}
    {authenticated && quota?.available && quota.remaining === 0 && <p role="status">오늘의 AI 이용 횟수를 모두 사용했어요. 공식 근거 검색은 계속 이용할 수 있어요.</p>}
    {authenticated && evidence.length > 0 && snapshotId && quota?.available && quota.remaining > 0 && <button disabled={busy} className="rounded-control border px-4 py-2 disabled:opacity-50" onClick={() => {
      if (explaining.current) return;
      explaining.current = true; const id = useInformationFlow.getState().begin(); setExplanationError("");
      const requestId = crypto.randomUUID();
      void (async () => {
        try {
          const result = await explainDocumentEvidence(snapshotId, requestId, submitted);
          if (useInformationFlow.getState().requestId !== id) return;
          if (result.status === "STALE") { useInformationFlow.setState({ snapshot: null }); setSnapshotId(null); }
          setExplanation(result);
        } catch { if (useInformationFlow.getState().requestId === id) setExplanationError("설명을 불러오지 못했습니다. 위 공식 근거는 계속 확인할 수 있어요."); }
        finally {
          try { const value = await getExplanationQuota(snapshotId); if (useInformationFlow.getState().requestId === id) setQuotaState({ key: quotaKey, value }); } catch { /* Keep the last known quota. */ }
          explaining.current = false; if (useInformationFlow.getState().requestId === id) useInformationFlow.setState({ busy: false });
        }
      })();
    }}>{busy ? "AI 설명을 확인하고 있어요..." : "AI 쉬운 설명 요청"}</button>}
    {explanationError && <p role="alert">{explanationError}</p>}
    {explanation?.status === "STALE" && <p role="status" className="mt-4">근거가 변경되어 설명을 표시할 수 없어요.</p>}
    {explanation?.status === "FALLBACK" && <p role="status">{explanation.reason === "FEATURE_DISABLED" ? "AI 쉬운 설명은 현재 비활성 상태예요." : explanation.reason === "RIGHTS_UNAVAILABLE" || explanation.reason === "RIGHTS_OR_STATE_CHANGED" ? "외부 AI 전송 권한 또는 근거 자격을 확인할 수 없어요." : explanation.reason === "QUOTA_EXHAUSTED" ? "오늘의 AI 이용 횟수를 모두 사용했어요." : explanation.reason === "REQUEST_LIMIT" ? "요청이 이미 진행 중이거나 잠시 요청이 제한됐어요." : explanation.reason === "VALIDATION_FAILED" ? "생성된 설명을 검증하지 못했어요." : explanation.reason === "PROVIDER_UNAVAILABLE" || explanation.reason === "PROVIDER_ERROR" ? "AI 서비스 오류로 설명을 제공하지 못했어요." : "AI 설명을 생성하거나 확인하지 못했어요."} 이용 횟수는 차감되지 않았으며 위 공식 근거를 확인해 주세요.</p>}
    {explanation?.status === "AI_EXPLANATION" && explanation.explanation && <div className="rounded-control bg-background p-4"><h3 className="font-bold">AI가 만든 쉬운 설명</h3><p className="mt-2 whitespace-pre-wrap leading-7">{explanation.explanation}</p><p className="mt-2 text-sm">AI 설명에는 오류가 있을 수 있어요. 위 공식 원문과 조건·예외를 확인해 주세요.</p></div>}
    {explanation?.status === "AI_SOURCE_BOUND" && <p>AI 설명을 제공하지 못해 위 공식 원문을 안내해 드려요.</p>}
    </section>}
    {flow.stage === "result" && snapshotId && !condition && <div className="mt-6 flex flex-wrap gap-3">
      <button disabled={busy} className="rounded-control border border-border px-4 py-3 font-semibold" onClick={() => { setReport(null); void run(async id => { const result = await getEvidenceSnapshot(snapshotId); if (useInformationFlow.getState().requestId === id) useInformationFlow.setState({ snapshot: result.status === "READY_CANDIDATES" ? { ...result, missingPurposes: snapshot?.missingPurposes ?? result.missingPurposes } : result }); }); }}>저장된 근거 다시 확인</button>
      {snapshot?.status === "READY_CANDIDATES" && <button disabled={busy} className="rounded-control bg-primary px-4 py-3 font-bold text-primary-foreground" onClick={() => { setReport(null); void run(async id => { const value = await createEvidenceReport(snapshotId, submitted); if (useInformationFlow.getState().requestId === id) { setReport(value); setReportId(value.reportId); } }); }}>결과 저장하기</button>}
    </div>}
    {flow.stage === "result" && reportId && <button disabled={busy} className="mt-4 rounded-control border border-border px-4 py-3 font-semibold" onClick={() => { setReport(null); void run(async id => { const value = await getEvidenceReport(reportId); if (useInformationFlow.getState().requestId === id) setReport(value); }); }}>저장된 결과 다시 확인</button>}
    {flow.stage === "stop" && <div className="mt-4 flex gap-3">{condition && <button type="button" disabled={busy} className="rounded-control border px-4 py-2" onClick={() => { flow.resume(); recheckCurrent(); }}>현재 선택 변경</button>}{flow.steps.length > 0 && <button type="button" disabled={busy} className="rounded-control border px-4 py-2" onClick={goPrevious}>이전 질문</button>}</div>}
    {flow.stage === "result" && flow.steps.length > 0 && <button type="button" disabled={busy} className="mt-6 rounded-control border px-4 py-2" onClick={goPrevious}>이전 질문</button>}
    {flow.stage !== "input" && <button type="button" className="mt-6 rounded-control border px-4 py-2" onClick={finishFlow}>종료하고 새로 시작하기</button>}
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
