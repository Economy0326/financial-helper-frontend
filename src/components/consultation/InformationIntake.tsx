"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmInformationIntake, getInformationIntake, updateInformationIntake } from "@/lib/api/consultation";
import { ApiResponseError } from "@/lib/api/errors";
import { useActiveConsultationQuery } from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import { queryKeys } from "@/lib/query/keys";
import { canConfirmIntake, hasUnsavedIntake } from "@/lib/consultation/intake-state.mjs";

const labels: Record<string, string> = {
  CARD_LOSS_UNAUTHORIZED_USE: "카드 분실·부정사용",
  VOICE_PHISHING_SUSPICIOUS_TRANSFER: "보이스피싱",
  UNAUTHORIZED_ACCOUNT_TRANSFER: "무단이체",
  PERSONAL_INFO_SMISHING_MALICIOUS_APP: "스미싱·악성앱",
};
const examples = ["카드를 잃어버렸는데 모르는 결제가 있어요.", "보이스피싱인 것 같아서 송금했어요.", "제 계좌에서 제가 하지 않은 이체가 발생했어요.", "이상한 문자 링크를 눌렀어요."];

export default function InformationIntake() {
  const router = useRouter();
  const client = useQueryClient();
  const session = useSessionQuery();
  const active = useActiveConsultationQuery(session.data?.authenticated === true);
  const id = active.data?.consultationId;
  const key = ["information-intake", id] as const;
  const query = useQuery({ queryKey: key, queryFn: () => getInformationIntake(id!), enabled: !!id, retry: false, refetchOnMount: "always" });
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const state = query.data;
  const text = draft ?? state?.situationText ?? "";
  const edited = hasUnsavedIntake(draft, state?.situationText ?? null);
  const validRevision = state !== undefined && Number.isSafeInteger(state.caseInputRevision) && state.caseInputRevision >= 0;
  const save = useMutation({ mutationFn: () => updateInformationIntake(id!, text, state!.caseInputRevision),
    onSuccess: async (value) => {
      client.setQueryData(key, value);
      setDraft(null);
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
      } else setMessage(error instanceof ApiResponseError && (error.status === 401 || error.status === 403) ? "인증 또는 요청 권한을 확인해 주세요." : "입력 내용을 저장하지 못했어요. 연결 상태와 입력을 확인해 주세요.");
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
  const busy = save.isPending || confirm.isPending;
  return <div className="space-y-6 pb-10">
    <header><h1 className="text-2xl font-bold text-foreground">어떤 일이 있었나요?</h1><p className="mt-2 leading-7 text-foreground-muted">카테고리를 고르지 않고 상황을 적어주세요. 이름, 계좌번호, 인증번호는 입력하지 마세요.</p></header>
    <section className="rounded-card border border-border bg-surface p-5 sm:p-7">
      <p className="font-semibold">살펴볼 수 있는 주제</p><p className="mt-2 text-foreground-muted">카드 분실·부정사용 · 보이스피싱 · 무단이체 · 스미싱·악성앱</p><p className="mt-1 text-sm text-foreground-muted">공식 근거의 제공 범위는 상황과 검토된 자료에 따라 달라요.</p>
      <label htmlFor="situation" className="mt-6 block font-bold">상황 입력</label>
      <textarea id="situation" value={text} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={5} className="mt-2 w-full rounded-control border border-border bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      <p className="mt-3 text-sm text-foreground-muted">예시를 선택하면 입력창에 적용돼요.</p><div className="mt-2 flex flex-wrap gap-2">{examples.map((example) => <button key={example} type="button" onClick={() => setDraft(example)} className="min-h-11 rounded-control border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-focus">{example}</button>)}</div>
      <button type="button" disabled={busy || !text.trim() || text.length > 1000} onClick={() => save.mutate()} className="mt-5 min-h-12 rounded-control bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">{save.isPending ? "확인 중…" : "입력 내용 확인"}</button>
    </section>
    {message ? <p role="alert">{message}</p> : null}
    {!edited && state.situationText ? <section className="rounded-card border border-border bg-surface p-5 sm:p-7" aria-live="polite">
      {canConfirmIntake(state, draft) ? <><p>입력하신 내용이 다음 주제에 가까운가요?</p><p className="mt-2 font-bold">{labels[state.scenarioCandidates[0]] ?? "확인되지 않은 주제"}</p><p className="mt-2 text-sm text-foreground-muted">주제는 공식 근거의 적용이나 피해 사실을 확정하지 않아요.</p><button type="button" disabled={busy || !labels[state.scenarioCandidates[0]]} onClick={() => confirm.mutate()} className="mt-4 min-h-12 rounded-control bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">맞아요, 계속하기</button></> : null}
      {state.status === "NEEDS_CLARIFICATION" ? <p>상황을 구분하기 위해 내용을 조금 더 자세히 적어주세요.</p> : null}
      {state.status === "UNSUPPORTED_SCOPE" ? <p>현재 확인할 수 있는 자료의 범위를 벗어난 상황이에요. 내용을 수정하거나 공식 기관에 직접 확인해 주세요.</p> : null}
      {state.status === "READY" ? <Link href="/consultation/follow-up" className="inline-flex min-h-12 items-center font-bold text-primary underline">추가 질문으로 계속하기</Link> : null}
    </section> : null}
    {edited ? <p className="text-sm text-foreground-muted">수정한 내용을 저장하면 주제를 다시 확인해요.</p> : null}
    <Link href="/consultation/problem-category" className="inline-flex min-h-12 items-center text-primary underline">원하면 주제를 직접 선택하기</Link>
  </div>;
}
