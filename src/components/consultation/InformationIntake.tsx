"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmFinancialTopic, confirmInformationIntake, getInformationIntake, updateInformationIntake } from "@/lib/api/consultation";
import type { FinancialTopic } from "@/lib/api/types";
import { ApiResponseError } from "@/lib/api/errors";
import { useActiveConsultationQuery } from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import { queryKeys } from "@/lib/query/keys";
import { canConfirmIntake, canConfirmTopic, hasUnsavedIntake, hasUnsavedTopicSelection } from "@/lib/consultation/intake-state.mjs";

const labels: Record<string, string> = {
  CARD_LOSS_UNAUTHORIZED_USE: "카드 분실·부정사용",
  VOICE_PHISHING_SUSPICIOUS_TRANSFER: "보이스피싱",
  UNAUTHORIZED_ACCOUNT_TRANSFER: "무단이체",
  PERSONAL_INFO_SMISHING_MALICIOUS_APP: "스미싱·악성앱",
};
const examples = ["카드를 잃어버렸는데 모르는 결제가 있어요.", "보이스피싱인 것 같아서 송금했어요.", "제 계좌에서 제가 하지 않은 이체가 발생했어요.", "이상한 문자 링크를 눌렀어요."];
const topics: Array<{ id: FinancialTopic; label: string; examples: string[] }> = [
  { id: "CARD_PAYMENTS", label: "카드·결제", examples: [examples[0], "모르는 카드 결제가 있어요."] },
  { id: "DEPOSITS_ACCOUNTS", label: "예금·계좌", examples: ["예금자보호 한도가 얼마인가요?", "같은 은행에 통장이 여러 개면 어떻게 되나요?", "다른 은행에 있는 예금은 별도로 보호되나요?", "ISA는 무조건 보호되나요?", "원금과 이자는 어떻게 계산되나요?"] },
  { id: "LOANS_CREDIT", label: "대출·신용", examples: ["대출 중도상환수수료는 어떻게 되나요?", "신용점수는 어떻게 확인하나요?"] },
  { id: "INSURANCE", label: "보험", examples: ["보험금 청구 방법이 궁금해요."] },
  { id: "INVESTMENTS_SECURITIES", label: "투자·증권", examples: ["투자상품 위험을 알고 싶어요."] },
  { id: "FRAUD_SECURITY", label: "금융사기·보안", examples: [examples[1], examples[3]] },
  { id: "CONSUMER_RIGHTS_DISPUTES", label: "금융소비자 권리·분쟁", examples: ["금융소비자 민원과 분쟁조정을 알고 싶어요."] },
];
const topicLabel = (topic: FinancialTopic) => topics.find((item) => item.id === topic)?.label ?? "확인되지 않은 주제";

export default function InformationIntake() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useSessionQuery();
  const active = useActiveConsultationQuery(session.data?.authenticated === true);
  const id = active.data?.consultationId;
  const key = ["information-intake", id] as const;
  const query = useQuery({ queryKey: key, queryFn: () => getInformationIntake(id!), enabled: !!id, retry: false, refetchOnMount: "always" });
  const [draft, setDraft] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState<FinancialTopic | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const state = query.data;
  const text = draft ?? state?.situationText ?? "";
  const selectedTopic = topicDraft === undefined ? state?.selectedTopic ?? null : topicDraft;
  const edited = hasUnsavedIntake(draft, state?.situationText ?? null) || hasUnsavedTopicSelection(topicDraft, state?.selectedTopic ?? null);
  const validRevision = state !== undefined && Number.isSafeInteger(state.caseInputRevision) && state.caseInputRevision >= 0;
  const save = useMutation({ mutationFn: () => updateInformationIntake(id!, text, state!.caseInputRevision, selectedTopic),
    onSuccess: async (value) => {
      client.setQueryData(key, value);
      setDraft(null);
      setTopicDraft(undefined);
      setMessage("");
      await client.invalidateQueries({ queryKey: queryKeys.consultations.followUpRoot(id!) });
      await client.invalidateQueries({ queryKey: queryKeys.consultations.summaryRoot(id!) });
      await client.invalidateQueries({ queryKey: queryKeys.consultations.analysisRoot(id!) });
      await client.invalidateQueries({ queryKey: queryKeys.consultations.reportRoot(id!) });
      await client.invalidateQueries({ queryKey: queryKeys.consultations.active() });
      await client.invalidateQueries({ queryKey: ["information-report", id] });
    },
    onError: async (error) => {
      if (error instanceof ApiResponseError && error.status === 409) {
        setMessage("상담 내용이 변경됐어요. 최신 상태를 확인한 뒤 입력한 내용을 다시 저장해 주세요.");
        await query.refetch();
      } else if (error instanceof ApiResponseError && error.code === "CONSULTATION_SENSITIVE_INPUT") {
        setMessage("개인정보를 제외하고 다시 입력해 주세요. 작성 중인 문장은 그대로 두었어요.");
      } else setMessage(error instanceof ApiResponseError && (error.status === 401 || error.status === 403) ? "인증 또는 요청 권한을 확인해 주세요." : "입력 내용을 저장하지 못했어요. 연결 상태와 입력을 확인해 주세요.");
    },
  });
  const confirmTopic = useMutation({ mutationFn: () => confirmFinancialTopic(id!, state!.topicCandidates[0], state!.caseInputRevision),
    onSuccess: (value) => { client.setQueryData(key, value); setMessage(""); },
    onError: async (error) => {
      if (error instanceof ApiResponseError && error.status === 409) {
        setMessage("상담 내용이 변경됐어요. 최신 주제 후보를 확인한 뒤 다시 선택해 주세요.");
        await query.refetch();
      } else setMessage("주제를 확인하지 못했어요. 인증과 연결 상태를 확인해 주세요.");
    },
  });
  const confirm = useMutation({ mutationFn: () => confirmInformationIntake(id!, state!.scenarioCandidates[0], state!.caseInputRevision),
    onSuccess: async (value) => {
      client.setQueryData(key, value);
      await client.invalidateQueries({ queryKey: queryKeys.consultations.followUpRoot(id!) });
      await client.invalidateQueries({ queryKey: queryKeys.consultations.active() });
      router.push("/consultation/follow-up");
    },
    onError: async (error) => {
      if (error instanceof ApiResponseError && error.status === 409) {
        setMessage("상담 내용이 변경됐어요. 최신 후보를 다시 확인해 주세요.");
        await query.refetch();
      } else setMessage("확인하지 못했어요. 인증과 연결 상태를 확인해 주세요.");
    },
  });

  if (session.isLoading || active.isLoading || (!!id && query.isLoading)) return <p role="status">상담 상태를 확인하고 있어요.</p>;
  if (session.isError || active.isError || query.isError) return <div role="alert"><p>상담을 불러오지 못했어요. 인증과 연결 상태를 확인해 주세요.</p><Link href="/consultation" className="text-primary underline">상담 상태 다시 확인</Link></div>;
  if (!id || !state) return <p>진행 중인 상담이 없어요. <Link href="/consultation" className="text-primary underline">상담 시작</Link></p>;
  if (!validRevision) return <p role="alert">상담의 최신 입력 상태를 확인하지 못했어요. 다시 접속해 주세요.</p>;
  const busy = save.isPending || confirm.isPending || confirmTopic.isPending;
  return <div className="space-y-6 pb-10">
    <header><p className="text-base font-bold text-primary">상담 시작 · 상황 입력</p><h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">어떤 일이 있었나요?</h1><p className="mt-2 leading-7 text-foreground-muted">카테고리를 고르지 않아도 돼요. 겪은 상황을 편하게 적어주세요.</p></header>
    <section className="rounded-card border border-border bg-surface p-5 sm:p-7">
      <p className="font-semibold">질문 주제 살펴보기 · 선택 사항</p><p className="mt-2 text-foreground-muted">주제를 선택하면 예시 질문을 볼 수 있어요. 선택하지 않고 자유롭게 입력해도 됩니다.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="질문 주제">
        {topics.map((topic) => <button key={topic.id} type="button" aria-pressed={selectedTopic === topic.id} onClick={() => { setTopicDraft(selectedTopic === topic.id ? null : topic.id); setMessage(""); }} className={`min-h-12 rounded-control border px-4 py-2 text-base font-semibold focus-visible:ring-2 focus-visible:ring-focus ${selectedTopic === topic.id ? "border-primary bg-primary-subtle text-primary" : "border-border bg-background text-foreground"}`}>{topic.label}</button>)}
      </div>
      <p className="mt-2 text-sm text-foreground-muted">주제 선택은 분류 힌트예요. 실제 질문과 다르면 다시 확인하며, 자료 제공 범위는 별도로 검증합니다.</p>
      <label htmlFor="situation" className="mt-6 block text-lg font-bold">상황 입력</label>
      <p id="situation-privacy" className="mt-2 rounded-control bg-surface-subtle px-4 py-3 text-base leading-7 text-foreground-muted">이름·계좌번호·인증번호는 적지 마세요.</p>
      <textarea id="situation" aria-describedby="situation-privacy" value={text} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={5} className="mt-3 w-full rounded-control border border-border bg-background p-4 text-base leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      <p className="mt-4 font-semibold text-foreground">입력이 막막하다면 예시를 선택해 보세요.</p><div className="mt-2 flex flex-wrap gap-2">{(topics.find((topic) => topic.id === selectedTopic)?.examples ?? examples).map((example) => <button key={example} type="button" onClick={() => { setDraft(example); setMessage(""); }} className="min-h-12 max-w-full rounded-control border border-border px-4 py-2 text-left text-base leading-6 break-keep focus-visible:ring-2 focus-visible:ring-focus">{example}</button>)}</div>
      <button type="button" disabled={busy || !text.trim() || text.length > 1000} onClick={() => save.mutate()} className="mt-5 min-h-12 rounded-control bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">{save.isPending ? "확인 중…" : "입력 내용 확인"}</button>
    </section>
    {message ? <p role="alert">{message}</p> : null}
    {!edited && state.situationText ? <section className="rounded-card border border-primary/30 bg-primary-subtle p-5 sm:p-7" aria-live="polite"><h2 className="mb-3 text-lg font-bold text-foreground">다음 단계 · 상담 주제 확인</h2>
      {!edited && canConfirmIntake(state, draft) ? <><p>입력하신 내용이 다음 주제에 가까운가요?</p><p className="mt-2 font-bold">{labels[state.scenarioCandidates[0]] ?? "확인되지 않은 주제"}</p><p className="mt-2 text-sm text-foreground-muted">주제는 공식 근거의 적용이나 피해 사실을 확정하지 않아요.</p><button type="button" disabled={busy || !labels[state.scenarioCandidates[0]]} onClick={() => confirm.mutate()} className="mt-4 min-h-12 rounded-control bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">맞아요, 계속하기</button></> : null}
      {state.routingStatus === "TOPIC_MISMATCH_CONFIRMATION_REQUIRED" ? <p className="mt-3">선택한 주제와 실제 질문이 달라 보여요. 질문에 가까운 주제를 확인해 주세요.</p> : null}
      {canConfirmTopic(state, draft, topicDraft) ? <><p className="mt-3">질문에 가까운 금융 주제를 확인해 주세요.</p><p className="mt-2 font-bold">{topicLabel(state.topicCandidates[0])}</p><p className="mt-2 text-sm text-foreground-muted">주제 확인은 공식 자료의 적용이나 답변 가능 여부를 확정하지 않아요.</p><button type="button" disabled={busy} onClick={() => confirmTopic.mutate()} className="mt-4 min-h-12 rounded-control bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">이 주제 확인하기</button></> : null}
      {state.routingStatus === "EMERGENCY_RECOMMENDED" ? <p className="mt-3">긴급한 상황일 수 있어요. <Link href="/emergency/type" className="font-bold text-primary underline">긴급 안내 확인하기</Link></p> : null}
      {state.status === "NEEDS_CLARIFICATION" ? <p>상황을 구분하기 위해 내용을 조금 더 자세히 적어주세요.</p> : null}
      {state.status === "MULTIPLE_TOPICS" ? <p>여러 금융 주제가 함께 보여요. 먼저 알고 싶은 내용을 하나로 좁혀 다시 적어주세요.</p> : null}
      {state.status === "OUT_OF_SCOPE_NON_FINANCIAL" ? <p>금융 관련 질문으로 확인되지 않았어요. 금융 상황이나 제도에 관한 질문을 적어주세요.</p> : null}
      {state.status === "INPUT_NOT_UNDERSTOOD" ? <p>질문의 뜻을 확인하기 어려워요. 궁금한 금융 상황을 문장으로 조금 더 자세히 적어주세요.</p> : null}
      {state.status === "UNSUPPORTED_FINANCIAL_TOPIC" ? <p>금융 관련 질문이지만 현재 안내할 수 있는 범위가 아니에요. 다른 질문을 입력하거나 공식 기관 자료를 확인해 주세요.</p> : null}
      {state.status === "TOPIC_CONFIRMED_NO_SEARCH" && !state.generalInformationSearchAvailable ? <p>주제를 확인했어요. 이 일반 금융정보 주제의 공식 근거 검색과 Report는 아직 제공하지 않아요.</p> : null}
      {state.status === "TOPIC_CONFIRMED_SEARCH_AVAILABLE" && state.confirmedTopic === "DEPOSITS_ACCOUNTS" && state.generalInformationSearchAvailable ? <><p>예금자보호 관련 검토 자료를 검색할 수 있어요. 질문에 맞는 근거가 충분한지는 결과에서 다시 확인합니다.</p><Link href="/consultation/information" className="mt-3 inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-bold text-primary-foreground focus-visible:ring-2 focus-visible:ring-focus">공식 정보 확인하기</Link></> : null}
      {state.status === "UNSUPPORTED_SCOPE" ? <p>현재 확인할 수 있는 자료의 범위를 벗어난 상황이에요. 내용을 수정하거나 공식 기관에 직접 확인해 주세요.</p> : null}
      {state.status === "READY" ? <Link href="/consultation/follow-up" className="inline-flex min-h-12 items-center font-bold text-primary underline">추가 질문으로 계속하기</Link> : null}
    </section> : null}
    {edited ? <p className="text-sm text-foreground-muted">수정한 내용을 저장하면 주제를 다시 확인해요.</p> : null}
    <Link href="/consultation/problem-category" className="inline-flex min-h-12 items-center text-primary underline">원하면 주제를 직접 선택하기</Link>
  </div>;
}
