"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFollowUpState, getInformationReport, prepareInformationReport } from "@/lib/api/consultation";
import { ApiContractError, ApiNetworkError, ApiResponseError } from "@/lib/api/errors";
import { useActiveConsultationQuery } from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";

const labels: Record<string, string> = {
  INSTITUTION: "금융회사", PRODUCT_TYPE: "상품·카드 종류", INCIDENT_DATE: "사건 날짜",
  TRANSACTION_DATE: "거래 날짜", SCENARIO: "피해 상황", INSTITUTION_UNCONFIRMED: "금융회사가 확인되지 않았어요",
  NO_APPROVED_INSTITUTION_CORPUS: "해당 금융회사의 검토된 자료가 부족해요",
  NO_APPROVED_CORPUS: "검토된 공식 자료가 부족해요", CARD_SCOPE_OUT_OF_SCOPE: "해당 카드 종류의 자료를 확인하지 못했어요",
  institution: "금융회사", productType: "상품·카드 종류", incidentDate: "사건 날짜", transactionDate: "거래 날짜",
  category: "상담 주제", scenario: "피해 상황",
  CARD: "카드", FINANCIAL_FRAUD: "금융사기", CARD_LOSS_UNAUTHORIZED_USE: "카드 분실·부정사용",
  VOICE_PHISHING_SUSPICIOUS_TRANSFER: "보이스피싱", UNAUTHORIZED_ACCOUNT_TRANSFER: "무단이체",
  PERSONAL_INFO_SMISHING_MALICIOUS_APP: "스미싱·악성앱", UNKNOWN: "미확인",
  CURRENT_READY_SOURCE_AND_HASH: "판본과 무결성 확인됨", V38_SCOPE_REVIEWED: "적용 범위 검토 기록 있음",
  NOT_DETERMINED: "사건 적용 미확인", NOT_ESTABLISHED: "미확인", NO_APPROVED_EVIDENCE: "승인된 근거 없음",
};

function label(value: string) { return labels[value] ?? value; }
function errorMessage(error: unknown) {
  if (error instanceof ApiResponseError && (error.status === 401 || error.status === 403)) return "인증 또는 상담 권한을 확인해 주세요.";
  if (error instanceof ApiResponseError && error.status === 404) return "상담을 찾을 수 없어요. 상담 내역을 확인해 주세요.";
  if (error instanceof ApiResponseError && error.status === 409) return "상담 내용이 변경됐어요. 추가 질문과 최신 입력을 확인한 뒤 다시 시도해 주세요.";
  if (error instanceof ApiNetworkError) return "서버에 연결하지 못했어요. 연결 상태를 확인해 주세요.";
  if (error instanceof ApiContractError) return "현재 상담의 최신 입력 상태를 확인하지 못했어요. 추가 질문 화면에서 다시 확인해 주세요.";
  return "정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export default function InformationReport() {
  const requestedId = useSearchParams().get("consultationId");
  const session = useSessionQuery();
  const active = useActiveConsultationQuery(!requestedId && session.isSuccess && session.data.hasActiveConsultation);
  const id = requestedId || active.data?.consultationId || null;
  const queryClient = useQueryClient();
  const key = ["information-report", id] as const;
  const report = useQuery({ queryKey: key, queryFn: () => getInformationReport(id!), enabled: !!id && session.isSuccess, refetchOnMount: "always", retry: false });
  const prepare = useMutation({
    mutationFn: async () => {
      if (!id) throw new ApiContractError("상담이 없습니다.");
      // The existing structured follow-up response supplies the revision. Never infer one.
      const current = await getFollowUpState(id);
      if (!Number.isSafeInteger(current.caseInputRevision) || current.caseInputRevision! < 0) {
        throw new ApiContractError("현재 입력 버전을 확인하지 못했습니다.");
      }
      return prepareInformationReport(id, current.caseInputRevision!);
    },
    onSuccess: (value) => queryClient.setQueryData(key, value),
  });
  const pending = session.isLoading || (!requestedId && session.data?.hasActiveConsultation && active.isLoading) || (!!id && report.isLoading);
  const error = prepare.error ?? report.error ?? active.error ?? session.error;
  const data = report.data;

  return <div className="space-y-6 pb-10">
    <header><Link href="/consultation/follow-up" className="inline-flex min-h-12 items-center font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">← 상담으로 돌아가기</Link>
      <h1 className="mt-3 text-2xl font-bold text-foreground">공식 금융정보</h1>
      <p className="mt-2 leading-7 text-foreground-muted">확인된 사실과 자료를 바탕으로 관련 정보를 살펴봐요. 자료가 내 상황에 적용되는지는 별도 확인이 필요해요.</p>
    </header>
    {pending ? <p role="status" aria-live="polite">상담과 정보를 확인하고 있어요.</p> : null}
    {!pending && !id && !error ? <p>진행 중인 상담이 없어요. 상담을 시작해 주세요.</p> : null}
    {error ? <div role="alert" className="rounded-card border border-danger bg-surface p-5"><p>{errorMessage(error)}</p><button type="button" onClick={() => { prepare.reset(); void report.refetch(); }} className="mt-3 min-h-11 font-bold text-primary underline">다시 확인</button></div> : null}
    {id && !pending ? <div className="flex flex-wrap gap-3">
      {!requestedId ? <button type="button" disabled={prepare.isPending} onClick={() => prepare.mutate()} className="min-h-12 rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{prepare.isPending ? "공식 정보를 찾고 있어요…" : "공식 정보 찾기"}</button> : null}
      <button type="button" disabled={report.isFetching} onClick={() => void report.refetch()} className="min-h-12 rounded-control border border-border bg-surface px-5 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">저장된 결과 다시 확인</button>
    </div> : null}
    {prepare.isPending ? <p role="status" aria-live="polite">자료와 적용 범위를 확인하고 있어요.</p> : null}
    {!error && !prepare.isPending && !report.isFetching && data ? <>
      {data.status === "STALE" ? <p role="alert" className="rounded-card border border-border bg-surface p-5">입력 내용이나 근거가 바뀌어 이전 결과를 표시할 수 없어요. 다시 확인해 주세요.</p> : null}
      {data.status === "NOT_FOUND" ? <p className="rounded-card border border-border bg-surface p-5">아직 저장된 정보 결과가 없어요.</p> : null}
      {data.status === "TEMPORARILY_UNAVAILABLE" ? <p role="alert">공식 자료 검색을 일시적으로 이용할 수 없어요.</p> : null}
      {data.status === "INSUFFICIENT_EVIDENCE" ? <p role="status">{data.snapshot?.missingFacts.length ? "추가로 확인할 정보가 있어요. 현재 표시할 수 있는 공식 근거도 없어요." : "현재 조건에서 확인된 공식 근거가 부족해요. 확인되지 않은 내용을 추측해 안내하지 않아요."}</p> : null}
      {!['READY_CANDIDATES', 'STALE', 'NOT_FOUND', 'TEMPORARILY_UNAVAILABLE', 'INSUFFICIENT_EVIDENCE'].includes(data.status) ? <p role="alert">결과 상태를 확인하지 못했어요. 다시 확인해 주세요.</p> : null}
      {data.snapshot && data.status !== "STALE" ? <section className="rounded-card border border-border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-bold">확인된 상황</h2>
        {data.snapshot.confirmedFacts.length ? <ul className="mt-3 space-y-2">{data.snapshot.confirmedFacts.map((fact, i) => <li key={`${fact.key}-${i}`} className="break-words">{label(fact.key)}: {fact.value ? label(fact.value) : "미확인"}</li>)}</ul> : <p className="mt-3 text-foreground-muted">표시할 확인된 사실이 없어요.</p>}
        {data.snapshot.missingFacts.length ? <p className="mt-4 leading-7">추가 확인 필요: {data.snapshot.missingFacts.map(label).join(", ")}</p> : null}
        {data.snapshot.coverageGaps.length ? <ul className="mt-3 list-inside list-disc text-foreground-muted">{data.snapshot.coverageGaps.map((gap) => <li key={gap}>{label(gap)}</li>)}</ul> : null}
      </section> : null}
      {data.status === "READY_CANDIDATES" ? <section className="space-y-4"><h2 className="text-xl font-bold">관련 공식 정보</h2>
        <p className="leading-7 text-foreground-muted">아래 설명은 자료 원문을 바탕으로 구성했어요. 자료 후보가 내 사건에 적용되는지는 확정되지 않았어요.</p>
        {data.generatedAt ? <p className="text-sm text-foreground-muted">결과 생성 시각: {new Date(data.generatedAt).toLocaleString("ko-KR")}</p> : null}
        <p className="text-sm text-foreground-muted">일반 출처의 시연용 여부는 이 응답에서 확인할 수 없어요.</p>
        {data.explanations.map((item) => {
          const source = data.selectedEvidence.find((e) => e.supportChunkId === item.supportChunkId);
          if (!source) return <p key={item.supportChunkId} role="alert">연결된 근거를 확인하지 못해 설명을 표시하지 않아요.</p>;
          const href = safeOfficialLink(source.canonicalUrl);
          return <article key={item.supportChunkId} className="rounded-card border border-border bg-surface p-5 sm:p-7">
            <p className="mb-2 text-sm text-foreground-muted">출처 신원: 확인되지 않음</p>
            <p className="text-sm font-bold text-primary">{source.scopeKind === "COMMON" ? "공통 정보" : source.scopeKind === "INSTITUTION_SPECIFIC" ? "기관별 정보" : "적용 범위 미확인"}</p>
            <p className="mt-3 whitespace-pre-wrap break-words leading-8">{item.easyText}</p>
            <p className="mt-2 text-sm text-foreground-muted">{item.mode === "EXTRACTIVE_FALLBACK" ? "원문 기반 대체 설명" : item.mode === "LEGACY_EXTRACTIVE" ? "이전 결과의 원문 기반 설명" : item.mode === "AI_SELECTED_TEMPLATE" ? "자료를 선택하고 원문을 바탕으로 구성한 설명" : "설명 방식 미확인"}</p>
            <details className="group mt-5 border-t border-border pt-4"><summary className="min-h-12 cursor-pointer rounded-control py-3 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">상세 출처와 조건 보기</summary>
              <dl className="space-y-2 break-words leading-7"><div><dt className="font-semibold">발행기관·문서</dt><dd>{source.organizationName} · {source.title}</dd></div>
                <div><dt className="font-semibold">판본과 위치</dt><dd>버전 {source.documentVersion} · {[source.articleReference, source.pageReference, source.supportLocator].filter(Boolean).join(" · ") || "미확인"}</dd></div>
                <div><dt className="font-semibold">적용 범위</dt><dd>{source.applicableInstitution ?? (source.scopeKind === "COMMON" ? "공통 정보" : "기관 미확인")} · {source.applicableProduct ?? "상품: 미확인"} · {source.applicabilityStartDate ?? "시작일 미확인"} ~ {source.applicabilityEndDate ?? "종료일 미확인"}</dd></div>
                <div><dt className="font-semibold">근거 원문</dt><dd>{source.supportText}</dd></div>
                <div><dt className="font-semibold">조건</dt><dd>{source.conditions.length ? source.conditions.map((x) => <p key={x.chunkId}>{x.locator}: {x.text}</p>) : "연결된 조건 없음"}</dd></div>
                <div><dt className="font-semibold">예외</dt><dd>{source.exceptions.length ? source.exceptions.map((x) => <p key={x.chunkId}>{x.locator}: {x.text}</p>) : "연결된 예외 없음"}</dd></div>
                <div><dt className="font-semibold">확인 상태</dt><dd>자료: {label(data.snapshot?.sourceIntegrityStatus ?? "미확인")} · 범위: {label(data.snapshot?.humanScopeReviewStatus ?? "미확인")} · {label(data.snapshot?.caseApplicabilityStatus ?? "미확인")}</dd></div>
              </dl>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-12 items-center font-semibold text-primary underline">공식 원문 열기 (새 창)</a> : <p className="mt-4">원문 링크를 확인할 수 없어요.</p>}
            </details>
          </article>;
        })}
      </section> : null}
    </> : null}
  </div>;
}
