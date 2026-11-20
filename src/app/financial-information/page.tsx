"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSessionQuery } from "@/lib/query/session";
import {
  createEvidenceReport, explainDocumentEvidence, getExplanationQuota, getInformationTopics, searchDocumentEvidence,
  type ExplanationQuota, type ClarificationOption, type ClarificationSelection,
} from "@/lib/api/document-evidence";
import { clarificationCondition, visibleSnapshot } from "@/lib/financial-information/document-evidence-state.mjs";

import { useInformationFlow } from "@/lib/financial-information/information-flow";


function QuestionFlow({ authenticated }: { authenticated: boolean }) {
  const flow = useInformationFlow();
  const { question, submitted, snapshot, busy, error, condition, explanation, setExplanation } = flow;
  const setQuestion = flow.setQuestion;
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const { saved, setSaved } = flow;
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
  const [showResult, setShowResult] = useState(false);
  const [retryQuestion, setRetryQuestion] = useState("");
  const [retrySelection, setRetrySelection] = useState<ClarificationSelection | undefined>();
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsStatus, setTopicsStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => { let live = true; void getInformationTopics().then(value => { if (live) { setTopics(value); setTopicsStatus("ready"); } }).catch(() => { if (live) setTopicsStatus("error"); }); return () => { live = false; }; }, []);
  const [applicabilityUncertain, setApplicabilityUncertain] = useState(false);

  useEffect(() => { useInformationFlow.getState().reset(); return () => useInformationFlow.getState().reset(); }, []);
  async function search(input: string, selection?: ClarificationSelection) {
    const id = useInformationFlow.getState().begin();
    setShowResult(!selection && useInformationFlow.getState().steps.length === 0);
    useInformationFlow.setState({ snapshot: null });
    setRetryQuestion(input);
    setRetrySelection(selection);
    setSaved(false); setExplanation(null);
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
    setSnapshotId(null); void search(question.trim());
  }
  function chooseOption(option: ClarificationOption) {
    if (busy) return;
    const question = useInformationFlow.getState().submitted;
    useInformationFlow.getState().answer(option.label);
    void search(question, { title: option.title, purpose: option.purpose });
  }
  function changeAnswer(index: number, option: ClarificationOption) {
    if (busy) return;
    useInformationFlow.getState().revisit(index);
    setSnapshotId(null); setSaved(false); setShowResult(false);
    chooseOption(option);
  }
  const evidence = flow.stage === "result" && showResult ? visibleSnapshot(snapshot) : [];
  return <>
    {flow.stage === "input" && <form onSubmit={submit} className="mt-6 space-y-3">
      <label htmlFor="question" className="sr-only">금융정보 질문</label>
      <p className="text-center text-sm text-foreground-muted">이름, 연락처, 계좌번호 등 개인정보는 입력하지 마세요.</p>
      <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={7}
        className="min-h-56 w-full rounded-control border border-border bg-surface p-4 text-left" placeholder="궁금한 내용을 자유롭게 입력하세요" required />
      <div><p className="text-center text-sm font-semibold">현재 답변 가능한 문서 주제</p>
        {topicsStatus === "loading" && <p role="status" className="text-center text-sm">주제를 불러오고 있어요.</p>}
        {topicsStatus === "error" && <p role="status" className="text-center text-sm">주제를 불러오지 못했어요. 질문을 직접 입력할 수 있어요.</p>}
        {topicsStatus === "ready" && topics.length === 0 && <p className="text-center text-sm">현재 표시할 주제가 없어요.</p>}
        {topics.length > 0 && <div className="topic-scroll mt-2 flex gap-3 overflow-x-auto">{topics.map(topic => <button key={topic} type="button" className="shrink-0 rounded-control bg-primary-subtle px-4 py-2 font-semibold text-primary" onClick={() => setQuestion(`${topic}에 대해 알려 주세요`)}>{topic}</button>)}</div>}
      </div>
      <div className="flex justify-end"><button type="submit" disabled={busy || !question.trim()} className="rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">금융정보 확인하기</button></div>
    </form>}
    {busy && <p role="status" className="mt-4">최신 근거를 확인하고 있어요.</p>}
    {error && <p role="alert" className="mt-4">{error}</p>}
    {error && retryQuestion && <button type="button" disabled={busy} className="mt-3 rounded-control border px-4 py-2" onClick={() => void search(retryQuestion, retrySelection)}>다시 시도</button>}
    {flow.stage !== "input" && !(flow.stage === "result" && showResult) && <section className="mt-6 space-y-4" aria-label="질문 대화">
      <p className="text-center font-semibold">{question}</p>
      {flow.steps.map((step, index) => <div key={index} className="space-y-3">
        <div className="mr-auto max-w-[90%] rounded-card bg-surface p-4 shadow-card"><p className="font-bold">{step.snapshot?.options?.some(option => option.purpose) ? "어떤 내용이 궁금하세요?" : "어떤 금융정보가 궁금하세요?"}</p>
          <div className="mt-3 flex flex-wrap gap-3">{step.snapshot?.options?.map((option, optionIndex) => <button key={`${option.title}-${option.purpose}-${optionIndex}`} type="button" disabled={busy} className="rounded-control border border-border bg-background px-4 py-2 text-left" onClick={() => changeAnswer(index, option)}>{option.label}</button>)}</div>
        </div>
        <p className="ml-auto max-w-[85%] rounded-card bg-primary-subtle px-4 py-3 text-right font-semibold text-primary">{step.answer}</p>
      </div>)}
      {(flow.stage === "clarification" || flow.stage === "stop") && condition && snapshot && <div className="mr-auto max-w-[90%] rounded-card bg-surface p-4 shadow-card">
        <p className="font-bold">{snapshot.status === "NEEDS_CLARIFICATION" ? (snapshot.options?.some(option => option.purpose) ? "어떤 내용이 궁금하세요?" : "어떤 금융정보가 궁금하세요?") : `문서에 다음 조건이 있어요: ${condition}`}</p>
        <div className="mt-3 flex flex-wrap gap-3">{snapshot.options?.map((option, index) => <button key={`${option.title}-${option.purpose}-${index}`} type="button" disabled={busy} className="rounded-control border border-border bg-background px-4 py-2 text-left" onClick={() => chooseOption(option)}>{option.label}</button>)}
          {snapshot.status === "READY_CANDIDATES" && <button type="button" disabled={busy} className="rounded-control border border-border bg-background px-4 py-2" onClick={() => { setApplicabilityUncertain(true); setShowResult(true); useInformationFlow.setState({ stage: "result", condition: null }); }}>확인된 정보 보기</button>}
          <button type="button" disabled={busy} className="rounded-control border border-border bg-background px-4 py-2" onClick={() => flow.stop()}>해당하는 항목 없음</button>
        </div></div>}
      {flow.stage === "stop" && <p role="status" className="text-center">확인할 수 있는 정보를 찾지 못했어요. 이전 선택을 바꾸거나 메인에서 새 질문을 시작해 주세요.</p>}
      {flow.stage === "result" && !showResult && <div className="mr-auto rounded-card bg-surface p-4"><button type="button" className="font-bold text-primary underline" onClick={() => setShowResult(true)}>결과 확인하기</button></div>}
    </section>}
    {flow.stage === "result" && (snapshot?.status === "STALE" || explanation?.status === "STALE") && <p role="status" className="mt-6">근거가 변경되어 내용을 표시할 수 없어요. 종료하고 다시 검색해 주세요.</p>}
    {applicabilityUncertain && <p role="status" className="mt-4">입력한 내용만으로 개인별 적용 여부를 확인할 수 없어요. 아래 문서의 조건과 예외를 확인해 주세요.</p>}
    {evidence.length > 0 && <section className="mt-8 space-y-4"><h2 className="text-center text-xl font-bold">질문과 확인된 공식 정보</h2>
      <div className="rounded-card bg-surface p-4 text-center"><h3 className="font-bold">확인한 질문</h3><p className="mt-1 whitespace-pre-wrap">{submitted || question}</p>
        {flow.steps.length > 0 && <ul className="mt-2 space-y-1 text-sm text-foreground-muted">{flow.steps.map((step, index) => <li key={index}>선택한 내용: {step.answer}</li>)}</ul>}
      </div>
      <p className="text-center text-sm text-foreground-muted">문서의 내용을 보여드려요. 여러 상품을 함께 안내하는 일반 절차일 수 있으므로 질문한 상품의 적용 여부와 현재 효력은 별도 확인이 필요해요.</p>
      {/(비교|차이|다른\s*점)/.test(submitted) && <p role="status">각 문서에서 확인된 내용을 구분해 보여드려요. 문서에서 직접 확인되지 않은 차이는 확정할 수 없어요.</p>}
      {(snapshot?.missingPurposes?.length ?? 0) > 0 && <p role="status">질문 중 {snapshot?.missingPurposes?.join(", ")}에 대해서는 확인된 근거를 찾지 못했어요.</p>}
      <EvidenceList evidence={evidence} />
    </section>}
    {evidence.length > 0 && <section className="mt-6 space-y-3 rounded-card border border-border bg-surface p-5 text-center"><h2 className="text-xl font-bold">AI 쉬운 설명</h2>
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
    {explanation?.status === "AI_EXPLANATION" && explanation.explanation && <div className="rounded-control bg-background p-4 text-left"><h3 className="font-bold">AI가 만든 쉬운 설명</h3><p className="mt-2 whitespace-pre-wrap leading-7">{explanation.explanation}</p><p className="mt-2 text-sm">AI 설명에는 오류가 있을 수 있어요. 위 공식 원문과 조건·예외를 확인해 주세요.</p></div>}
    {explanation?.status === "AI_SOURCE_BOUND" && <p>AI 설명을 제공하지 못해 위 공식 원문을 안내해 드려요.</p>}
    </section>}
    {flow.stage === "result" && showResult && <div className="mt-6 flex flex-wrap justify-end gap-3">
      {authenticated && snapshotId && snapshot?.status === "READY_CANDIDATES" && <button disabled={busy || saved} className="rounded-control bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50" onClick={() => { if (saved || busy) return; void run(async id => { await createEvidenceReport(snapshotId, submitted); if (useInformationFlow.getState().requestId === id) setSaved(true); }); }}>{saved ? "결과 저장 완료" : busy ? "저장 중..." : "결과 저장하기"}</button>}
      <Link href="/" className="inline-flex min-h-11 items-center rounded-control border border-border px-4 py-3 font-semibold" onClick={event => { if (!saved && !window.confirm("진행 중인 질문을 종료할까요?")) event.preventDefault(); }}>메인으로 돌아가기</Link>
    </div>}
    {saved && <p role="status" className="mt-3 text-right text-sm text-primary">저장했어요. 상담 기록에서 다시 확인할 수 있어요.</p>}
  </>;
}

export default function FinancialInformationPage() {
  const session = useSessionQuery();
  const hasQuestion = useInformationFlow(state => !state.saved && Boolean(state.question.trim() || state.submitted));
  return <div className="min-h-dvh bg-background"><AppHeader logoOnly confirmLeave={hasQuestion} /><main className="mx-auto max-w-3xl px-5 py-10">
    <h1 className="text-center text-3xl font-bold">금융정보 질문하기</h1>
    {session.isPending ? <p role="status" className="mt-6">로그인 상태를 확인하고 있어요.</p>
      : session.isError ? <p role="alert" className="mt-6">로그인 상태를 확인하지 못했어요. 다시 접속해 주세요.</p>
      : <QuestionFlow key={session.data?.accountId ?? "guest"} authenticated={Boolean(session.data?.authenticated && session.data.accountId)} />}
  </main></div>;
}
